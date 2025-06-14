# Process Management Scripts

This directory contains several scripts to help you manage the FactCheck application processes across different platforms.

## Available Scripts

### npm Commands (Cross-Platform)

Run these from the project root directory:

```bash
# Kill all processes and restart both client and server
npm run restart-all

# Kill all processes only (no restart)
npm run kill-all

# Platform-specific restart (Windows)
npm run restart-all:windows

# Platform-specific restart (Unix/Linux/Mac)
npm run restart-all:unix
```

### Direct Script Execution

#### Cross-Platform (Node.js)
```bash
# Kill and restart all processes
node restart-all.js

# Kill all processes only
node restart-all.js --kill-only
```

#### Windows
```cmd
# Kill and restart all processes
restart-all.bat

# Kill all processes only
kill-all.bat

# Start all processes (original script)
start-factcheck.bat
```

#### Unix/Linux/Mac
```bash
# Kill and restart all processes
./restart-all.sh
```

## What These Scripts Do

### Kill Operations
- **Port 3000**: React development server
- **Port 5000**: Express.js backend server
- **Port 9099**: Firebase Functions (if running)
- **Process Names**: node.exe, npm.exe, nodemon.exe, react-scripts, webpack

### Restart Operations
1. Kill all existing processes (as above)
2. Wait 3 seconds for graceful termination
3. Start backend server (`npm run dev` in server directory)
4. Wait 5 seconds for backend to initialize
5. Start frontend (`npm start` in client directory)

## Usage Examples

### Quick Restart
```bash
npm run restart-all
```

### Kill Everything (Emergency Stop)
```bash
npm run kill-all
```

### Platform-Specific Usage

**Windows:**
```cmd
# Double-click restart-all.bat in File Explorer
# Or run from command prompt:
restart-all.bat
```

**Linux/Mac:**
```bash
# Make executable first (if needed):
chmod +x restart-all.sh

# Then run:
./restart-all.sh
```

## Troubleshooting

### If Scripts Don't Work
1. **Permissions**: Make sure scripts are executable on Unix systems
2. **Ports in Use**: Check if other applications are using ports 3000 or 5000
3. **Node.js**: Ensure Node.js and npm are installed and in PATH
4. **Terminal**: Some Unix systems may require different terminal emulators

### Manual Process Killing

**Windows:**
```cmd
# List processes using ports
netstat -aon | findstr :3000
netstat -aon | findstr :5000

# Kill by PID
taskkill /F /PID [PID_NUMBER]
```

**Unix/Linux/Mac:**
```bash
# List processes using ports
lsof -i :3000
lsof -i :5000

# Kill by port
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:5000)
```

## Notes

- Scripts will open new terminal windows for each process on Windows
- On Unix systems, attempts to use available terminal emulators (gnome-terminal, xterm, Terminal.app)
- If terminal windows can't be opened, processes will run in background
- Always check the terminal windows for error messages after restart
- The backend needs to start before the frontend for proper API connectivity

## Development Workflow

1. **During Development**: Use `npm run restart-all` when you need a fresh start
2. **When Switching Branches**: Use `npm run restart-all` to clear any cached state
3. **Emergency Stop**: Use `npm run kill-all` if processes become unresponsive
4. **Initial Setup**: Use the original `start-factcheck.bat` for detailed startup logs
