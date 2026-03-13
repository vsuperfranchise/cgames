#!/bin/bash

# A script to automate the setup and launch of the x11vnc server
# on the host machine (e.g., Google Cloud Shell).
# The noVNC proxy will be run separately in a Docker container.

echo "--- VNC Host Setup Script ---"

# Function to stop existing VNC processes
stop_vnc() {
    echo "Stopping existing VNC server processes..."
    pkill -f "x11vnc -display"
    echo "Processes stopped."
}

# If the first argument is "stop", call the stop function and exit.
if [ "$1" == "stop" ]; then
    stop_vnc
    exit 0
fi

# Stop any previous instances.
stop_vnc

# --- 1. VNC Server Installation ---
echo "Updating package list and installing VNC server..."
sudo apt-get update
sudo apt-get install -y x11vnc
echo "Dependencies installed."

# --- 2. VNC Password Setup ---
echo "Please set a password for this VNC session."
x11vnc -storepasswd

# --- 3. VNC Server Startup ---
echo "Starting VNC server (x11vnc) in the background..."
# It will listen on port 5901.
nohup x11vnc -display :0 -forever -usepw -rfbport 5901 > /tmp/x11vnc.log 2>&1 &

echo ""
echo "--- VNC Server Started! ---"
echo "The VNC server is running on port 5901."
echo "Check /tmp/x11vnc.log and /tmp/novnc_proxy.log for any errors."