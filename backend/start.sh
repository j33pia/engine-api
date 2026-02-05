#!/bin/bash
# Startup script for ACBrLib with proper X11 initialization

# Create runtime directory for X11
mkdir -p /tmp/runtime-root
chmod 700 /tmp/runtime-root

# Start Xvfb in background with specific display settings
Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to be ready
sleep 2

# Verify Xvfb is running
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "ERROR: Xvfb failed to start"
    exit 1
fi

echo "✓ Xvfb started successfully on display :99 (PID: $XVFB_PID)"

# Export display for all child processes
export DISPLAY=:99
export GDK_BACKEND=x11

# Now start the Node.js application
echo "Starting EngineAPI backend..."
exec npm run start:prod
