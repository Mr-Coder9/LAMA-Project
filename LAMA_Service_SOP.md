# LAMA Service - Standard Operating Procedure (SOP)

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Service Components](#service-components)
6. [Configuration Management](#configuration-management)
7. [Operations Guide](#operations-guide)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)
11. [Security Considerations](#security-considerations)

---

## Overview

**LAMA (Log Analysis and Monitoring Application)** is a comprehensive monitoring service that:
- Fetches data from Dynatrace on scheduled intervals
- Sends processed data to APIs specified in configuration files
- Provides a web-based UI for control, monitoring, and management
- Offers real-time log analysis and dashboard visualization
- Supports containerized deployment using Docker

### Key Features
- **Scheduled Data Collection**: Automated data fetching from Dynatrace
- **API Integration**: Configurable API endpoints for data transmission
- **Web Dashboard**: React-based frontend for monitoring and control
- **Log Management**: Comprehensive logging with categorization and analysis
- **Configuration Management**: Dynamic configuration updates via web UI
- **Container Orchestration**: Docker-based deployment with service isolation

---

## System Architecture

### Component Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Scheduler     │
│  (React App)    │◄──►│  (Flask API)    │◄──►│ (lama_service)  │
│   Port: 6060    │    │   Port: 6001    │    │  (Container)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │  Configuration  │    │   Dynatrace     │
│    (Users)      │    │     Files       │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Architecture
1. **Frontend Service** (`react_frontendV2`)
   - React-based web application
   - Provides user interface for monitoring and control
   - Communicates with backend via REST API

2. **Backend Service** (`flask_backendV2`)
   - Flask-based REST API server
   - Manages scheduler operations (start/stop/status)
   - Handles configuration management
   - Provides log file access and analysis

3. **Scheduler Service** (`lama_service`)
   - Core monitoring service
   - Fetches data from Dynatrace on scheduled intervals
   - Processes and sends data to configured APIs
   - Generates detailed logs for analysis

---

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu/CentOS recommended)
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Python**: 3.10 or higher (for development)
- **Node.js**: 18.x or higher (for development)

### Network Requirements
- **Outbound Internet Access**: Required for Dynatrace API calls
- **Port Availability**:
  - 6060: Frontend web interface
  - 6001: Backend API server
- **Firewall Configuration**: Allow inbound traffic on ports 6060 and 6001

### External Dependencies
- **Dynatrace Environment**: Valid Dynatrace tenant with API access
- **API Endpoints**: Target APIs for data transmission (configured in properties file)

---

## Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd LAMA
```

### 2. Directory Structure Verification
```
LAMA/
├── docker-compose.yml              # Main orchestration file
├── lamaAppBackend/                 # Flask backend service
│   ├── flask_backend.py           # Main backend application
│   ├── Dockerfile                 # Backend container definition
│   └── requirements.txt           # Python dependencies
├── LamaFrontend_React/            # React frontend service
│   ├── client/                    # React application source
│   ├── server/                    # Express server
│   ├── Dockerfile                 # Frontend container definition
│   └── package.json               # Node.js dependencies
└── lama_services/                 # Scheduler service
    ├── Dockerfile                 # Scheduler container definition
    ├── supervisor.conf            # Process management
    ├── requirements.txt           # Python dependencies
    └── lama_volumes/              # Service executables and configs
        └── dist/                  # Distribution files
            ├── lama_service       # Main scheduler executable
            ├── ConfigFile.Properties  # Configuration file
            └── logs/              # Log storage directory
```

### 3. Build and Deploy Services
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Initial Configuration
1. Access the web interface: `http://<server-ip>:6060`
2. Login with default credentials (if configured)
3. Navigate to Scheduler section
4. Configure Dynatrace connection and API endpoints

---

## Service Components

### Frontend Service (React Application)

**Purpose**: Provides web-based user interface for system management

**Key Features**:
- **Dashboard**: Real-time log analysis and visualization
- **Scheduler Control**: Start/stop/status management
- **Configuration Editor**: Dynamic configuration updates
- **Log Viewer**: Real-time log monitoring with filtering
- **Holiday Management**: Configure monitoring schedules
- **Threshold Configuration**: Set monitoring thresholds

**Technology Stack**:
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Radix UI components
- React Query for API state management

### Backend Service (Flask API)

**Purpose**: Provides REST API for frontend and manages scheduler operations

**Key Endpoints**:
```
POST /api/scheduler/start     # Start scheduler service
POST /api/scheduler/stop      # Stop scheduler service
GET  /api/scheduler/status    # Get scheduler status
GET  /api/scheduler/logs      # Retrieve scheduler logs
GET  /api/config             # Get configuration
POST /api/config             # Update configuration
GET  /api/log-files          # List log files by date
GET  /api/log-file-content   # Get specific log file content
GET  /api/logs/summary       # Get log summary statistics
```

**Key Functions**:
- Docker container management for scheduler service
- Configuration file management
- Log file parsing and analysis
- Real-time log streaming
- Authentication and session management

### Scheduler Service (Core Monitoring)

**Purpose**: Core service that performs scheduled data collection and processing

**Key Functions**:
- **Data Collection**: Fetches metrics from Dynatrace API
- **Data Processing**: Processes and formats collected data
- **API Integration**: Sends processed data to configured endpoints
- **Logging**: Generates detailed logs for monitoring and debugging
- **Error Handling**: Manages API failures and retry logic

**Process Management**:
- Managed by Supervisor for automatic restart
- PID file tracking for status monitoring
- Configurable scheduling intervals
- Graceful shutdown handling

---

## Configuration Management

### Configuration File Structure
The main configuration is stored in `ConfigFile.Properties` with the following sections:

```ini
[DYNATRACE]
tenant_url = https://your-tenant.dynatrace.com
api_token = your-api-token
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
```

### Configuration Management via Web UI

1. **Access Configuration Editor**:
   - Navigate to Scheduler page
   - Click "Edit Configuration" button

2. **Modify Settings**:
   - Update values in the web form
   - Validate configuration syntax
   - Save changes

3. **Apply Changes**:
   - Restart scheduler service to apply new configuration
   - Monitor logs for configuration validation

### Environment Variables

Key environment variables for container configuration:

```bash
# Backend Service
FLASK_APP=flask_backend.py
FLASK_ENV=development
DOCKERIZED=true

# Frontend Service
NODE_ENV=development
VITE_BACKEND_API_URL=http://192.168.12.23:6001
VITE_LOGS_API_URL=http://192.168.12.23:6001

# Scheduler Service
TZ=Asia/Kolkata
```

---

## Operations Guide

### Starting the System

1. **Full System Startup**:
```bash
cd /path/to/LAMA
docker-compose up -d
```

2. **Individual Service Startup**:
```bash
# Start specific service
docker-compose up -d frontend
docker-compose up -d backend
docker-compose up -d scheduler
```

3. **Verify Services**:
```bash
# Check service status
docker-compose ps

# Check service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f scheduler
```

### Stopping the System

1. **Graceful Shutdown**:
```bash
docker-compose down
```

2. **Force Stop**:
```bash
docker-compose down --timeout 10
```

3. **Stop Individual Service**:
```bash
docker-compose stop scheduler
```

### Service Management via Web UI

1. **Access Web Interface**:
   - Open browser: `http://<server-ip>:6060`
   - Login with credentials

2. **Scheduler Control**:
   - Navigate to "Scheduler" section
   - Use Start/Stop buttons for service control
   - Monitor real-time status and logs

3. **Configuration Updates**:
   - Click "Edit Configuration"
   - Modify settings as needed
   - Save and restart service

### Health Checks

**Automated Health Checks**:
```bash
# Check if services are responding
curl -f http://localhost:6060/ || echo "Frontend down"
curl -f http://localhost:6001/api/scheduler/status || echo "Backend down"
```

**Manual Health Verification**:
1. Frontend accessibility test
2. Backend API response test
3. Scheduler process verification
4. Log file generation check

---

## Monitoring & Logging

### Log Categories

The system generates logs in the following categories:

1. **Hardware**: System resource monitoring
2. **Network**: Network connectivity and API calls
3. **Database**: Data storage operations
4. **Application**: Application-level events
5. **Login/Logout**: Authentication events

### Log File Structure

```
lama_services/lama_volumes/dist/
├── lama_service.log              # Current day logs
├── logs/
│   ├── lama-DD-MM-YY.log        # Daily log files
│   └── archived/                # Archived logs
└── YYYY/
    └── Month/
        └── YYYY-Month-DD_*.txt  # Detailed daily logs
```

### Log Analysis Dashboard

**Access**: Web UI → Dashboard → Log Dashboard

**Features**:
- Real-time log statistics
- Category-wise error/success/warning counts
- Interactive charts and graphs
- Date-based log filtering
- Success rate calculations

**Key Metrics**:
- Total requests processed
- Success/failure/warning ratios
- Category-wise performance
- Trend analysis over time

### Real-time Monitoring

1. **Live Log Streaming**:
   - Access via Scheduler page
   - Real-time log updates
   - Fullscreen log viewer

2. **Status Monitoring**:
   - Service status indicators
   - Process ID tracking
   - Last update timestamps

3. **Alert Thresholds**:
   - Configurable error rate thresholds
   - Automatic notifications
   - Performance degradation alerts

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Scheduler Service Won't Start

**Symptoms**:
- Service status shows "Stopped"
- Start button doesn't work
- Error messages in logs

**Diagnosis**:
```bash
# Check container status
docker ps -a | grep lama_service

# Check container logs
docker logs lama_service

# Check configuration file
cat lama_services/lama_volumes/dist/ConfigFile.Properties
```

**Solutions**:
- Verify configuration file syntax
- Check Dynatrace API credentials
- Ensure network connectivity
- Restart Docker service if needed

#### 2. Frontend Not Accessible

**Symptoms**:
- Browser shows connection refused
- 502/503 error pages
- Service appears down

**Diagnosis**:
```bash
# Check frontend container
docker logs react_frontendV2

# Check port binding
netstat -tlnp | grep 6060

# Check service status
docker-compose ps frontend
```

**Solutions**:
- Restart frontend service
- Check port conflicts
- Verify Docker network configuration
- Check firewall settings

#### 3. Backend API Errors

**Symptoms**:
- API calls return 500 errors
- Configuration updates fail
- Log retrieval errors

**Diagnosis**:
```bash
# Check backend logs
docker logs flask_backendV2

# Test API endpoints
curl http://localhost:6001/api/scheduler/status

# Check file permissions
ls -la lama_services/lama_volumes/dist/
```

**Solutions**:
- Verify file permissions
- Check Docker socket access
- Restart backend service
- Validate configuration paths

#### 4. Log Files Not Generated

**Symptoms**:
- Empty log dashboard
- No log files in directories
- Missing log entries

**Diagnosis**:
```bash
# Check log directory permissions
ls -la lama_services/lama_volumes/dist/logs/

# Verify scheduler is running
docker exec lama_service ps aux

# Check supervisor status
docker exec lama_service supervisorctl status
```

**Solutions**:
- Fix directory permissions
- Restart scheduler service
- Check supervisor configuration
- Verify log rotation settings

### Debug Mode

**Enable Debug Logging**:
1. Update configuration: `log_level = DEBUG`
2. Restart services
3. Monitor detailed logs

**Collect Debug Information**:
```bash
# System information
docker-compose ps
docker-compose logs --tail=100

# Configuration dump
curl http://localhost:6001/api/config

# Service status
curl http://localhost:6001/api/scheduler/status
```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily Tasks
- Monitor service status via web dashboard
- Check error rates and success metrics
- Verify log file generation
- Review system resource usage

#### Weekly Tasks
- Analyze log trends and patterns
- Update configuration if needed
- Check disk space usage
- Verify backup procedures

#### Monthly Tasks
- Archive old log files
- Update system dependencies
- Review security configurations
- Performance optimization review

### Log Rotation and Cleanup

**Automated Log Rotation**:
```bash
# Configure logrotate for LAMA logs
sudo cat > /etc/logrotate.d/lama << EOF
/path/to/lama_services/lama_volumes/dist/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

**Manual Cleanup**:
```bash
# Remove logs older than 30 days
find lama_services/lama_volumes/dist/logs/ -name "*.log" -mtime +30 -delete

# Archive old logs
tar -czf logs_archive_$(date +%Y%m%d).tar.gz lama_services/lama_volumes/dist/logs/
```

### Backup Procedures

#### Configuration Backup
```bash
# Backup configuration files
cp lama_services/lama_volumes/dist/ConfigFile.Properties config_backup_$(date +%Y%m%d).properties

# Backup entire configuration directory
tar -czf lama_config_backup_$(date +%Y%m%d).tar.gz lama_services/lama_volumes/dist/
```

#### Database Backup (if applicable)
```bash
# Backup application data
docker-compose exec frontend npm run db:backup
```

### Updates and Upgrades

#### Application Updates
1. **Backup current configuration**
2. **Pull latest code changes**
3. **Rebuild containers**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
4. **Verify functionality**
5. **Monitor for issues**

#### Dependency Updates
```bash
# Update Python dependencies
pip install -r requirements.txt --upgrade

# Update Node.js dependencies
npm update
```

---

## Security Considerations

### Access Control

1. **Web Interface Security**:
   - Implement strong authentication
   - Use HTTPS in production
   - Configure session timeouts
   - Implement role-based access

2. **API Security**:
   - API key authentication
   - Rate limiting
   - Input validation
   - CORS configuration

3. **Container Security**:
   - Run containers as non-root users
   - Limit container capabilities
   - Use security scanning tools
   - Regular security updates

### Network Security

1. **Firewall Configuration**:
```bash
# Allow only necessary ports
ufw allow 6060/tcp  # Frontend
ufw allow 6001/tcp  # Backend
ufw deny 22/tcp     # SSH (if not needed)
```

2. **Network Isolation**:
   - Use Docker networks for service isolation
   - Implement network segmentation
   - Monitor network traffic

### Data Protection

1. **Sensitive Data Handling**:
   - Encrypt API tokens and credentials
   - Use environment variables for secrets
   - Implement data retention policies
   - Regular security audits

2. **Log Security**:
   - Sanitize sensitive data in logs
   - Implement log encryption
   - Secure log storage and transmission
   - Access logging and monitoring

### Compliance

1. **Data Privacy**:
   - GDPR compliance for EU data
   - Data anonymization where possible
   - Clear data retention policies
   - User consent management

2. **Audit Trail**:
   - Log all administrative actions
   - Track configuration changes
   - Monitor access patterns
   - Regular compliance reviews

---

## Appendix

### Quick Reference Commands

```bash
# Service Management
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose restart scheduler        # Restart scheduler
docker-compose logs -f backend         # Follow backend logs

# Health Checks
curl http://localhost:6060/            # Frontend health
curl http://localhost:6001/api/scheduler/status  # Backend health

# Configuration
docker exec flask_backendV2 cat /app/lama_services/lama_volumes/dist/ConfigFile.Properties

# Log Analysis
docker exec lama_service tail -f /app/lama_service.log
```

### Configuration Templates

**Basic ConfigFile.Properties Template**:
```ini
[DYNATRACE]
tenant_url = https://your-tenant.dynatrace.com
api_token = dt0c01.XXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
environment_id = your-environment-id

[API_ENDPOINTS]
primary_endpoint = https://api.example.com/metrics
timeout = 30

[SCHEDULING]
interval_minutes = 15
retry_attempts = 3

[LOGGING]
log_level = INFO
retention_days = 30
```

### Support and Documentation

- **Internal Documentation**: Check project README files
- **Log Analysis**: Use web dashboard for detailed analysis
- **Configuration Help**: Use web UI configuration editor
- **Troubleshooting**: Follow troubleshooting section above

---

*This SOP document should be reviewed and updated regularly to reflect system changes and improvements.*
