# LAMA Service - Docker Deployment Guide for Beginners

## Table of Contents
1. [Prerequisites and Environment Setup](#prerequisites-and-environment-setup)
2. [Basic Docker Deployment (UAT/Development)](#basic-docker-deployment-uatdevelopment)
3. [Production Server Deployment (With Firewall/Security)](#production-server-deployment-with-firewallsecurity)
4. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
5. [Network Configuration](#network-configuration)
6. [Security Hardening](#security-hardening)
7. [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)
8. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites and Environment Setup

### System Requirements Check

Before starting deployment, verify your system meets these requirements:

```bash
# Check OS version
cat /etc/os-release

# Check available disk space (need at least 10GB)
df -h

# Check available memory (need at least 4GB)
free -h

# Check if ports are available
netstat -tlnp | grep -E ':(6060|6001|80|443)'
```

### Docker Installation

#### For Ubuntu/Debian Systems:
```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
sudo apt update

# Install Docker Engine
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker-compose --version
```

#### For CentOS/RHEL Systems:
```bash
# Update system
sudo yum update -y

# Install required packages
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

**Important**: After adding user to docker group, logout and login again for changes to take effect.

---

## Basic Docker Deployment (UAT/Development)

### Scenario: UAT Server with No Restrictions

This is the simplest deployment scenario for testing environments.

#### Step 1: Prepare the Environment
```bash
# Create application directory
sudo mkdir -p /opt/lama
cd /opt/lama

# Set proper ownership
sudo chown -R $USER:$USER /opt/lama
```

#### Step 2: Get the Application Code
```bash
# Option A: If you have the code in a Git repository
git clone <your-repository-url> .

# Option B: If you have the code as a zip file
# Upload the zip file to the server and extract
unzip lama-application.zip
cd lama-application/

# Option C: If copying from another server
scp -r user@source-server:/path/to/lama/* /opt/lama/
```

#### Step 3: Verify Directory Structure
```bash
# Check if all required files are present
ls -la
# You should see:
# - docker-compose.yml
# - lamaAppBackend/
# - LamaFrontend_React/
# - lama_services/

# Verify docker-compose.yml exists and is readable
cat docker-compose.yml
```

#### Step 4: Create Required Directories and Files
```bash
# Create lama_volumes/dist directory if it doesn't exist
mkdir -p lama_services/lama_volumes/dist

# Create a basic configuration file if it doesn't exist
cat > lama_services/lama_volumes/dist/ConfigFile.Properties << 'EOF'
[DYNATRACE]
tenant_url = https://your-tenant.dynatrace.com
api_token = your-api-token-here
environment_id = your-environment-id

[API_ENDPOINTS]
primary_endpoint = https://api.example.com/data
timeout = 30

[SCHEDULING]
interval_minutes = 15
retry_attempts = 3
retry_delay = 60

[LOGGING]
log_level = INFO
max_log_size = 100MB
retention_days = 30
EOF

# Create logs directory
mkdir -p lama_services/lama_volumes/dist/logs

# Set proper permissions
chmod -R 755 lama_services/lama_volumes/dist
```

#### Step 5: Build and Deploy
```bash
# Build all services (this may take 10-15 minutes)
docker-compose build --no-cache

# Start all services in detached mode
docker-compose up -d

# Check if services are running
docker-compose ps

# Check logs for any errors
docker-compose logs
```

#### Step 6: Verify Deployment
```bash
# Check if services are accessible
curl -f http://localhost:6060/ || echo "Frontend not accessible"
curl -f http://localhost:6001/api/scheduler/status || echo "Backend not accessible"

# If using a remote server, replace localhost with server IP
curl -f http://YOUR_SERVER_IP:6060/ || echo "Frontend not accessible"
curl -f http://YOUR_SERVER_IP:6001/api/scheduler/status || echo "Backend not accessible"
```

---

## Production Server Deployment (With Firewall/Security)

### Scenario: Production Server with Strict Security

This scenario covers deployment on servers with firewalls, security policies, and restricted access.

#### Step 1: Security Assessment and Planning

```bash
# Check current firewall status
sudo ufw status
# or for CentOS/RHEL
sudo firewall-cmd --state

# Check SELinux status (if applicable)
sestatus

# Check current iptables rules
sudo iptables -L

# Check if Docker daemon is accessible
sudo docker info
```

#### Step 2: Firewall Configuration

##### For Ubuntu/Debian (UFW):
```bash
# Enable UFW if not already enabled
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow LAMA application ports
sudo ufw allow 6060/tcp comment 'LAMA Frontend'
sudo ufw allow 6001/tcp comment 'LAMA Backend'

# If using HTTPS/SSL
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 80/tcp comment 'HTTP redirect'

# Allow Docker daemon communication (if needed)
sudo ufw allow 2376/tcp comment 'Docker daemon'

# Check firewall status
sudo ufw status numbered
```

##### For CentOS/RHEL (firewalld):
```bash
# Check if firewalld is running
sudo systemctl status firewalld

# Start firewalld if not running
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Add LAMA ports
sudo firewall-cmd --permanent --add-port=6060/tcp --zone=public
sudo firewall-cmd --permanent --add-port=6001/tcp --zone=public

# If using HTTPS/SSL
sudo firewall-cmd --permanent --add-port=443/tcp --zone=public
sudo firewall-cmd --permanent --add-port=80/tcp --zone=public

# Reload firewall rules
sudo firewall-cmd --reload

# Check active rules
sudo firewall-cmd --list-all
```

#### Step 3: SELinux Configuration (if applicable)

```bash
# Check SELinux status
sestatus

# If SELinux is enforcing, configure it for Docker
sudo setsebool -P container_manage_cgroup on
sudo setsebool -P container_use_cgroup_namespace on

# Allow Docker to bind to network ports
sudo setsebool -P docker_connect_any on

# If you encounter permission issues, you might need to set SELinux to permissive temporarily
# sudo setenforce 0  # Only for troubleshooting - not recommended for production
```

#### Step 4: Secure Docker Configuration

```bash
# Create Docker daemon configuration for security
sudo mkdir -p /etc/docker

# Create secure Docker daemon configuration
sudo cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF

# Restart Docker daemon
sudo systemctl restart docker

# Verify Docker is running
sudo systemctl status docker
```

#### Step 5: Secure Application Deployment

```bash
# Create application directory with proper permissions
sudo mkdir -p /opt/lama
sudo chown -R $USER:docker /opt/lama
cd /opt/lama

# Copy application files (use secure methods)
# Option A: Using SCP from a secure source
scp -r user@secure-source:/path/to/lama/* /opt/lama/

# Option B: Using Git with SSH keys
git clone git@your-secure-repo:company/lama.git .

# Set restrictive permissions
chmod -R 750 /opt/lama
chmod 640 docker-compose.yml
```

#### Step 6: Environment-Specific Configuration

```bash
# Create production environment file
cat > .env << 'EOF'
# Production Environment Variables
COMPOSE_PROJECT_NAME=lama_prod
FLASK_ENV=production
NODE_ENV=production

# Security settings
FLASK_SECRET_KEY=your-very-secure-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Network settings
FRONTEND_PORT=6060
BACKEND_PORT=6001

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=90
EOF

# Secure the environment file
chmod 600 .env
```

#### Step 7: Production Docker Compose Override

```bash
# Create production override file
cat > docker-compose.prod.yml << 'EOF'
version: "3.9"

services:
  frontend:
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  scheduler:
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
```

#### Step 8: Deploy with Security Hardening

```bash
# Build with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Start services with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

---

## Step-by-Step Deployment Process

### Phase 1: Pre-Deployment Checklist

```bash
# Create deployment checklist script
cat > pre-deployment-check.sh << 'EOF'
#!/bin/bash

echo "=== LAMA Pre-Deployment Checklist ==="

# Check Docker installation
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "   ✓ Docker is installed: $(docker --version)"
else
    echo "   ✗ Docker is not installed"
    exit 1
fi

# Check Docker Compose installation
echo "2. Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "   ✓ Docker Compose is installed: $(docker-compose --version)"
else
    echo "   ✗ Docker Compose is not installed"
    exit 1
fi

# Check Docker service status
echo "3. Checking Docker service status..."
if systemctl is-active --quiet docker; then
    echo "   ✓ Docker service is running"
else
    echo "   ✗ Docker service is not running"
    exit 1
fi

# Check available disk space
echo "4. Checking disk space..."
AVAILABLE=$(df / | awk 'NR==2 {print $4}')
if [ $AVAILABLE -gt 10485760 ]; then  # 10GB in KB
    echo "   ✓ Sufficient disk space available"
else
    echo "   ✗ Insufficient disk space (need at least 10GB)"
    exit 1
fi

# Check available memory
echo "5. Checking available memory..."
MEMORY=$(free | awk 'NR==2{printf "%.0f", $7/1024/1024}')
if [ $MEMORY -gt 2 ]; then  # 2GB
    echo "   ✓ Sufficient memory available"
else
    echo "   ✗ Insufficient memory (need at least 2GB free)"
    exit 1
fi

# Check port availability
echo "6. Checking port availability..."
if ! netstat -tlnp | grep -q ':6060 '; then
    echo "   ✓ Port 6060 is available"
else
    echo "   ✗ Port 6060 is already in use"
    exit 1
fi

if ! netstat -tlnp | grep -q ':6001 '; then
    echo "   ✓ Port 6001 is available"
else
    echo "   ✗ Port 6001 is already in use"
    exit 1
fi

echo "=== All pre-deployment checks passed! ==="
EOF

chmod +x pre-deployment-check.sh
./pre-deployment-check.sh
```

### Phase 2: Application Setup

```bash
# Create application setup script
cat > setup-application.sh << 'EOF'
#!/bin/bash

echo "=== LAMA Application Setup ==="

# Create directory structure
echo "1. Creating directory structure..."
mkdir -p lama_services/lama_volumes/dist/{logs,config,data}
mkdir -p lamaAppBackend/logs
mkdir -p LamaFrontend_React/logs

# Set permissions
echo "2. Setting permissions..."
chmod -R 755 lama_services/lama_volumes/dist
chmod -R 755 lamaAppBackend
chmod -R 755 LamaFrontend_React

# Create configuration file if it doesn't exist
echo "3. Creating configuration files..."
if [ ! -f "lama_services/lama_volumes/dist/ConfigFile.Properties" ]; then
    cat > lama_services/lama_volumes/dist/ConfigFile.Properties << 'EOFCONFIG'
[DYNATRACE]
tenant_url = https://your-tenant.dynatrace.com
api_token = your-api-token-here
environment_id = your-environment-id

[API_ENDPOINTS]
primary_endpoint = https://api.example.com/data
backup_endpoint = https://backup.example.com/data
timeout = 30

[SCHEDULING]
interval_minutes = 15
retry_attempts = 3
retry_delay = 60

[LOGGING]
log_level = INFO
max_log_size = 100MB
retention_days = 30

[SECURITY]
enable_ssl = false
ssl_cert_path = /app/certs/cert.pem
ssl_key_path = /app/certs/key.pem
EOFCONFIG
    echo "   ✓ Configuration file created"
else
    echo "   ✓ Configuration file already exists"
fi

# Create environment file
echo "4. Creating environment file..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOFENV'
# LAMA Environment Configuration
COMPOSE_PROJECT_NAME=lama
FLASK_ENV=development
NODE_ENV=development

# Port Configuration
FRONTEND_PORT=6060
BACKEND_PORT=6001

# Logging Configuration
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30

# Security Configuration (change in production)
FLASK_SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
EOFENV
    echo "   ✓ Environment file created"
else
    echo "   ✓ Environment file already exists"
fi

echo "=== Application setup completed! ==="
EOF

chmod +x setup-application.sh
./setup-application.sh
```

### Phase 3: Build and Deploy

```bash
# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "=== LAMA Deployment Script ==="

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo "Checking $service_name health on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:$port/ > /dev/null 2>&1; then
            echo "   ✓ $service_name is healthy"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "   ✗ $service_name failed to become healthy"
    return 1
}

# Stop existing services
echo "1. Stopping existing services..."
docker-compose down --remove-orphans

# Clean up old images (optional)
echo "2. Cleaning up old Docker images..."
docker system prune -f

# Build services
echo "3. Building services (this may take several minutes)..."
docker-compose build --no-cache --parallel

if [ $? -ne 0 ]; then
    echo "   ✗ Build failed"
    exit 1
fi

# Start services
echo "4. Starting services..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "   ✗ Failed to start services"
    exit 1
fi

# Wait for services to be ready
echo "5. Waiting for services to be ready..."
sleep 30

# Check service health
echo "6. Checking service health..."
check_service_health "Frontend" 6060
FRONTEND_HEALTH=$?

check_service_health "Backend" 6001
BACKEND_HEALTH=$?

# Display service status
echo "7. Service status:"
docker-compose ps

# Display logs if there are issues
if [ $FRONTEND_HEALTH -ne 0 ] || [ $BACKEND_HEALTH -ne 0 ]; then
    echo "8. Service logs (last 50 lines):"
    docker-compose logs --tail=50
    exit 1
fi

echo "=== Deployment completed successfully! ==="
echo "Frontend URL: http://$(hostname -I | awk '{print $1}'):6060"
echo "Backend API: http://$(hostname -I | awk '{print $1}'):6001"
EOF

chmod +x deploy.sh
./deploy.sh
```

---

## Network Configuration

### Internal Network Setup

```bash
# Create custom Docker network for LAMA services
docker network create lama-network --driver bridge

# Update docker-compose.yml to use custom network
cat >> docker-compose.yml << 'EOF'

networks:
  lama-network:
    external: true
EOF
```

### Reverse Proxy Setup (Nginx)

For production deployments, it's recommended to use a reverse proxy:

```bash
# Install Nginx
sudo apt update
sudo apt install -y nginx

# Create Nginx configuration for LAMA
sudo cat > /etc/nginx/sites-available/lama << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Frontend proxy
    location / {
        proxy_pass http://localhost:6060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:6001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/lama /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### SSL/HTTPS Setup with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Security Hardening

### Container Security

```bash
# Create security-hardened docker-compose override
cat > docker-compose.security.yml << 'EOF'
version: "3.9"

services:
  frontend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID

  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID

  scheduler:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
EOF
```

### System Security

```bash
# Create system security hardening script
cat > harden-system.sh << 'EOF'
#!/bin/bash

echo "=== System Security Hardening ==="

# Update system packages
echo "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install security tools
echo "2. Installing security tools..."
sudo apt install -y fail2ban ufw unattended-upgrades

# Configure automatic security updates
echo "3. Configuring automatic security updates..."
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure fail2ban
echo "4. Configuring fail2ban..."
sudo cat > /etc/fail2ban/jail.local << 'EOFFAIL2BAN'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOFFAIL2BAN

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Secure shared memory
echo "5. Securing shared memory..."
echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" | sudo tee -a /etc/fstab

# Set up log monitoring
echo "6. Setting up log monitoring..."
sudo apt install -y logwatch
sudo logwatch --output mail --mailto root --detail high

echo "=== System hardening completed! ==="
EOF

chmod +x harden-system.sh
sudo ./harden-system.sh
```

---

## Troubleshooting Deployment Issues

### Common Issues and Solutions

#### Issue 1: Port Already in Use
```bash
# Find what's using the port
sudo netstat -tlnp | grep :6060
sudo lsof -i :6060

# Kill the process using the port
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
sed -i 's/6060:5000/6061:5000/' docker-compose.yml
```

#### Issue 2: Permission Denied Errors
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Fix application directory permissions
sudo chown -R $USER:docker /opt/lama
chmod -R 755 /opt/lama

# Fix SELinux context (if applicable)
sudo restorecon -R /opt/lama
```

#### Issue 3: Services Won't Start
```bash
# Check Docker daemon status
sudo systemctl status docker

# Check service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs scheduler

# Check system resources
free -h
df -h

# Restart Docker daemon
sudo systemctl restart docker
```

#### Issue 4: Network Connectivity Issues
```bash
# Check Docker networks
docker network ls

# Inspect Docker network
docker network inspect bridge

# Test internal connectivity
docker exec frontend ping backend
docker exec backend ping scheduler

# Check firewall rules
sudo ufw status
sudo iptables -L
```

### Debug Mode Deployment

```bash
# Create debug deployment script
cat > deploy-debug.sh << 'EOF'
#!/bin/bash

echo "=== LAMA Debug Deployment ==="

# Set debug environment
export FLASK_ENV=development
export NODE_ENV=development
export DEBUG=true

# Build with debug info
docker-compose build --no-cache

# Start with debug logging
docker-compose up --remove-orphans

# This will run in foreground with full logging
EOF

chmod +x deploy-debug.sh
```

---

## Post-Deployment Verification

### Comprehensive Health Check

```bash
# Create comprehensive health check script
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "=== LAMA Health Check ==="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Check Docker services
echo "1. Docker Services Status:"
docker-compose ps

# Check service health endpoints
echo "2. Service Health Checks:"

# Frontend health check
echo "   Frontend (Port 6060):"
if curl -f -s http://localhost:6060/ > /dev/null; then
    echo "   ✓ Frontend is accessible locally"
else
    echo "   ✗ Frontend is not accessible locally"
fi

if curl -f -s http://$SERVER_IP:6060/ > /dev/null; then
    echo "   ✓ Frontend is accessible externally"
else
    echo "   ✗ Frontend is not accessible externally"
fi

# Backend health check
echo "   Backend (Port 6001):"
if curl -f -s http://localhost:6001/api/scheduler/status > /dev/null; then
    echo "   ✓ Backend API is accessible locally"
else
    echo "   ✗ Backend API is not accessible locally"
fi

if curl -f -s http://$SERVER_IP:6001/api/scheduler/status > /dev/null; then
    echo "   ✓ Backend API is accessible externally"
else
    echo "   ✗ Backend API is not accessible externally"
fi

# Check scheduler service
echo "3. Scheduler Service:"
SCHEDULER_STATUS=$(curl -s http://localhost:6001/api/scheduler/status | grep -o '"running":[^,]*' | cut -d':' -f2)
if [ "$SCHEDULER_STATUS" = "true" ]; then
    echo "   ✓ Scheduler is running"
else
    echo "   ✗ Scheduler is not running"
fi

# Check log files
echo "4. Log Files:"
if [ -f "lama_services/lama_volumes/dist/lama_service.log" ]; then
    echo "   ✓ Scheduler log file exists"
    echo "   Last 5 log entries:"
    tail -5 lama_services/lama_volumes/dist/lama_service.log | sed 's/^/     /'
else
    echo "   ✗ Scheduler log file not found"
fi

# Check configuration
echo "5. Configuration:"
if [ -f "lama_services/lama_volumes/dist/ConfigFile.Properties" ]; then
    echo "   ✓ Configuration file exists"
else
    echo "   ✗ Configuration file not found"
fi

# System resources
echo "6. System Resources:"
echo "   Memory Usage:"
free -h | sed 's/^/     /'
echo "   Disk Usage:"
df -h / | sed 's/^/     /'

# Network connectivity
echo "7. Network Connectivity:"
if ping -c 1 google.com > /dev/null 2>&1; then
    echo "   ✓ Internet connectivity available"
else
    echo "   ✗ No internet connectivity"
fi

echo "=== Health Check Complete ==="
echo "Access URLs:"
echo "   Frontend: http://$SERVER_IP:6060"
echo "   Backend API: http://$SERVER_IP:6001"
EOF

chmod +x health-check.sh
./health-check.sh
```

### Monitoring Setup

```bash
# Create monitoring script for ongoing health checks
cat > monitor.sh << 'EOF'
#!/bin/bash

# Create monitoring log
MONITOR_LOG="/var/log/lama-monitor.log"
sudo touch $MONITOR_LOG
sudo chmod 644 $MONITOR_LOG

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if services are running
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6060/ || echo "000")
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6001/api/scheduler/status || echo "000")
    
    # Log status
    echo "$TIMESTAMP - Frontend: $FRONTEND_STATUS, Backend: $BACKEND_STATUS" | sudo tee -a $MONITOR_LOG
    
    # Alert if services are down
    if [ "$FRONTEND_STATUS" != "200" ] || [ "$BACKEND_STATUS" != "200" ]; then
        echo "$TIMESTAMP - ALERT: Service(s) down!" | sudo tee -a $MONITOR_LOG
        # Add notification logic here (email, Slack, etc.)
    fi
    
    sleep 300  # Check every 5 minutes
done
EOF

chmod +x monitor.sh

# Create systemd service for monitoring
sudo cat > /etc/systemd/system/lama-monitor.service << 'EOF'
[Unit]
Description=
