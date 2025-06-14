#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');

const isWindows = os.platform() === 'win32';
const projectRoot = __dirname;
const killOnly = process.argv.includes('--kill-only');

console.log('====================================');
if (killOnly) {
    console.log('FactCheck - Kill All Processes');
} else {
    console.log('FactCheck - Kill All Processes and Restart');
}
console.log('====================================');
console.log();

// Function to execute shell command
function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error && !options.ignoreError) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// Function to kill processes by port
async function killPort(port) {
    console.log(`Killing processes on port ${port}...`);
    
    try {
        if (isWindows) {
            // Windows: Use netstat and taskkill
            const { stdout } = await execCommand(`netstat -aon | findstr :${port}`, { ignoreError: true });
            const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) {
                    await execCommand(`taskkill /F /PID ${pid}`, { ignoreError: true });
                    console.log(`Killed PID ${pid} on port ${port}`);
                }
            }
        } else {
            // Unix: Use lsof and kill
            const { stdout } = await execCommand(`lsof -ti:${port}`, { ignoreError: true });
            const pids = stdout.trim().split('\n').filter(pid => pid && !isNaN(pid));
            
            for (const pid of pids) {
                await execCommand(`kill -9 ${pid}`, { ignoreError: true });
                console.log(`Killed PID ${pid} on port ${port}`);
            }
        }    } catch (error) {
        console.log(`No processes found on port ${port} or failed to kill: ${error.message}`);
    }
}

// Function to kill processes by name
async function killProcessesByName() {
    console.log('Killing Node.js processes...');
    
    try {
        if (isWindows) {
            await execCommand('taskkill /F /IM node.exe', { ignoreError: true });
            await execCommand('taskkill /F /IM npm.exe', { ignoreError: true });
            await execCommand('taskkill /F /IM nodemon.exe', { ignoreError: true });
        } else {
            await execCommand('pkill -f node', { ignoreError: true });
            await execCommand('pkill -f npm', { ignoreError: true });
            await execCommand('pkill -f nodemon', { ignoreError: true });
            await execCommand('pkill -f react-scripts', { ignoreError: true });
            await execCommand('pkill -f webpack', { ignoreError: true });
        }    } catch (error) {
        console.log(`Some processes may not have been killed (this is normal): ${error.message}`);
    }
}

// Function to start a process in a new terminal
function startInTerminal(title, command, cwd) {
    return new Promise((resolve) => {
        let terminalCommand;
        
        if (isWindows) {
            terminalCommand = `start "${title}" cmd /k "cd /d ${cwd} && ${command}"`;
        } else {
            // Try different terminal emulators for Unix systems
            const terminals = [
                `gnome-terminal --title="${title}" -- bash -c "cd '${cwd}' && ${command}; exec bash"`,
                `xterm -title "${title}" -e "bash -c 'cd ${cwd} && ${command}; exec bash'"`,
                `osascript -e 'tell app "Terminal" to do script "cd ${cwd} && ${command}"'`
            ];
            
            terminalCommand = terminals[0]; // Default to gnome-terminal
        }
        
        exec(terminalCommand, { ignoreError: true }, (error) => {
            if (error && !isWindows) {
                // If first terminal fails on Unix, try alternatives or background
                console.log(`Could not open terminal for ${title}, running in background...`);
                const backgroundProcess = spawn(command.split(' ')[0], command.split(' ').slice(1), {
                    cwd,
                    detached: true,
                    stdio: 'ignore'
                });
                backgroundProcess.unref();
            }
            resolve();
        });
    });
}

// Function to wait
function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Main execution
async function main() {
    try {
        console.log('Step 1: Killing existing processes...');
        console.log();
        
        // Kill processes by port
        await killPort(3000); // React
        await killPort(5000); // Express
        await killPort(9099); // Firebase Functions
        
        // Kill processes by name
        await killProcessesByName();
        
        console.log();        console.log('Waiting 3 seconds for processes to terminate...');
        await wait(3);
        
        if (killOnly) {
            console.log();
            console.log('====================================');
            console.log('Kill Process Complete!');
            console.log('====================================');
            console.log();
            console.log('All FactCheck processes have been terminated.');
            return;
        }
        
        console.log();
        console.log('Step 2: Starting fresh processes...');
        console.log();
        
        // Start backend
        console.log('Starting Backend Server...');
        const serverPath = path.join(projectRoot, 'server');
        await startInTerminal('FactCheck Backend', 'npm run dev', serverPath);
        
        console.log('Waiting 5 seconds for server to start...');
        await wait(5);
        
        // Start frontend
        console.log('Starting Frontend...');
        const clientPath = path.join(projectRoot, 'client');
        await startInTerminal('FactCheck Frontend', 'npm start', clientPath);
        
        console.log();
        console.log('====================================');
        console.log('Restart Complete!');
        console.log('====================================');
        console.log();
        console.log('Backend: http://localhost:5000');
        console.log('Frontend: http://localhost:3000');
        console.log();
        console.log('Both servers should be running.');
        console.log('Check the terminal windows for any error messages.');
        
    } catch (error) {
        console.error('Error during restart process:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
