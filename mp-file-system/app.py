from lib.microdot import Microdot, Response, Request, send_file, abort
from lib.websocket import with_websocket, WebSocket, WebSocketError

import _thread
import asyncio
import settings
from app_state import app, WLAN

from sys import print_exception

app = Microdot()
import app_state

@app.route('/')
def serve_index(request):
    #return open('web_root/index_NoWWS.html').read(), 200, {'Content-Type': 'text/html'}
    return send_file('web_root/index_NoWWS.html', content_type='text/html')

@app.route('/favicon.ico')
def serve_favicon(request):
    return send_file('web_root/favicon.ico', content_type='image/x-icon')

@app.route('/script.js')
def serve_javascript(request):
    return send_file('web_root/script.js', content_type='application/javascript')

@app.route('/calculator.js')
def serve_javascript(request):
    return send_file('web_root/calculator.js', content_type='application/javascript')

@app.route('/dro.js')
def serve_javascript(request):
    return send_file('web_root/dro.js', content_type='application/javascript')

@app.route('/style.css')
def serve_style(request):
    return send_file('web_root/style.css', content_type='text/css')

@app.route('/api/settings')
def serve_get_settings(request):
    
    try:     
        axes_settings = [
            {"name" : axis["NAME"],
            "divider" : axis["PULSES_PER_MM"],
            "displayPrecisionMm" :  axis["DISPLAY_PRECISION_MM"],
            "displayPrecisionInch" :  axis["DISPLAY_PRECISION_INCH"]
            }
            for axis in settings.AXES_SETTINGS[0:settings.NO_AXES]
        ]
        
        return  {
            "status": "success",
            "noAxes" : settings.NO_AXES,
            "isLathe" : settings.IS_LATHE, 
            "noDisplayDigits": settings.NO_DISPLAY_DIGITS,
            "axesSettings" : axes_settings
        }
    
    except Exception as e:
        print(f"Error from api:")
        print_exception(e)
        abort(500)
       
    

@app.route('/ws')
@with_websocket
async def ws(request:Request, ws : WebSocket): 
    app_state.clients.add(ws)
    print(f"Client: {request.client_addr} connected, Total: {len(app_state.clients)}")
    
    try:
        
        while True:
            client_data = await ws.receive()
            
            await asyncio.sleep(0.1)
            
            if client_data:
                print(f"Bericht ontvangen: {client_data}")
                await axes_set_core0(client_data) #send data to core1
               
           
            await asyncio.sleep(0.1)
    
    except WebSocketError as e:
        if e == 'Websocket connection closed':
            pass #the client disconnected, we cleanup under <finally:>
        
    except Exception as e:
        print(f"Error from websocket:")
        print_exception(e)
    
    finally:
        app_state.clients.remove(ws)
        print(f"Client: {request.client_addr} DIS-connected. Total: {len(app_state.clients)}")


async def start_app():
    print(f"starting webserver on http://{WLAN.ifconfig()[0]}:80")
    await app.run(host='0.0.0.0', port=80, debug=True)
    
async def broadcast(message):

    for ws in app_state.clients:
        try:
            await ws.send(message)
        except Exception as e:
            # Client connection lost
            print(f"Error from websocket:")
            print_exception(e)
            
   
async def axes_set_core0(msg):
    while not app_state.axes_set_msg_lock.acquire(False):
        await asyncio.sleep(0.1) #keep trying to get lock after some delay
    app_state.axes_set_msg = msg
    app_state.axes_set = True
    app_state.axes_set_msg_lock.release()
    
    