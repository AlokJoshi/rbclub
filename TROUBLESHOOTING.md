# Quick Troubleshooting Guide for DigitalOcean Deployment

## The Most Common Issue: Native Module Compilation Errors

**Symptoms:**
- `Error: Cannot find module 'bcrypt'`
- `Error: Cannot find module 'better-sqlite3'`  
- Module was compiled against a different Node.js version
- `node-gyp` errors during installation

**Root Cause:**
The `bcrypt` and `better-sqlite3` modules contain native C++ code that must be compiled for your specific operating system. When you develop on Windows or macOS and then deploy to a Linux droplet, the compiled binaries won't work.

**Solution:**

### Quick Fix (run this on your droplet):
```bash
# Install build tools (only needed once per droplet)
sudo apt-get update
sudo apt-get install -y build-essential python3

# Rebuild native modules
cd /path/to/rbclub
npm run rebuild
# Or: npm rebuild bcrypt better-sqlite3
```

### Rebuild Script Available:
The `package.json` includes a `rebuild` script for easy native module rebuilding:

```bash
# After npm install, run:
npm run rebuild

# Or for production deployment:
npm run prepare:production
```

This rebuilds `bcrypt` and `better-sqlite3` modules for your Linux environment.

## Other Common Issues

### 1. Missing .env File

**Error:** Application crashes or returns undefined for configuration values

**Solution:**
```bash
cp .env.example .env
nano .env  # Edit with your actual values
```

### 2. Permission Errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Ensure your user owns the files
sudo chown -R $USER:$USER /path/to/rbclub

# Database file needs write permissions
chmod 644 mydb.sqlite
```

### 3. Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Option 1: Kill the process using the port
sudo lsof -i :3000
sudo kill -9 <PID>

# Option 2: Change the port in .env
echo "PORT=3001" >> .env
```

### 4. Application Doesn't Start on Boot

**Solution:** Use PM2 to manage your application

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name rbclub

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### 5. Can't Access Application from Outside the Droplet

**Check firewall settings:**
```bash
# Check if UFW is active
sudo ufw status

# If active, allow port 3000
sudo ufw allow 3000/tcp

# Or if using Nginx (port 80/443)
sudo ufw allow 'Nginx Full'
```

### 6. Database Locked Error

**Error:** `SQLITE_BUSY: database is locked`

**Solution:** The database file is already open by another process
```bash
# Find processes using the database
sudo lsof mydb.sqlite

# Or restart your application
pm2 restart rbclub
```

## Using the Automated Setup Script

For a fresh droplet, use the included setup script:

```bash
# Clone the repository
git clone https://github.com/AlokJoshi/rbclub.git
cd rbclub

# Run the setup script
chmod +x setup.sh
./setup.sh
```

This script will:
1. Install build tools
2. Check/install Node.js
3. Run npm install
4. Rebuild native modules
5. Create .env from template

## Verifying the Installation

After setup, verify everything works:

```bash
# Check Node.js version (should be 18.x or later)
node --version

# Check that native modules loaded
node -e "require('bcrypt'); require('better-sqlite3'); console.log('✓ Native modules OK')"

# Start the application
npm start
```

## Need More Help?

- Full deployment guide: See [DEPLOYMENT.md](DEPLOYMENT.md)
- Project documentation: See [README.md](README.md)
- Check application logs:
  - Direct: Check console output
  - PM2: `pm2 logs rbclub`
  - systemd: `sudo journalctl -u rbclub -f`

## Emergency Rollback

If something goes wrong:

```bash
# Stop the application
pm2 stop rbclub

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart
pm2 start rbclub
```
