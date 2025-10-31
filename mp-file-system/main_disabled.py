
import asyncio
import app_state, settings, app
import _thread
import time
import json
from quadratureEncoder import QuadratureEncoder
from sys import print_exception

def core1_set_axis(msg : str):
    
    axes_mapping ={
        "axes0":0,
        "axes1":1,
        "axes2":2
    }
    
    try:
        msg_dict = json.loads(msg)
        axes_str = msg_dict['set_axis']
        axes_index = axes_mapping[axes_str]
        
        value_float = float(msg_dict['value'])
        if (value_float > 9999.9 ):
            raise ValueError('Value is > 9999.9')
        value_scaled_int = int(round(value_float * settings.AXES_SETTINGS[axes_index]['PULSES_PER_MM']))
        
        return True, axes_index,  value_scaled_int
        
    except Exception as e:
        print(f"Error during core1_set_axis:")
        print_exception(e)
        return False, None, None
        


def core1_loop(_thread):
    print("Core1 Loop starting to poll encoders")

    
    axes_positions_core1 = [0] * settings.NO_AXES
    axes_positions_old = [0] * settings.NO_AXES
    axes_positions_changed = [False] * settings.NO_AXES
    msg_dict ={"changed_positions" : {}}
    msg_core1 = ""
    
    while True:
        
        try: 
            msg_dict["changed_positions"].clear() #reset dict
            updateMsg = False   
            for i in range(settings.NO_AXES):
                axes_positions_old[i] = axes_positions_core1[i]
                axes_positions_core1[i] += app_state.ENCODERS[i].poll_encoder()
                axes_positions_changed[i] = (axes_positions_old[i] != axes_positions_core1[i] )
                updateMsg |= axes_positions_changed[i]          
            
            axes_to_set = False
            app_state.axes_set_msg_lock.acquire()
            if app_state.axes_set:
                    axes_set_msg = app_state.axes_set_msg
                    app_state.axes_set = False
                    axes_to_set = True
            app_state.axes_set_msg_lock.release()
        
            if  axes_to_set:
                valid_axes_to_set, axes_index, axes_value =   core1_set_axis(axes_set_msg)
                if valid_axes_to_set:
                    axes_positions_core1[axes_index] = axes_value
                    axes_positions_changed[axes_index] = True
             
                    updateMsg = True 
                axes_to_set = False
            
            if not updateMsg:
                continue # no changes -> poll again
            
            for i in range(settings.NO_AXES):
                if axes_positions_changed[i]:
                    msg_dict["changed_positions"][f"ax{i}"] = axes_positions_core1[i]
                    
            msg_core1 = json.dumps(msg_dict)
            
            app_state.axes_change_msg_lock.acquire()
            app_state.axes_change_msg = msg_core1
            app_state.axes_changed = True
            app_state.axes_change_msg_lock.release()
            
        except Exception as e:
            print(f"Error during core1_Loop:")
            print_exception(e)
            time.sleep(5)
            
                    
                        
            #print(axes_positions_core1)
            time.sleep_ms(50)
        
    print("Core1 Loop to poll encoders stopped")
    

async def broadcast_scheduler_task():
    
    msg_core0 = ''
    do_broadcast = False
       
    while True:
        await  asyncio.sleep(0.1)
      
        #if not app_state.clients: 
        #    continue            
        
        if app_state.axes_change_msg_lock.acquire(False):
            
            if app_state.axes_changed:
                msg_core0 = app_state.axes_change_msg
                do_broadcast = True
                app_state.axes_changed = False
                
            app_state.axes_change_msg_lock.release()
            
            if do_broadcast:
                await app.broadcast(msg_core0)
                do_broadcast = False    

async def axis_set_core0(msg):
    while not app_state.axes_set_msg_lock.acquire(False):
        await asyncio.sleep(0.1) #keep trying to get lock after some delay
    app_state.axes_set_msg = msg
    app_state.axes_set = True
    app_state.axes_set_msg_lock.release

async def main():    
    try:
        _thread.start_new_thread(core1_loop, ('Core1_loop',))
        
        asyncio.create_task(broadcast_scheduler_task())
        
        await app.start_app()
        
    except RuntimeError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")  


if app_state.boot_success:
    print("Main is started")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("KeyboardInterrupt program stopped.")

else:
    print("Boot failed") 