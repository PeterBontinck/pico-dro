
import asyncio
import app_state, settings, app
import _thread
import time
from quadratureEncoder import QuadratureEncoder


def encoder_polling(_thread):
    print("Core1 Loop starting to poll encoders")

    
    axes_positions_core1 = [0,0,0]
    while True:
        for i in range(settings.NO_AXES):
            axes_positions_core1[i] += app_state.ENCODERS[i].poll_encoder()
        
        #print(axes_positions_core1)
        time.sleep_ms(500)
        
    
async def main():    
    try:
        _thread.start_new_thread(encoder_polling, ('Core1_loop',))
        
        await app.start_app()
     
        
    except RuntimeError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")  



print("main is started")
if app_state.boot_success:
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("KeyboardInterrupt program stopped.")

else:
    print("boot failed") 