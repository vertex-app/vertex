#!/bin/bash

# VERTEX One-Click Install Script
# This script automates the deployment of VERTEX on Linux servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_INSTALL_DIR="/opt/vertex"
DEFAULT_PORT="3000"
VERTEX_IMAGE="lswl/vertex:stable"

# Global variables
INSTALL_DIR=""
CREATED_RESOURCES=()

# Print colored message
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        local docker_version
        docker_version=$(docker --version 2>/dev/null)
        print_success "Docker is installed: $docker_version"
        return 0
    else
        print_error "Docker is not installed."
        echo ""
        echo "Please install Docker first:"
        echo "  curl -fsSL https://get.docker.com | bash"
        echo ""
        echo "Or follow the official documentation:"
        echo "  https://docs.docker.com/engine/install/"
        return 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    # Check for docker compose (v2) first
    if docker compose version &> /dev/null; then
        local compose_version
        compose_version=$(docker compose version 2>/dev/null)
        print_success "Docker Compose is installed: $compose_version"
        return 0
    # Check for docker-compose (v1)
    elif command -v docker-compose &> /dev/null; then
        local compose_version
        compose_version=$(docker-compose --version 2>/dev/null)
        print_success "Docker Compose is installed: $compose_version"
        return 0
    else
        print_error "Docker Compose is not installed."
        echo ""
        echo "Please install Docker Compose:"
        echo "  # For Docker Compose V2 (recommended):"
        echo "  sudo apt-get update && sudo apt-get install docker-compose-plugin"
        echo ""
        echo "  # Or for standalone docker-compose:"
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        return 1
    fi
}

# Check all dependencies
check_dependencies() {
    print_info "Checking dependencies..."
    local has_error=0
    
    if ! check_docker; then
        has_error=1
    fi
    
    if ! check_docker_compose; then
        has_error=1
    fi
    
    if [ $has_error -eq 1 ]; then
        echo ""
        print_error "Missing dependencies. Please install them and run this script again."
        return 1
    fi
    
    print_success "All dependencies are installed."
    return 0
}


# Generate secure random password
# Generates a password with at least 16 characters using alphanumeric characters
generate_password() {
    local length=${1:-16}
    # Ensure minimum length of 16
    if [ "$length" -lt 16 ]; then
        length=16
    fi
    
    # Generate password using /dev/urandom with alphanumeric characters
    local password
    password=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length")
    
    # Verify the password meets requirements
    if [ ${#password} -lt 16 ]; then
        print_error "Failed to generate secure password"
        return 1
    fi
    
    echo "$password"
}

# Setup installation directory with proper permissions
setup_directories() {
    local install_dir="${1:-$DEFAULT_INSTALL_DIR}"
    INSTALL_DIR="$install_dir"
    
    print_info "Setting up installation directory: $install_dir"
    
    # Create main installation directory
    if [ ! -d "$install_dir" ]; then
        if ! mkdir -p "$install_dir"; then
            print_error "Failed to create installation directory: $install_dir"
            print_error "Try running with sudo or choose a different directory."
            return 1
        fi
        CREATED_RESOURCES+=("$install_dir")
        print_success "Created installation directory: $install_dir"
    else
        print_warning "Installation directory already exists: $install_dir"
    fi
    
    # Create data subdirectory for VERTEX data persistence
    local data_dir="$install_dir/data"
    if [ ! -d "$data_dir" ]; then
        if ! mkdir -p "$data_dir"; then
            print_error "Failed to create data directory: $data_dir"
            return 1
        fi
        CREATED_RESOURCES+=("$data_dir")
        print_success "Created data directory: $data_dir"
    fi
    
    # Set proper permissions (readable and writable by container)
    # Using 755 for directories to allow container access
    chmod 755 "$install_dir" 2>/dev/null || true
    chmod 755 "$data_dir" 2>/dev/null || true
    
    print_success "Directory setup completed."
    return 0
}

# Error handler function
# Displays descriptive error messages and suggests possible solutions
# Usage: handle_error <error_type> [additional_info]
# Error types: docker_missing, compose_missing, permission_denied, network_error,
#              container_failed, directory_failed, file_failed, unknown
handle_error() {
    local error_type="$1"
    local additional_info="${2:-}"
    
    echo ""
    print_error "Installation failed!"
    echo ""
    
    case "$error_type" in
        docker_missing)
            print_error "Docker is not installed on this system."
            echo ""
            echo "Possible solutions:"
            echo "  1. Install Docker using the official script:"
            echo "     curl -fsSL https://get.docker.com | bash"
            echo ""
            echo "  2. Install Docker manually:"
            echo "     - Ubuntu/Debian: sudo apt-get install docker.io"
            echo "     - CentOS/RHEL: sudo yum install docker"
            echo ""
            echo "  3. Follow the official documentation:"
            echo "     https://docs.docker.com/engine/install/"
            ;;
        compose_missing)
            print_error "Docker Compose is not installed on this system."
            echo ""
            echo "Possible solutions:"
            echo "  1. Install Docker Compose V2 plugin (recommended):"
            echo "     sudo apt-get update && sudo apt-get install docker-compose-plugin"
            echo ""
            echo "  2. Install standalone docker-compose:"
            echo "     sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
            echo "     sudo chmod +x /usr/local/bin/docker-compose"
            ;;
        permission_denied)
            print_error "Permission denied: ${additional_info:-Unable to access required resources}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Run the script with sudo:"
            echo "     sudo bash install.sh"
            echo ""
            echo "  2. Choose a different installation directory with write permissions:"
            echo "     bash install.sh -d ~/vertex"
            echo ""
            echo "  3. Add your user to the docker group:"
            echo "     sudo usermod -aG docker \$USER"
            echo "     (Log out and back in for changes to take effect)"
            ;;
        network_error)
            print_error "Network error: ${additional_info:-Unable to connect to required services}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check your internet connection"
            echo ""
            echo "  2. Check if Docker Hub is accessible:"
            echo "     curl -I https://hub.docker.com"
            echo ""
            echo "  3. If behind a proxy, configure Docker proxy settings:"
            echo "     https://docs.docker.com/config/daemon/systemd/#httphttps-proxy"
            echo ""
            echo "  4. Try pulling the image manually:"
            echo "     docker pull ${VERTEX_IMAGE}"
            ;;
        container_failed)
            print_error "Failed to start VERTEX container: ${additional_info:-Unknown error}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check container logs for details:"
            echo "     docker logs vertex"
            echo ""
            echo "  2. Check if the port is already in use:"
            echo "     netstat -tlnp | grep ${DEFAULT_PORT}"
            echo "     lsof -i :${DEFAULT_PORT}"
            echo ""
            echo "  3. Try using a different port:"
            echo "     bash install.sh -p 3001"
            echo ""
            echo "  4. Check Docker daemon status:"
            echo "     sudo systemctl status docker"
            ;;
        directory_failed)
            print_error "Failed to create directory: ${additional_info:-Unknown path}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check if you have write permissions to the parent directory"
            echo ""
            echo "  2. Run with sudo:"
            echo "     sudo bash install.sh"
            echo ""
            echo "  3. Choose a different installation directory:"
            echo "     bash install.sh -d ~/vertex"
            ;;
        file_failed)
            print_error "Failed to create or write file: ${additional_info:-Unknown file}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check disk space:"
            echo "     df -h"
            echo ""
            echo "  2. Check directory permissions:"
            echo "     ls -la ${INSTALL_DIR:-/opt/vertex}"
            echo ""
            echo "  3. Run with sudo:"
            echo "     sudo bash install.sh"
            ;;
        image_pull_failed)
            print_error "Failed to pull Docker image: ${additional_info:-${VERTEX_IMAGE}}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check your internet connection"
            echo ""
            echo "  2. Try pulling the image manually:"
            echo "     docker pull ${VERTEX_IMAGE}"
            echo ""
            echo "  3. Check Docker Hub status:"
            echo "     https://status.docker.com/"
            echo ""
            echo "  4. If using a mirror, verify mirror configuration"
            ;;
        *)
            print_error "An unexpected error occurred: ${additional_info:-Unknown error}"
            echo ""
            echo "Possible solutions:"
            echo "  1. Check the error message above for details"
            echo ""
            echo "  2. Review the installation logs"
            echo ""
            echo "  3. Try running the script again"
            echo ""
            echo "  4. Report the issue at:"
            echo "     https://github.com/vertex-app/vertex/issues"
            ;;
    esac
    
    echo ""
}

# Cleanup function - removes partially created resources on failure
# This function is called automatically on error (via trap) or manually
# It removes resources in reverse order (LIFO) to handle dependencies correctly
cleanup() {
    local force="${1:-false}"
    
    # Skip cleanup if no resources were created
    if [ ${#CREATED_RESOURCES[@]} -eq 0 ]; then
        if [ "$force" = "true" ]; then
            print_info "No resources to clean up."
        fi
        return 0
    fi
    
    print_warning "Cleaning up partially created resources..."
    
    local cleanup_failed=0
    
    # Stop any running containers first if docker-compose.yml exists
    if [ -n "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        print_info "Stopping any running containers..."
        cd "$INSTALL_DIR" 2>/dev/null || true
        if docker compose version &> /dev/null; then
            docker compose down 2>/dev/null || true
        elif command -v docker-compose &> /dev/null; then
            docker-compose down 2>/dev/null || true
        fi
        # Also try to remove the container directly if it exists
        docker rm -f vertex 2>/dev/null || true
    fi
    
    # Remove resources in reverse order (LIFO)
    # This ensures child resources are removed before parent directories
    for ((i=${#CREATED_RESOURCES[@]}-1; i>=0; i--)); do
        local resource="${CREATED_RESOURCES[$i]}"
        
        if [ -z "$resource" ]; then
            continue
        fi
        
        if [ -e "$resource" ]; then
            if [ -d "$resource" ]; then
                # Check if directory is empty or force removal
                if rm -rf "$resource" 2>/dev/null; then
                    print_info "Removed directory: $resource"
                else
                    print_warning "Failed to remove directory: $resource"
                    cleanup_failed=1
                fi
            elif [ -f "$resource" ]; then
                if rm -f "$resource" 2>/dev/null; then
                    print_info "Removed file: $resource"
                else
                    print_warning "Failed to remove file: $resource"
                    cleanup_failed=1
                fi
            fi
        else
            print_info "Resource already removed or does not exist: $resource"
        fi
    done
    
    # Clear the resources array
    CREATED_RESOURCES=()
    
    if [ $cleanup_failed -eq 0 ]; then
        print_success "Cleanup completed successfully."
    else
        print_warning "Cleanup completed with some warnings. Some resources may need manual removal."
    fi
    
    return $cleanup_failed
}

# Track a resource for cleanup
# Usage: track_resource <path>
track_resource() {
    local resource="$1"
    if [ -n "$resource" ]; then
        CREATED_RESOURCES+=("$resource")
    fi
}

# Trap for cleanup on error or interrupt
trap 'cleanup' ERR
trap 'echo ""; print_warning "Installation interrupted by user."; cleanup; exit 130' INT TERM

# Generate docker-compose.yml
generate_docker_compose() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    local compose_file="$install_dir/docker-compose.yml"
    
    print_info "Generating docker-compose.yml..."
    
    cat > "$compose_file" << EOF
version: '3'
services:
  vertex:
    image: ${VERTEX_IMAGE}
    container_name: vertex
    restart: always
    ports:
      - "${port}:3000"
    volumes:
      - ./data:/vertex
    environment:
      - TZ=Asia/Shanghai
EOF
    
    if [ $? -eq 0 ]; then
        CREATED_RESOURCES+=("$compose_file")
        print_success "Generated docker-compose.yml"
        return 0
    else
        print_error "Failed to generate docker-compose.yml"
        return 1
    fi
}

# Start services using docker-compose
start_services() {
    local install_dir="${1:-$INSTALL_DIR}"
    
    print_info "Starting VERTEX services..."
    
    cd "$install_dir"
    
    # Use docker compose v2 if available, otherwise fall back to docker-compose
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        print_success "VERTEX services started successfully."
        return 0
    else
        print_error "Failed to start VERTEX services."
        return 1
    fi
}

# Display installation result
show_result() {
    local install_dir="${1:-$INSTALL_DIR}"
    local port="${2:-$DEFAULT_PORT}"
    local password="${3:-}"
    
    echo ""
    echo "=============================================="
    print_success "VERTEX installation completed!"
    echo "=============================================="
    echo ""
    echo "Access URL: http://localhost:${port}"
    echo "           http://<your-server-ip>:${port}"
    echo ""
    if [ -n "$password" ]; then
        echo "Default Credentials:"
        echo "  Username: admin"
        echo "  Password: ${password}"
        echo ""
    fi
    echo "Useful Commands:"
    echo "  Start:   cd ${install_dir} && docker compose up -d"
    echo "  Stop:    cd ${install_dir} && docker compose down"
    echo "  Status:  cd ${install_dir} && docker compose ps"
    echo "  Logs:    cd ${install_dir} && docker compose logs -f"
    echo ""
    echo "Installation directory: ${install_dir}"
    echo "=============================================="
}

# Main installation function
main() {
    echo ""
    echo "=============================================="
    echo "       VERTEX One-Click Install Script       "
    echo "=============================================="
    echo ""
    
    # Parse arguments
    local install_dir="$DEFAULT_INSTALL_DIR"
    local port="$DEFAULT_PORT"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dir)
                install_dir="$2"
                shift 2
                ;;
            -p|--port)
                port="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  -d, --dir DIR    Installation directory (default: $DEFAULT_INSTALL_DIR)"
                echo "  -p, --port PORT  Port to expose VERTEX (default: $DEFAULT_PORT)"
                echo "  -h, --help       Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    if ! check_dependencies; then
        # Error messages already displayed by check_dependencies
        exit 1
    fi
    
    # Setup directories
    if ! setup_directories "$install_dir"; then
        handle_error "directory_failed" "$install_dir"
        cleanup
        exit 1
    fi
    
    # Generate password
    local password
    password=$(generate_password 16)
    if [ $? -ne 0 ] || [ -z "$password" ]; then
        handle_error "unknown" "Failed to generate secure password"
        cleanup
        exit 1
    fi
    
    # Generate docker-compose.yml
    if ! generate_docker_compose "$install_dir" "$port"; then
        handle_error "file_failed" "$install_dir/docker-compose.yml"
        cleanup
        exit 1
    fi
    
    # Start services
    if ! start_services "$install_dir"; then
        handle_error "container_failed" "Check docker logs for details"
        cleanup
        exit 1
    fi
    
    # Show result
    show_result "$install_dir" "$port" "$password"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
