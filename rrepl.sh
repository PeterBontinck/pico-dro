#!/bin/bash
#hard reset the machine and start the REPL bu mount the files on the PC

echo "Reseting the machine for a clean start"
{
mpremote exec "import machine; machine.reset()"
} > /dev/null 2>&1 #mpremote will lose connection and complain, but we don't want to see the errors
sleep 1 #wait for the reboot


mpremote mount mp-file-system/