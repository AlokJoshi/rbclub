# Deployment Guide for DigitalOcean Droplet

This guide will help you deploy the rbclub application to a DigitalOcean droplet running Ubuntu/Debian.

## Prerequisites

Your DigitalOcean droplet needs:
- Ubuntu 20.04 or later (or Debian 10+)
- Node.js 18.x or later
- Build tools for compiling native modules

## Step 1: Install Required System Dependencies

The application uses `bcrypt` and `better-sqlite3`, which require native compilation. Install the necessary build tools:

```bash
# Update package list
sudo apt-get update

# Install Node.js build tools and dependencies
sudo apt-get install -y build-essential python3 git

# Install Node.js (if not already installed)
# Using NodeSource repository for latest LTS version
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 2: Clone the Repository

```bash
# Clone your repository
git clone https://github.com/AlokJoshi/rbclub.git
cd rbclub
```

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

Update the following variables in `.env`:
- `SESSION_SECRET`: Generate a random string (use `openssl rand -base64 32`)
- `ADMIN_IDS`: JSON array of admin user IDs, e.g., `["1","2"]`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`: Your SMTP settings
- `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`, `SPACES_BUCKET`: Your DigitalOcean Spaces credentials

## Step 4: Install Dependencies

```bash
# Install all dependencies
npm install

# Rebuild native modules for Linux (IMPORTANT on DigitalOcean)
npm run rebuild
# Or use the prepare:production script
npm run prepare:production
```

**Why rebuild?** The `bcrypt` and `better-sqlite3` modules contain native C++ code that must be compiled for your specific operating system. If you developed on Windows/macOS and deploy to Linux, you must rebuild these modules.

## Step 5: Start the Application

### Option A: Run Directly (for testing)
```bash
node server.js
```

### Option B: Use PM2 (recommended for production)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start server.js --name rbclub

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

### Option C: Use systemd service
Create a systemd service file:

```bash
sudo nano /etc/systemd/system/rbclub.service
```

Add the following content (adjust paths as needed):

```ini
[Unit]
Description=RBClub Node.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/rbclub
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:

```bash
sudo systemctl enable rbclub
sudo systemctl start rbclub
sudo systemctl status rbclub
```

## Common Issues and Solutions

### Issue 1: Native Module Compilation Errors

**Error:** `Error: Cannot find module 'bcrypt'` or similar for `better-sqlite3`

**Solution:**
```bash
# Install build tools
sudo apt-get install -y build-essential python3

# Rebuild native modules
npm rebuild bcrypt better-sqlite3

# Or reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Permission Denied Errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Ensure your user owns the application directory
sudo chown -R $USER:$USER /path/to/rbclub

# Or run with appropriate user permissions (not recommended to use root)
```

### Issue 3: Database File Permissions

**Error:** `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Ensure the database file and directory are writable
chmod 644 mydb.sqlite
chmod 755 .
```

### Issue 4: Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find and kill the process using port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Or change the PORT in your .env file
```

### Issue 5: Missing Environment Variables

**Error:** `undefined` values or application crashes on startup

**Solution:**
- Ensure `.env` file exists and contains all required variables from `.env.example`
- Check that `dotenv` is loading correctly (it's already configured in the code)
- Verify file permissions on `.env`: `chmod 600 .env`

## Setting Up a Reverse Proxy (Optional)

To run the application on port 80/443 using Nginx:

### Install Nginx
```bash
sudo apt-get install -y nginx
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/rbclub
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/rbclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Setting Up SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
```

## Monitoring and Logs

### Using PM2
```bash
# View logs
pm2 logs rbclub

# Monitor application
pm2 monit

# Restart application
pm2 restart rbclub
```

### Using systemd
```bash
# View logs
sudo journalctl -u rbclub -f

# Restart service
sudo systemctl restart rbclub
```

## Database Backup

```bash
# Create a backup of the SQLite database
cp mydb.sqlite mydb.sqlite.backup.$(date +%Y%m%d)

# Or use sqlite3 to create a SQL dump
sqlite3 mydb.sqlite .dump > backup.sql
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Install/update dependencies
npm install

# Rebuild native modules (important after git pull!)
npm rebuild bcrypt better-sqlite3

# Restart the application
pm2 restart rbclub
# Or: sudo systemctl restart rbclub
```

## Security Checklist

- [ ] Change `SESSION_SECRET` to a random string
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Set secure cookie settings (already configured in code)
- [ ] Configure firewall to only allow necessary ports
- [ ] Keep Node.js and npm updated
- [ ] Regularly backup the database
- [ ] Use HTTPS in production
- [ ] Don't commit `.env` file to git (already in `.gitignore`)
- [ ] Set proper file permissions on `.env`: `chmod 600 .env`

## Support

If you encounter issues not covered in this guide, check:
1. Application logs
2. System logs: `sudo journalctl -xe`
3. Node.js version: `node --version` (should be 18.x or later)
4. NPM version: `npm --version`
