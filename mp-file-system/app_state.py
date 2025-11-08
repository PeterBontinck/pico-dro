# Copyright (c) 2025 Peter Bontinck
# SPDX-License-Identifier: MIT
# See LICENSE

import quadratureEncoder as qe, lib.microdot as md, hbwebsocket as ws
import _thread
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

#data send from Core 1 to core 0: updates encoder position
axes_change_msg_lock :_thread.RLock= None
axes_change_msg : str = None #under lock axes_change_msg_lock
axes_changed : bool = False #under lock axes_change_msg_lock

#data send from Core 0 to core 1: encoder position set by user
axes_set_msg_lock :_thread.RLock= None
axes_set_msg : str = None #under lock axes_set_msg_lock
axes_set : bool = False #under lock axes_set_msg_lock

#the wlan handler object
WLAN = None

#Microdot web server

core0LastMsg : str = ""

app : md.Microdot = None 

clients : Set[ws.HbWebSocket]= set()
