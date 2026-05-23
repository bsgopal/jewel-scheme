# JewelScheme Installation Guide

## Port Conflict Prevention

### Before Installing or Running the Application

1. **Run Pre-Installation Cleanup**
   ```
   double-click: pre-install-cleanup.bat
   ```
   This will:
   - Stop all Node.js processes
   - Free up ports 3000, 3001, and 5000
   - Wait for ports to be fully released

### Port Configuration

- **Backend API**: Port 5000
- **Frontend React**: Port 3000
- **Port 3001**: Should remain free (not used by this application)

### If You Get "EADDRINUSE" Error

1. **Immediate Fix**:
   ```
   taskkill /f /im node.exe
   ```

2. **Check Port Usage**:
   ```
   double-click: port-manager.bat
   ```

3. **Clean Startup**:
   ```
   double-click: clean-start.bat
   ```

### Installation Steps

1. **Cleanup First**
   ```
   pre-install-cleanup.bat
   ```

2. **Install Backend Dependencies**
   ```
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```
   cd frontend
   npm install
   ```

4. **Configure Environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Update database and API credentials
   - Frontend environment is already configured

5. **Start Application**
   ```
   clean-start.bat
   ```

### Troubleshooting

- **Port 3001 Error**: This port is not used by the application. The error suggests another service is trying to use it.
- **Multiple Node Processes**: Use `taskkill /f /im node.exe` to stop all
- **Permission Issues**: Run Command Prompt as Administrator

### Development Workflow

1. Always run `pre-install-cleanup.bat` before starting development
2. Use `clean-start.bat` for reliable startup
3. Use `port-manager.bat` to check port status

## Application URLs

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:5000/api/health