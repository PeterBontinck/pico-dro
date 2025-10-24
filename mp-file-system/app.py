from lib.microdot import Microdot, Response, Request, send_file
from lib.websocket import with_websocket, WebSocket, WebSocketError

import _thread
import asyncio
from app_state import app, WLAN

from sys import print_exception

app = Microdot()
import app_state

@app.route('/')
def index(request):
    #return open('web_root/index_NoWWS.html').read(), 200, {'Content-Type': 'text/html'}
    return send_file('web_root/index_NoWWS.html', content_type='text/html')

@app.route('/favicon.ico')
def favicon(request):
    return send_file('web_root/favicon.ico', content_type='image/x-icon')

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
    
    