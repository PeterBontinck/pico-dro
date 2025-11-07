#from lib.microdot import Microdot, Response, Request, send_file, abort
from lib.websocket import with_websocket, WebSocket, WebSocketError
import asyncio
import settings
from sys import print_exception
from time import ticks_ms

class HbWebSocket(WebSocket):
    def __init__(self, request, socket, clientList):
        self.request = request
        self.ws= socket
        self.clientList = clientList
        self.last_pong = ticks_ms()
        self.ping_task = None
        

    async def _heartbeat_ping(self):
        
        sleep_time_s = settings.HARTBEAT_INTERVAL_MS / 1000.0
        while True:
            try:
                await asyncio.sleep(sleep_time_s)
                current_time = ticks_ms()
                
                if current_time - self.last_pong > settings.TIMEOUT_MS + settings.HARTBEAT_INTERVAL_MS:
                    await self.ws.close()
                    self.clientList.remove(self)
                    print(f"Heartbeat : No pong received in time, closing connection.")
                    print(f"Client: {self.request.client_addr} DIS-connected. Total: {len(self.clientList)}")   
                    break
                
                
                await self.ws.send('ping')
                
            except WebSocketError:
                print("Heartbeat: WebSocketError, stopping heartbeat pings.")
                break
            except Exception as e:
                print("Heartbeat: Exception during ping:")
                print_exception(e)
                break
            
    async def start_heartbeat(self):
        print("starting Heartbeat Job: ....")
        self.ping_task=asyncio.create_task(self._heartbeat_ping())
        
    async def stop_heartbeat(self):
        if self.ping_task:
                self.ping_task.cancel()
                
    
    def handle_pong(self):
        self.last_pong = ticks_ms() 