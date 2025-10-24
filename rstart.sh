#!/bin/bash
#start the app using the PC file system mounted to the pico

echo "run boot.py and main.py"
mpremote mount mp-file-system/ exec "import boot, main"