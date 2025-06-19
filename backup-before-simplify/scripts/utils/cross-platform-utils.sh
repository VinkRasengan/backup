#!/bin/bash

# Cross-platform OS detection and utilities
detect_os() {
    OS="unknown"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    fi
    echo $OS
}

# Platform-specific command availability
check_platform_commands() {
    local os=$(detect_os)
    
    case $os in
        "windows")
            # Windows-specific checks
            if ! command_exists tasklist; then
                print_warning "tasklist command not available on Windows"
            fi
            if ! command_exists netstat; then
                print_error "netstat not available - required for port checking"
                return 1
            fi
            ;;
        "linux"|"macos")
            # Unix-specific checks
            if ! command_exists ps; then
                print_error "ps command not available"
                return 1
            fi
            ;;
    esac
    return 0
}

# Cross-platform directory separator
get_path_separator() {
    local os=$(detect_os)
    if [[ "$os" == "windows" ]]; then
        echo "\\"
    else
        echo "/"
    fi
}

# Safe path joining
join_path() {
    local separator=$(get_path_separator)
    local result=""
    for arg in "$@"; do
        if [[ -z "$result" ]]; then
            result="$arg"
        else
            result="${result}${separator}${arg}"
        fi
    done
    echo "$result"
}
