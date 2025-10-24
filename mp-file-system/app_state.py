import quadratureEncoder as qe, lib.microdot as md, lib.websocket as ws
try:
    from typing import Set
except:
    pass

#a collection of global variables 
boot_success :bool = None  

#Use create a new PIO State machine and incremented, increment after use
mutable_free_sm_id: list[int] = [0]   #we misuse a list of 1, to be able to pass by reference to functions

#List of QuadratureEncoder objects, index conform settings.AXES_SETTINGS
ENCODERS: list[qe.QuadratureEncoder] = []

#List of current position of the axes, index conform settings.AXES_SETTINGS
axes_positions : list[int] =[]

#the wlan handler object
WLAN = None

#Microdot web server

app : md.Microdot = None 

clients : Set[ws.WebSocket]= set()
