# Contributing to RBClub

Thank you for your interest in contributing to the RBClub project!

## Development Setup

### 1. Fork and Clone
```bash
git clone https://github.com/AlokJoshi/rbclub.git
cd rbclub
```

### 2. Install Dependencies
```bash
npm install
```

This will automatically rebuild native modules (`bcrypt` and `better-sqlite3`) for your operating system.

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 4. Start Development Server
```bash
npm start
```

Access the application at `http://localhost:3000`

## Project Structure

```
rbclub/
├── server.js              # Main Express server
├── credentials.js         # Authentication & database logic
├── helper.js             # File upload configuration
├── package.json          # Dependencies and scripts
├── public/               # Static frontend files
│   ├── landing.html      # Public homepage
│   ├── members.html      # Members area
│   ├── guests.html       # Guest inquiry page
│   └── assets/           # CSS, JS, images
└── mydb.sqlite          # SQLite database (git-ignored)
```

## Code Guidelines

### JavaScript Style
- Use ES6+ features where appropriate
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks
- Add comments for complex logic

### Database
- Use prepared statements for all SQL queries (prevents SQL injection)
- Use better-sqlite3 synchronous API
- Handle errors appropriately

### Security
- Never commit `.env` file
- Never hardcode credentials
- Use bcrypt for password hashing (already implemented)
- Validate and sanitize all user inputs
- Use prepared statements for SQL queries

## Testing Your Changes

### Before Committing
1. Test your changes locally
2. Ensure no errors in console
3. Test on different screen sizes (if UI changes)
4. Verify database operations work correctly

### Native Module Changes
If you modify dependencies that include native modules:
```bash
npm run rebuild
```

## Deployment Testing

To test deployment scenarios:

### Test on Linux (Ubuntu/Debian)
```bash
# In a Linux environment or VM
git clone <your-fork>
cd rbclub
./setup.sh
npm start
```

### Test Native Module Rebuild
```bash
rm -rf node_modules
npm install
# Should complete without errors
```

## Making a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

### Pull Request Guidelines
- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure code follows project style
- Test on both development and production-like environments

## Common Development Tasks

### Adding a New Route
```javascript
// In server.js
app.get('/api/your-route', (req, res) => {
    try {
        // Your logic here
        res.json({ success: true, data: yourData });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

### Adding a Database Query
```javascript
// In credentials.js or server.js
function yourFunction() {
    const stmt = db.prepare('SELECT * FROM table WHERE condition = ?');
    const result = stmt.all(value);
    return result;
}
```

### Adding Environment Variable
1. Add to `.env.example` with description
2. Update `DEPLOYMENT.md` if needed
3. Use in code: `process.env.YOUR_VAR`

## Troubleshooting Development Issues

### Native Module Errors
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Database Locked
```bash
# Close all connections to the database
# Restart your development server
```

### Port Already in Use
```bash
# Change PORT in .env
# Or kill the process: lsof -i :3000
```

## Getting Help

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems  
- Open an issue on GitHub for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).
