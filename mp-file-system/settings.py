#axis
NO_AXES = 2 #Max 3
IS_LATHE = True  #for the fist axis a diameter mode will become available

AXES_SETTINGS = [
    {
        'NAME' : 'A',
        'PULSES_PER_MM' :200,
        'A_PIN' : 0, #GPIO pin op PICO
        'B_PIN' : 1,
        'FULL_PRECISION' : True #Full precision counts on all 4 quadrants,  uses two statemachines and is slower but 
    },
    {
        'NAME' : 'B',
        'PULSES_PER_MM' :200,
        'A_PIN' : 4,
        'B_PIN' : 5,
        'FULL_PRECISION' : True
    },
    {
        'NAME' : 'C',
        'PULSES_PER_MM' :200,
        'A_PIN' : 9,
        'B_PIN' : 8,
        'FULL_PRECISION' : True
    }
]

USE_STATIC_IP = True
STATIC_IP = "192.168.1.30"
NETMASK = '255.255.255.0'       
GATEWAY = '192.168.1.1'        
DNS_SERVER = '8.8.8.8'

USE_HOST_NAME = False
HOST_NAME = "PICO_DRO"

