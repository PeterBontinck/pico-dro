#axis
NO_AXES = 2 #Max 3
IS_LATHE = True  #for the fist axis a diameter mode will become available
NO_DISPLAY_DIGITS = 6 #excluding sign and decimal point
MAX_COUNT = 2**24 #the max value for the scale counter , should be smaller than the 32bit register

AXES_SETTINGS = [
    {
        'NAME' : 'X',
        'PULSES_PER_MM' :200,
        'A_PIN' : 0, #GPIO pin op PICO
        'B_PIN' : 1,
        'FULL_PRECISION' : True, #Full precision counts on all 4 quadrants,  uses two statemachines and is slower but 
        'DISPLAY_PRECISION_MM' : 3,
        'DISPLAY_PRECISION_INCH' : 4
    },
    {
        'NAME' : 'Z',
        'PULSES_PER_MM' :200,
        'A_PIN' : 4,
        'B_PIN' : 5,
        'FULL_PRECISION' : True,
        'DISPLAY_PRECISION_MM' : 3,
        'DISPLAY_PRECISION_INCH' : 4
    },
    {
        'NAME' : '-',
        'PULSES_PER_MM' :200,
        'A_PIN' : 9,
        'B_PIN' : 8,
        'FULL_PRECISION' : True,
        'DISPLAY_PRECISION_MM' : 3,
        'DISPLAY_PRECISION_INCH' : 4
    }
]

USE_STATIC_IP = True
STATIC_IP = "192.168.1.30"
NETMASK = '255.255.255.0'       
GATEWAY = '192.168.1.1'        
DNS_SERVER = '8.8.8.8'

USE_HOST_NAME = False
HOST_NAME = "PICO_DRO"

HARTBEAT_INTERVAL_MS = 3000  #interval in milliseconds to send heartbeat to connected clients
TIMEOUT_MS = 2000  #time in milliseconds after which a client is disconnected when no pong after heartbeat is received
