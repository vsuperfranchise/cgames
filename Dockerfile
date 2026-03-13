# Use a base image with Python for the websockify proxy and git to clone noVNC
FROM python:3.9-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Clone the official noVNC repository, which contains the web server and proxy.
# The '.' at the end clones it into the current directory (/app).
RUN git clone https://github.com/novnc/noVNC.git .

# Add execute permissions to the launch script
RUN chmod +x ./utils/novnc_proxy

#
# This is the "file mount" part:
# Copy the application files from your GitHub repository into the container's
# /app directory, overwriting the default noVNC files where they overlap.
#
COPY app.js .
COPY index.html . 
COPY vnc.html . 
COPY novnc-stub.js . 
# Add any other files like styles.css or images here
# COPY styles.css .
# Expose the port the web server will run on
EXPOSE 8080

# The command to start the web server and proxy.
# It listens on all interfaces (0.0.0.0) on port 8080.
# The VNC_SERVER_HOST variable will be configured in Choreo to point
# to your VNC service component.
CMD ["./utils/novnc_proxy", "--vnc", "${VNC_SERVER_HOST}:5901", "--listen", "0.0.0.0:8080"]