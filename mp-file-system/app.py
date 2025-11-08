# Copyright (c) 2025 Peter Bontinck
# SPDX-License-Identifier: MIT
# See LICENSE

from lib.microdot import Microdot, Response, Request, send_file, abort
from lib.websocket import with_websocket, WebSocket, WebSocketError
from hbwebsocket import HbWebSocket

import _thread
import asyncio
import settings
from app_state import app, WLAN

from sys import print_exception

app = Microdot()
import app_state

INDEX_FILE = 'web_root/index_NoWWS.html'
FAFVICON_FILE = 'web_root/static/img/favicon.ico'
STATIC_FOLDER = 'web_root/static'

@app.route('/')
def serve_index(request):
    #return open('web_root/index_NoWWS.html').read(), 200, {'Content-Type': 'text/html'}
    return send_file(INDEX_FILE, content_type='text/html')

@app.route('/favicon.ico')
def serve_favicon(request):
    return send_file(FAFVICON_FILE, content_type='image/x-icon')

@app.route('/static/<path:path>')
def static_files(request, path):
    print(f"Serving static file: {STATIC_FOLDER + '/' + path}")
    return send_file(STATIC_FOLDER + '/' + path)

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
            "axesSettings" : axes_settings,
            "heartbeatTimeoutMs": settings.HEARTBEAT_INTERVAL_MS + settings.TIMEOUT_MS
        }
    
    except Exception as e:
        print(f"Error from api:")
        print_exception(e)
        abort(500)
       
    

@app.route('/ws')
@with_websocket
async def ws(request:Request, ws:WebSocket): 
    
    hbws = HbWebSocket(request, ws, app_state.clients)
    app_state.clients.add(hbws)
    print(f"Client: {request.client_addr} connected, Total: {len(app_state.clients)}")
    await hbws.start_heartbeat()

    try:
        
        await hbws.ws.send(app_state.core0LastMsg)
        
        while True:
            client_data = await hbws.ws.receive()
            
            if client_data == 'pong':
                hbws.handle_pong()
                print(f"pong received : {request.client_addr}")
                continue
            
            await asyncio.sleep(0.1)
            
            if client_data:
                print(f"Bericht ontvangen: {request.client_addr} : {client_data}")
                await axes_set_core0(client_data) #send data to core1
               
           
            await asyncio.sleep(0.1)
    
    except WebSocketError as e:
        if e == 'Websocket connection closed':
            pass #the client disconnected, we cleanup under <finally:>
        
    except Exception as e:
        print(f"Error from websocket:")
        print_exception(e)
    
    finally:
        await hbws.stop_heartbeat()
        if hbws in app_state.clients:
            app_state.clients.remove(hbws)
            print(f"Client: {request.client_addr} DIS-connected. Total: {len(app_state.clients)}")


async def start_app():
    print(f"starting webserver on http://{WLAN.ifconfig()[0]}:80")
    await app.run(host='0.0.0.0', port=80, debug=True)
    
async def broadcast(message):

    for hbws in app_state.clients:
        try:
            await hbws.ws.send(message)
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
    

