# Copyright (c) 2025 Peter Bontinck
# SPDX-License-Identifier: MIT
# See LICENSE

print("Booting up the Pico")


from machine import Pin
from quadratureEncoder import QuadratureEncoder
import network
import _thread

import time
from sys import print_exception

#initilaze the encoders
 
import settings , app_state, wifi_secret

def init_encoders():
    for ax in settings.AXES_SETTINGS[0:settings.NO_AXES]:
        try:
            a_pin = Pin(ax["A_PIN"], Pin.IN, Pin.PULL_DOWN)
            b_pin = Pin(ax["B_PIN"], Pin.IN, Pin.PULL_DOWN)

            q=  QuadratureEncoder(
                ax["A_PIN"],
                ax["B_PIN"],
                app_state.mutable_free_sm_id)
            
            app_state.ENCODERS.append(q)
                       
            print(f"Encoder initialized, settings: {ax}")
                    
        except Exception as e:
            print(f"Error during initialization of encoder name:{ax["NAME"]} , {e}")
            print_exception(e)
            return False
        
    return True

def init_wlan():
    print(f"Connecting to WLAN : {wifi_secret.UUID}")
    try:  
        app_state.WLAN = network.WLAN(network.STA_IF)
        app_state.WLAN.active(True)
        if settings.USE_STATIC_IP:
            app_state.WLAN.ifconfig((settings.STATIC_IP, settings.NETMASK, settings.GATEWAY, settings.DNS_SERVER))
            
        app_state.WLAN.connect(wifi_secret.UUID, wifi_secret.WIFI_PSWD)
        max_wait = 10000 #ms
        
        while not app_state.WLAN.isconnected() and max_wait > 0:
            print(".", end="")
            time.sleep_ms(100) 
            max_wait -= 100 #ms
        
        if app_state.WLAN.isconnected(): 
            print("\n Connection Succesfull!")
            return True
        else:
            print(f"\n No Connection after timeout")
            return False
        
        
    except Exception as e:
        print(f"Error during initialization of wlan:")
        print_exception(e)
        return False
        
def make_resource_locks():
    try:
        app_state.axes_change_msg_lock = _thread.allocate_lock()
        app_state.axes_set_msg_lock = _thread.allocate_lock()
        print('Resource locks for inter core data transport, initialized')
        return True
    except Exception as e:
        print(f"Error during initialization of resource locks:")
        print_exception(e)
        return False
    


app_state.boot_success = init_encoders()
app_state.boot_success &= init_wlan()
app_state.boot_success &= make_resource_locks()

try:
    import main_disabled
except:
    print('main.py should start automatic')