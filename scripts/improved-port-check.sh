#!/bin/bash

# Improved cross-platform port checking
check_port() {
    local port=$1
    
    # Detect OS
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash/MSYS2/Cygwin)
        if netstat -an 2>/dev/null | grep -q ":$port "; then
            return 1
        fi
    else
        # Linux/macOS
        if command_exists lsof; then
            if lsof -i :$port >/dev/null 2>&1; then
                return 1
            fi
        elif command_exists netstat; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                return 1
            fi
        elif command_exists ss; then
            if ss -tuln 2>/dev/null | grep -q ":$port "; then
                return 1
            fi
        fi
    fi
    return 0
}

# Improved process killing
kill_port() {
    local port=$1
    print_status "Attempting to free port $port..."
    
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows approach
        local pid=$(netstat -ano 2>/dev/null | grep ":$port " | head -1 | awk '{print $NF}')
        if [ -n "$pid" ] && [ "$pid" != "0" ]; then
            taskkill //PID $pid //F 2>/dev/null || true
            print_success "Killed process on port $port"
        fi
    else
        # Unix approach
        if command_exists lsof; then
            local pid=$(lsof -t -i:$port 2>/dev/null || true)
            if [ -n "$pid" ]; then
                kill -9 $pid 2>/dev/null || true
                print_success "Killed process on port $port"
            fi
        fi
    fi
}
