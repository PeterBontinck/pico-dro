# WORK IN PROGRESS (WIP) - Digital Readout (DRO) via Web Interface using Raspberry Pi Pico W

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
* **Install microPython on the Pico w:**  see https://www.raspberrypi.com/documentation/microcontrollers/micropython.html
* **Install depencencys:** run install_dep.sh in a **bash** terminal

* **Copy the to the pico:** <TODO> , run xxxx.sh in a **bash** teminal

---

### Tags

`raspberry-pi-pico-w` `dro` `digital-readout` `linear-scale` `micropython` `web-interface` `machine-tool`