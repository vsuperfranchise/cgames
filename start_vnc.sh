#!/bin/bash

# A script to automate the setup and launch of a VNC Playground
# in the Google Cloud Shell environment.

echo "--- VNC & noVNC Setup Script ---"

# Function to stop existing VNC processes
stop_vnc() {
    echo "Stopping existing VNC and noVNC processes..."
    pkill -f "x11vnc -display"
    pkill -f "novnc_proxy"
    echo "Processes stopped."
}

# If the first argument is "stop", call the stop function and exit.
if [ "$1" == "stop" ]; then
    stop_vnc
    exit 0
fi

# Stop any previous instances before starting new ones.
stop_vnc

# --- 1. Application Installation ---
# Cloud Shell VMs are ephemeral, so dependencies must be installed on startup.
echo "Updating package list and installing dependencies..."
sudo apt-get update

# Install VNC server
sudo apt-get install -y x11vnc

#
# >>> ADD YOUR GAME/APP INSTALLATIONS HERE <<<
# For example, to install the game "supertuxkart":
# sudo apt-get install -y supertuxkart
#
# To install a simple editor and browser:
# sudo apt-get install -y gedit firefox-esr
#

echo "Dependencies installed."

# --- 2. VNC Password Setup ---
echo "Please set a password for this VNC session."
x11vnc -storepasswd

# --- 3. Server Startup ---
NOVNC_DIR="/home/solomonubani1987/noVNC"

if [ ! -d "$NOVNC_DIR" ]; then
    echo "noVNC directory not found at $NOVNC_DIR. Please clone it first."
    exit 1
fi

cd "$NOVNC_DIR" || exit

# --- 3a. Copy Custom UI Files ---
echo "Copying custom UI files (index.html, app.js) into the web server directory..."
cp /home/solomonubani1987/index.html .
cp /home/solomonubani1987/app.js .
# Add any other assets like CSS or images here

echo "Starting VNC server (x11vnc) in the background..."
# Use nohup to keep it running and use the password file we just created.
nohup x11vnc -display :0 -forever -usepw -rfbport 5901 > /tmp/x11vnc.log 2>&1 &

echo "Starting noVNC proxy (websockify) in the background..."
# The proxy listens on port 8080 and forwards traffic to the VNC server on 5901.
nohup ./utils/novnc_proxy --vnc localhost:5901 --listen 0.0.0.0:8080 > /tmp/novnc_proxy.log 2>&1 &

echo ""
echo "--- Setup Complete! ---"
echo "Your VNC server and proxy are running in the background."
echo "Click the 'Web Preview' button in the Cloud Shell toolbar and select 'Preview on port 8080'."
echo "Use the password you just set to connect."
echo "Check /tmp/x11vnc.log and /tmp/novnc_proxy.log for any errors."
echo ""
echo "To stop the servers, run: bash /home/solomonubani1987/start_vnc.sh stop"