# Digital Readout (DRO) via Web Interface using Raspberry Pi Pico W

This project transforms a **Raspberry Pi Pico W** into a fully functional **Digital Readout (DRO)** system for machine tools (e.g., mills or lathes). It achieves this by reading the data output from **linear glass scales** and serving the measurements over a **web interface**.

## Key Features

* **Wireless Connectivity:** Utilizes the Pico W's Wi-Fi capabilities to host the DRO display.
* **Linear Scale Interfacing:** Implements fast, precise code for reading the TTL quadrature signal from common linear scales.
* **Web-Based Interface:** Allows users to view and reset the axis coordinates from any device (PC, tablet, or phone) on the local network via a simple browser page.
* **Axis Support:** Designed to be easily expandable for multi-axis DRO systems (2-axis, 3-axis, etc.).

## Technologies

* **Hardware:** Raspberry Pi Pico W
* **Firmware:** MicroPython
* **Scales:** TTL Linear Glass Scales (e.g., Vevor, ... )


## Get started
* **Install Python3:** Make sure the latest version of Python is installed on your pc
* **Make sure the pico W flash is empty**  see https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#resetting-flash-memory
* **Install microPython on the Pico W:**  see https://www.raspberrypi.com/documentation/microcontrollers/micropython.html

* **Install mpremote:**   pip install mpremote (see https://docs.micropython.org/en/latest/reference/mpremote.html)
* **Download or Clone project :**  (see https://github.com/PeterBontinck/pico-dro.git) 
* **config your wifi settings** in a file  `..\Pico-dro\mp-file-system/wifi_secret.py`
* **Configure the firmware** update the file `..\Pico-dro\mp-file-system/settings.py`
* **Connect the Pico2W :** via USB to your computer 
* **In a terminal go to the project directory :** `..\Pico-dro>`
* **Use mpremote to upload the firmware to the Pico W:**  `mpremote fs cp -r mp-file-system/. :`
* **The Pico W will now automatically connect to your wifi network, start the webserver on every power-up** 

---

### Tags

`raspberry-pi-pico-w` `dro` `digital-readout` `linear-scale` `micropython` `web-interface` `machine-tool`