# Bridge Club Management System

A web-based management system for bridge clubs with member management, mailing lists, and event coordination.

## Features

- Member directory and profile management
- User authentication with password reset
- Mailing list management
- File uploads to DigitalOcean Spaces
- Email notifications
- Admin panel for club management
- Session management with SQLite

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- SQLite database
- DigitalOcean Spaces account (for file uploads)
- SMTP server (for email notifications)

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlokJoshi/rbclub.git
   cd rbclub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser to `http://localhost:3000`

## Production Deployment

For deploying to a DigitalOcean droplet or other Linux servers, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy Summary

1. Install system dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y build-essential python3 git nodejs npm
   ```

2. Clone and setup:
   ```bash
   git clone https://github.com/AlokJoshi/rbclub.git
   cd rbclub
   npm install
   npm run rebuild  # Rebuild native modules for Linux
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Start the application:
   ```bash
   npm start
   # Or use PM2 for production: pm2 start server.js --name rbclub
   ```

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `SESSION_SECRET`: Secret key for session encryption
- `ADMIN_IDS`: JSON array of admin user IDs
- `EMAIL_*`: SMTP email configuration
- `SPACES_*`: DigitalOcean Spaces configuration

## Project Structure

```
rbclub/
├── server.js           # Main server file
├── credentials.js      # Authentication and database functions
├── helper.js           # File upload configuration
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
├── DEPLOYMENT.md       # Deployment guide
├── public/             # Static files (HTML, CSS, JS)
│   ├── landing.html    # Public landing page
│   ├── members.html    # Members area
│   ├── guests.html     # Guest inquiry page
│   └── assets/         # CSS, JS, images
└── mydb.sqlite        # SQLite database (not in git)
```

## Database

The application uses SQLite with better-sqlite3. The database file `mydb.sqlite` is created automatically but is not tracked in git (.gitignore).

Key tables:
- `player`: Member information and credentials
- `sessions`: Session storage
- `mailinglistdetails`: Mailing list subscriptions
- `guestinquiry`: Guest visit requests

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start in development mode (same as start)
- `npm run rebuild` - Rebuild native modules (bcrypt, better-sqlite3) for current OS
- `npm run prepare:production` - Prepare for production deployment (rebuilds modules)

## Common Issues

### Native Module Errors on Linux

If you get errors about `bcrypt` or `better-sqlite3` when deploying to Linux:

```bash
# Install build tools
sudo apt-get install -y build-essential python3

# Rebuild native modules
npm rebuild bcrypt better-sqlite3
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

## Security

- Never commit `.env` file (already in `.gitignore`)
- Change `SESSION_SECRET` to a random string in production
- Use HTTPS in production
- Keep dependencies updated
- Regular database backups recommended

## License

ISC

## Support

For deployment issues, see [DEPLOYMENT.md](DEPLOYMENT.md).
