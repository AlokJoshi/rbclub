// require('dotenv').config({ quiet: true });
try {
    require('dotenv').config({ quiet: true });
} catch (e) {
    console.log('dotenv not found, using environment variables');
}

const { sendTestSMS } = require('./infobip');
const { sendSimpleEmail } = require('./mailgun');
// sendTestSMS();
// sendSimpleEmail();

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const express = require('express');
const sqlite = require('better-sqlite3');
const session = require('express-session')
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const { avtarUpload, celebrationUpload, celebrationMultiUpload } = require('./helper');

const { userExists, login, changePassword,
    registeredUsers, isAdmin, register, bulkregister,
    passwordMatches, getMailingListAddresses, getMailingLists,
    deleteMailingList, createMailingList, existsMailingList,
    updateMailingList, getMailingListRecipients, isPlayer,
    saveGuestInquiry, getNonMailingListRecipients,
    addRecipientToMailingList, formatDateToYYYYMMDD,
    getPOTMWords } = require('./credentials')



// 1. Initialize the SQLite database
// connects to the existing SQLite database
// const db = new sqlite('mydb.sqlite', { verbose: console.log });
const db = new sqlite('mydb.sqlite',);

// Optional: Enable WAL mode for better performance
// db.pragma('journal_mode = WAL');

function quoteIdent(identifier) {
    return `"${String(identifier).replace(/"/g, '""')}"`;
}

function normalizeSessionsSchema() {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get('sessions');

    if (!tableExists) {
        db.exec('CREATE TABLE IF NOT EXISTS sessions (sid PRIMARY KEY, expired, sess)');
        return;
    }

    const columns = db.prepare('PRAGMA table_info(sessions)').all();
    const names = new Set(columns.map((c) => c.name));

    // if (!names.has('expired')) {
    //     const sourceExpirationColumn = columns.find((column) => ['expire', 'expires', 'expired'].includes(column.name.replace(/["'`\[\]]/g, '').toLowerCase()));
    //     db.exec('ALTER TABLE sessions ADD COLUMN expired');
    //     if (sourceExpirationColumn) {
    //         // Fix: Just copy from source column, don't use COALESCE with the new column
    //         db.exec(`UPDATE sessions SET expired = ${quoteIdent(sourceExpirationColumn.name)}`);
    //     }
    // }

    if (!names.has('sess')) {
        const sourceSessionColumn = columns.find((column) => ['data', 'session', 'sess'].includes(column.name.replace(/["'`\[\]]/g, '').toLowerCase()));
        db.exec('ALTER TABLE sessions ADD COLUMN sess');
        if (sourceSessionColumn) {
            // Fix: Just copy from source column, don't use COALESCE with the new column
            db.exec(`UPDATE sessions SET sess = ${quoteIdent(sourceSessionColumn.name)}`);
        }
    }

    // const normalizedColumns = db.prepare('PRAGMA table_info(sessions)').all().map((column) => column.name);
    // console.log('Sessions table columns:', normalizedColumns.join(', '));
}

normalizeSessionsSchema();

// Close the better-sqlite3 connection to avoid conflicts
// db.close();

// 2. Configure session middleware
app.use(session({
    store: new SQLiteStore({
        // client: db,
        db: 'mydb.sqlite',
        dir: './',
        table: 'sessions',
        expired: {
            clear: false, // Automatically clear expired sessions
            intervalMs: 900000000 // Interval in milliseconds (e.g., 10 days) for the cleanup check
        }
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use true if serving over HTTPS
        maxAge: 1000 * 60 * 60 * 24, // Cookie expiration in milliseconds (e.g., 1 day)
        sameSite: 'lax' // Recommended to mitigate CSRF
    }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse JSON and URL-encoded request bodies so req.body is populated
// increase limits to allow larger multipart/form-data handling if necessary
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

//when I added this, the post(/api/celebration/images) started working!!
//otherwise I was getting 404 Not Found in the front-end!!
app.use((req, res, next) => {
  console.log('REQ', req.method, req.originalUrl);
  next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Members route
app.get('/members', (req, res) => {
    try {
        req.session.insecurelogin = req.session.insecurelogin || false;
        req.session.securelogin = req.session.securelogin || false;
        req.session.username = req.session.username || '';
        req.session.userid = req.session.userid || 0;
        req.session.isAdmin = req.session.isAdmin || false;
        req.session.casuallogin = req.session.casuallogin || false;
        res.sendFile(path.join(__dirname, 'public', 'members.html'));
    } catch (err) {
        console.error('Error in members route:', err);
        res.status(500).send('Server error');
    }
});

// Guests route
app.get('/guests', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'guests.html'));
});

// moved this here so that app.get('/') can initialize session variables first
app.use(express.static(path.join(__dirname, 'public')));

app.put('/bulkregister', (req, res) => {
    const users = req.body.users
    const registrationresult = bulkregister(users)
    res.json(registrationresult)
})

app.put('/register', (req, res) => {
    const first = req.body.first
    const last = req.body.last
    const username = req.body.username
    const registrationresult = register(first, last, username)
    res.json(registrationresult)
})

app.put('/checkfullnameandphone', async (req, res) => {
    const player = await isPlayer(req.body.fullname, req.body.phone)
    const valid = player.exists
    const id = player.id
    const username = player.username
    const fullname = player.fullname
    console.log('isPlayer response:', player);
    req.session.casuallogin = valid
    req.session.securelogin = false
    req.session.userid = id
    req.session.isAdmin = false
    req.session.username = username
    req.session.fullname = fullname
    res.json({
        valid, id, fullname,
        message: valid ? 'Member of the club but you can only view the data.' : 'Not a member of the club. Sorry no access.'
    },
    )
})

app.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const result = await login(username, password);
    if (!result.valid) {
        return res.json({ valid: false, message: result.message });
    }
    const userId = result.id;
    const admin = isAdmin(userId)
    req.session.securelogin = result.securelogin
    req.session.insecurelogin = !result.securelogin
    req.session.casuallogin = false
    req.session.username = username
    req.session.userid = userId
    req.session.isAdmin = admin
    req.session.fullname = result.fullname
    res.json({ userId, casuallogin: result.casuallogin, fullname: result.fullname, securelogin: result.securelogin, insecurelogin: !result.securelogin, isAdmin: admin, valid: true, message: result.message });
});

app.post('/addnewplayer', async (req, res) => {
    const data = req.body;
    const alreadyExists = await playerExists(data.first, data.last);
    if (alreadyExists) {
        return res.status(400).json({ success: false, message: 'Player with the same first and last name already exists' });
    }
    try {
        const username = data.first.trim().toLowerCase() + data.last.trim().toLowerCase().charAt(0);
        const stmt = db.prepare('INSERT INTO player (first,last) VALUES (?, ?);');
        const result = stmt.run(data.first, data.last)
        const id = result.lastInsertRowid
        const defaultPassword = data.first.trim().toLowerCase() + id.toString()
        // now create a password to store in the database
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);
        const updateStmt = db.prepare('UPDATE player SET username = ?, password = ? WHERE id = ?');
        updateStmt.run(username, hashedPassword, id);
        res.json({
            success: true, message: `User added successfully. Please inform the user
            that their username is ${username} and their temporary password is ${defaultPassword}`
        });
    } catch (err) {
        console.error('Error adding new user:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/changepassword', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const userExistsFlag = await userExists(username);
    if (!userExistsFlag) {
        return res.status(400).json({ success: false, message: 'User does not exist' });
    }
    const match = await passwordMatches(username, oldPassword);
    if (!match.valid) {
        return res.status(400).json({ success: false, message: match.message });
    }
    const success = await changePassword(username, newPassword);
    if (success) {
        req.session.securelogin = true
        req.session.insecurelogin = false
        req.session.casuallogin = false
        req.session.username = username
        req.session.userid = match.id
        req.session.isAdmin = isAdmin(match.id)
        res.json({ success: true, message: 'Password changed successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});



app.get('/api/registeredusers', async (req, res) => {
    const users = registeredUsers();
    res.json({ users });
});

app.post('/isadmin', async (req, res) => {
    const { userId } = req.body;
    const isAdminFlag = isAdmin(userId);
    res.json({ isAdmin: isAdminFlag });
});


app.get('/api/directorsdata', (req, res) => {
    try {
        const stmt = db.prepare('SELECT first,last,phone,email FROM player where director=1 order by last;');
        const result = stmt.all();
        res.json(result);
    } catch (err) {
        console.error('Error fetching director data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/officersdata', (req, res) => {
    try {
        const stmt = db.prepare(`SELECT first,last,phone,email,position FROM player where position is not null order by last;`);
        const result = stmt.all();
        res.json(result);
    } catch (err) {
        console.error('Error fetching director data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/playerdata', (req, res) => {

    try {
        const stmt = db.prepare(
            `SELECT id,image_path,first,last,email,phone,
            Concat(
            CASE When dob_month=1 Then 'Jan.'
            When dob_month=2 Then 'Feb.'
            When dob_month=3 Then 'Mar.'
            When dob_month=4 Then 'Apr.'
            When dob_month=5 Then 'May'
            When dob_month=6 Then 'Jun.'
            When dob_month=7 Then 'Jul.'
            When dob_month=8 Then 'Aug.'
            When dob_month=9 Then 'Sep.'
            When dob_month=10 Then 'Oct.'
            When dob_month=11 Then 'Nov.'
            When dob_month=12 Then 'Dec.'
            Else '' End, ' ', dob_date) AS dob,
            Case concat(ice_relation, ice_phone) when '' then '' else Concat(ice_relation,'(', ice_phone, ')') end AS ice
            FROM player order by last;`
        );
        //order by last
        const result = stmt.all();
        res.json(result);
    } catch (err) {
        console.error('Error fetching player data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/playerdata/:id', (req, res) => {
    const playerId = req.params.id;
    try {
        const stmt = db.prepare('SELECT * FROM player where id = ?;');
        const result = stmt.get(playerId);
        res.json(result);
    } catch (err) {
        console.error('Error fetching player data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/attendance/:day', async (req, res) => {
    const day = req.params.day;
    const stmt = db.prepare(`SELECT first, last, phone, email FROM player where ${day} order by first;`);
    try {
        const result = stmt.all();
        res.json(result);
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/getdefaultlogincredentials', async (req, res) => {
    const { first, last } = req.body;
    try {
        const stmt = db.prepare('SELECT id FROM player WHERE first = ? AND last = ?;');
        const result = stmt.get(first, last);
        if (result) {
            const id = result.id;
            const password = first.trim().toLowerCase() + id.toString();
            const username = first.trim().toLowerCase() + last.trim().toLowerCase().charAt(0);
            res.json({ success: true, username, password });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching default login credentials:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Accept multipart/form-data with optional file field 'playerImage' for updates
app.put('/api/playerdata/:id', avtarUpload.single('playerImage'), async (req, res) => {
    const playerId = req.params.id;
    const data = req.body;
    console.log('Updating player:', playerId, { body: data, file: req.file?.filename });
    const filename = req.newFileName
    try {

        const stmt = db.prepare(`UPDATE player SET first=?, last=?, email=?, phone=?, dob_month=?, dob_date=?, 
                                 acblNumber=?, ice_phone=?, ice_relation=?, m1=?, t1=?, f1=?, ug=?, 
                                 image_path=?, director=?, position=? WHERE id = ?;`);

        const result = stmt.run(data.first,
            data.last,
            data.email,
            data.phone,
            data.dob_month == '' || data.dob_month === null ? 0 : data.dob_month,
            data.dob_date == '' || data.dob_date === null ? 0 : data.dob_date,
            data.acblNumber,
            data.ice_phone,
            data.ice_relation,
            (data.m1 === true || data.m1 === 'true' || data.m1 === 'on') ? 1 : 0,
            (data.t1 === true || data.t1 === 'true' || data.t1 === 'on') ? 1 : 0,
            (data.f1 === true || data.f1 === 'true' || data.f1 === 'on') ? 1 : 0,
            (data.ug === true || data.ug === 'true' || data.ug === 'on') ? 1 : 0,
            filename,
            (data.isDirector === true || data.isDirector === 'true' || data.isDirector === 'on') ? 1 : 0,
            (!data.officerPosition || data.officerPosition === 'None') ? null : data.officerPosition,
            playerId);

        res.json(result);
    } catch (err) {
        console.error('Error updating player:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/playerdata/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Forbidden. Admin access required to delete player.' });
    }
    const playerId = req.params.id;
    try {
        db.prepare('DELETE FROM mailinglistdetails WHERE playerid = ?;').run(playerId);
        const result = db.prepare('DELETE FROM player WHERE id = ? RETURNING *;').run(playerId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
    } catch (err) {
        console.error('Error deleting player:', err);
        res.status(500).json({ error: 'Could not delete player. Internal server error.' });
    }
});

app.delete(`/api/mailinglist/:mailingListDetailsId/removerecipient`, async (req, res) => {
    const mailingListDetailsId = req.params.mailingListDetailsId;
    try {
        const result = db.prepare('DELETE FROM mailinglistdetails WHERE id = ?;').run(mailingListDetailsId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        res.json({ success: true, message: 'Recipient removed successfully' });
    } catch (err) {
        console.error('Error removing recipient:', err);
        res.status(500).json({ error: 'Could not remove recipient. Internal server error.' });
    }
});

app.get('/get-session-id', (req, res) => {
    // Check if a session exists
    if (req.session) {
        // Access the session ID
        const sessionId = req.sessionID;
        const securelogin = req.session.securelogin;
        const insecurelogin = req.session.insecurelogin;
        const username = req.session.username;
        const userid = req.session.userid;
        const isAdmin = req.session.isAdmin;
        const casuallogin = req.session.casuallogin;
        const full_name = req.session.fullname;
        console.log('Session ID:', sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, full_name);
        res.json({ sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname: full_name });
    } else {
        res.json({ message: 'No session found' });
    }
});

// Request password reset
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email
        const stmt = db.prepare('SELECT id, first, last, username FROM player WHERE email = ?');
        const user = stmt.get(email);

        if (!user) {
            // Don't reveal if email exists
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

        // Store token in database
        const updateStmt = db.prepare('UPDATE player SET reset_token = ?, reset_token_expires = ? WHERE id = ?');
        updateStmt.run(resetToken, resetTokenExpires, user.id);

        // Create reset URL
        // const resetUrl = `http://localhost:${PORT}/reset-password?token=${resetToken}`;
        const resetUrl = `http://localhost:${PORT}/?token=${resetToken}`;

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hello ${user.first},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Error in forgot password:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Verify reset token. This route is not being used right now but can be useful.
app.get('/verify-reset-token/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const stmt = db.prepare('SELECT id, username, reset_token_expires FROM player WHERE reset_token = ?');
        const user = stmt.get(token);

        if (!user || user.reset_token_expires < Date.now()) {
            return res.json({ valid: false, message: 'Invalid or expired reset token' });
        }

        res.json({ valid: true, username: user.username });
    } catch (err) {
        console.error('Error verifying reset token:', err);
        res.status(500).json({ valid: false, message: 'Internal server error' });
    }
});

// Reset password with token
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const stmt = db.prepare('SELECT id, username, reset_token_expires FROM player WHERE reset_token = ?');
        const user = stmt.get(token);

        if (!user || user.reset_token_expires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

        // Update password and clear reset token
        const updateStmt = db.prepare('UPDATE player SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?');
        updateStmt.run(hashedPassword, user.id);
        console.error('Password reset successfully');

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/guest-inquiry', async (req, res) => {
    const { firstName, lastName, email, phone, acbl, visitDate, message } = req.body;
    try {
        //save the guest inquiry to the database or send an email
        saveGuestInquiry(firstName, lastName, email, phone, acbl, visitDate, message);
        const mailingList = getMailingListAddresses('boardmembers');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: mailingList,
            subject: 'New Guest Inquiry',
            text: `Our web site has received a new guest inquiry from 
            \nFirst Name:${firstName} Last Name: ${lastName} 
            \nPhone:${phone} Email:(${email}) 
            \nExpressing interest in visiting club on:${visitDate}.
            \n\nMessage: ${message}
            \n\nPresident will reach out to the guest or assign someone to reach out to the guest.
            \n\nThis email was sent automatically from the website to all board members.`
        });
        res.json({ success: true, message: 'Inquiry received. We will contact you soon.' });
    } catch (err) {
        console.error('Error handling guest inquiry:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/mailinglists', async (req, res) => {
    try {
        const mailingLists = getMailingLists();
        res.json({ success: true, mailingLists });
    } catch (err) {
        console.error('Error fetching mailing lists:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/mailinglist/:listname', async (req, res) => {
    const listName = req.params.listname;
    try {
        const emails = getMailingListAddresses(listName);
        res.json({ success: true, emails });
    } catch (err) {
        console.error('Error fetching mailing list:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.delete('/api/mailinglist/:listid', async (req, res) => {
    const listId = req.params.listid;
    try {
        deleteMailingList(listId);
        res.json({ success: true, message: 'Mailing list deleted successfully' });
    } catch (err) {
        console.error('Error deleting mailing list:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/mailinglists', async (req, res) => {
    const { name, description } = req.body;
    try {
        if (existsMailingList(name)) {
            res.status(400).json({ success: false, message: 'Mailing list already exists' });
            return;
        }
        createMailingList(name, description);
        res.json({ success: true, message: 'Mailing list created successfully' });
    } catch (err) {
        console.error('Error creating mailing list:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.put('/api/mailinglists', async (req, res) => {
    const { id, name, description } = req.body;
    try {
        if (existsMailingList(name)) {
            res.status(400).json({ success: false, message: 'Mailing list already exists' });
            return;
        }
        updateMailingList(id, name, description);
        res.json({ success: true, message: 'Mailing list updated successfully' });
    } catch (err) {
        console.error('Error updating mailing list:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get(`/api/mailinglist/:mailinglistid/recipients`, async (req, res) => {
    const mailingListId = req.params.mailinglistid;
    try {
        const result = getMailingListRecipients(mailingListId);
        res.json({ success: result.success, recipients: result.recipients, message: result.message });
    } catch (err) {
        console.error('Error fetching mailing list recipients:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get(`/api/nonemailrecipients/:mailinglistid`, async (req, res) => {
    const mailingListId = req.params.mailinglistid;
    try {
        const result = getNonMailingListRecipients(mailingListId);
        res.json({ success: result.success, recipients: result.recipients, message: result.message });
    } catch (err) {
        console.error('Error fetching non-mailing list recipients:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/mailinglist/:mailinglistid/addrecipient', async (req, res) => {
    const mailingListId = req.params.mailinglistid;
    const { memberid } = req.body;
    try {
        addRecipientToMailingList(mailingListId, memberid);
        res.json({ success: true, message: 'Recipients added successfully' });
    } catch (err) {
        console.error('Error adding recipients to mailing list:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
app.post('/api/sendemail', async (req, res) => {
    const { mailinglistId, memberid, subject, text } = req.body;
    const recipients = mailinglistId ? getMailingListRecipients(mailinglistId).recipients : [];
    const recipientEmails = recipients.map(r => r.email)
    const filteredRecipientEmails = recipientEmails.filter(email => email !== null && email !== undefined && email.trim() !== ''); // Filter out null or undefined emails
    const recipient = memberid ? db.prepare('SELECT email FROM player WHERE id = ?').get(memberid)?.email : null;
    const to = recipients.length > 0 ? filteredRecipientEmails.join(',') : recipient;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        });
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


async function playerExists(first, last) {
    try {
        const stmt = db.prepare('SELECT EXISTS(SELECT 1 FROM player WHERE first = ? AND last = ?)');
        const result = stmt.get(first, last);
        return result['EXISTS(SELECT 1 FROM player WHERE first = ? AND last = ?)'] === 1;
    } catch (err) {
        console.error('Error checking if player exists:', err);
        return false;
    }
}

app.get('/api/announcements', (req, res) => {
    try {
        const today = formatDateToYYYYMMDD(new Date()); // Get current date in YYYY-MM-DD format
        const stmt = db.prepare(`select a.*,p.image_path, concat(p.first, ' ', p.last) as fromname  from announcement a inner join player p on 
            a.playerid=p.id where del=0 and displaytill >= ? order by priority;`);
        const announcements = stmt.all(today);
        res.json({ success: true, announcements });
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
app.put('/api/announcement/:id', (req, res) => {
    const announcementId = req.params.id;
    const { title, announcement, playerid, displaytill, priority } = req.body;
    try {
        const stmt = db.prepare('UPDATE announcement SET title = ?, announcement = ?, playerid = ?, displaytill = ?, priority = ? WHERE id = ?;');
        const result = stmt.run(title, announcement, playerid, displaytill, priority, announcementId);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.json({ success: true, message: 'Announcement updated successfully' });
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/announcement', (req, res) => {
    const { title, announcement, playerid, displaytill, priority } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO announcement (title, announcement, playerid, displaytill, priority, del) VALUES (?, ?, ?, ?, ?, ?);');
        stmt.run(title, announcement, playerid, displaytill, priority, 0);
        res.json({ success: true, message: 'Announcement created successfully' });
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.delete('/api/announcement/:id', (req, res) => {
    const announcementId = req.params.id;
    try {
        const stmt = db.prepare('UPDATE announcement SET del = 1 WHERE id = ?;');
        const result = stmt.run(announcementId);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/getplayingintentions/:playerid', (req, res) => {
    const playerId = req.params.playerid;
    try {
        const stmt = db.prepare('SELECT m1, t1, f1, ug FROM player WHERE id = ?;');
        const result = stmt.get(playerId);
        console.log('Playing intentions for player', playerId, result);
        res.json({ success: true, intentions: result });
    } catch (err) {
        console.error('Error fetching playing intentions:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/setplayingintentions', (req, res) => {
    const { playerId, day, intention } = req.body;
    try {
        const sql = `UPDATE player SET ${day} = ? WHERE id = ?;`;
        const stmt = db.prepare(sql);
        const result = stmt.run(intention, playerId);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        res.json({ success: true, message: 'Playing intentions updated successfully' });
    } catch (err) {
        console.error('Error updating playing intentions:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/updatepotm', (req, res) => {
    const { potmmonth, potmyear, playerid, potmplayerid } = req.body;
    const sql = `Insert into potm (potmmonth ,potmyear,playerid,potmplayerid) values(
    ?,?,?,?) on conflict(potmmonth,potmyear,playerid) do update set potmplayerid = ?,
    comment = '' where potmmonth = ? and potmyear =? and playerid = ?;`
    try {
        const stmt = db.prepare(sql);
        stmt.run(potmmonth, potmyear, playerid, potmplayerid, potmplayerid, potmmonth, potmyear, playerid);
        res.json({ success: true, message: 'Player of the Month updated successfully' });
    } catch (err) {
        console.error('Error updating Player of the Month:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/getpotm/:potmmonth/:potmyear', (req, res) => {
    const { potmmonth, potmyear } = req.params;
    try {
        // const stmt = db.prepare(`SELECT player.id, player.first, player.last, player.image_path, 
        // count(player.id) as votes, 
        // json_group_array(potm.comment) AS comments_json
        // FROM player inner join potm on 
        // player.id = potm.potmplayerid WHERE potmmonth = ? AND potmyear = ? 
        // group by player.id, player.first, player.last, player.image_path order by votes desc LIMIT 3;`);
        const stmt = db.prepare(`SELECT player.id, player.first, player.last, player.image_path, 
            count(player.id) as votes, 
            group_concat(potm.comment, ' | ') AS comments_concat
            FROM player inner join potm on 
            player.id = potm.potmplayerid WHERE potmmonth = ? AND potmyear = ? 
            group by player.id, player.first, player.last, player.image_path order by votes desc LIMIT 3;`);
        const potm = stmt.all(potmmonth, potmyear);
        res.json({ success: true, potm });
    } catch (err) {
        console.error('Error fetching Player of the Month:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/getpotmwords', (req, res) => {
    try {
        const result = getPOTMWords();
        res.json(result);
    } catch (err) {
        console.error('Error fetching POTM words:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/savephrase', (req, res) => {
    const { playerid, potmplayerid, potmmonth, potmyear, potmphrase } = req.body;
    try {
        const stmt1 = db.prepare('SELECT comment FROM potm WHERE playerid = ? AND potmplayerid = ? AND potmmonth = ? AND potmyear = ?');
        const existing = stmt1.get(playerid, potmplayerid, potmmonth, potmyear);
        if (existing) {
            const updatedPhrase = (existing.comment === '' || existing.comment == null) ? potmphrase : `${existing.comment},${potmphrase}`;
            const stmt = db.prepare('UPDATE potm SET comment = ? WHERE playerid = ? AND potmplayerid = ? AND potmmonth = ? AND potmyear = ?');
            stmt.run(updatedPhrase, playerid, potmplayerid, potmmonth, potmyear);
        } else {
            const stmt = db.prepare('INSERT INTO potm (playerid, potmplayerid, potmmonth, potmyear, comment) VALUES (?, ?, ?, ?, ?)');
            stmt.run(playerid, potmplayerid, potmmonth, potmyear, potmphrase);
        }
        res.json({ success: true, message: 'Phrase saved successfully' });
    } catch (err) {
        console.error('Error saving phrase:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/clearpotmcomments/:potmmonth/:potmyear/:playerid', (req, res) => {
    const { potmmonth, potmyear, playerid } = req.params;
    try {
        const stmt = db.prepare('UPDATE potm SET comment = \'\' WHERE playerid = ? AND potmmonth = ? AND potmyear = ?');
        stmt.run(playerid, potmmonth, potmyear);
        res.json({ success: true, message: 'POTM comments cleared successfully' });
    } catch (err) {
        console.error('Error clearing POTM comments:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/celebrations', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM celebration where archive = 0');
        const celebrations = stmt.all();
        res.json({ success: true, celebrations });
    } catch (err) {
        console.error('Error fetching celebrations:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/celebration', (req, res) => {
    const { createdByPlayerId, celebrationName, celebrationDate, celebrationDescription } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO celebration (createdbyplayerid,celebrationname,celebrationdate, celebrationdescription) VALUES (?, ?, ?, ?)');
        const result = stmt.run(createdByPlayerId, celebrationName, celebrationDate, celebrationDescription);
        res.json({ success: true, celebrationid: result.lastInsertRowid, message: 'Celebration added successfully' });
    } catch (err) {
        console.error('Error adding celebration:', err);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ success: false, message: 'Celebration with the same name already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

app.delete('/api/celebration/:celebrationid', (req, res) => {
    const { celebrationid } = req.params;
    try {
        const stmt = db.prepare('Update celebration SET archive = 1 WHERE celebrationid = ?');
        stmt.run(celebrationid);
        res.json({ success: true, message: 'Celebration deleted successfully' });
    } catch (err) {
        console.error('Error deleting celebration:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.delete('/api/celebration/image/:id', (req, res) => {    
    const { id } = req.params;
    try {
        const stmt = db.prepare('Update celebrationimages SET archive = 1 WHERE Id = ?');
        stmt.run(id);
        res.json({ success: true, message: 'Celebration image deleted successfully' });
    } catch (err) {
        console.error('Error deleting celebration image:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


//using the version suggested by GPT
// app.post('/api/celebration/image',celebrationUpload.single('playerImage'), (req, res) => {
//     const { celebrationid } = req.body;
//     try {
//         const image_path = req.newfilename;
//         const stmt = db.prepare('insert into celebrationimages (celebrationid, image_path) VALUES (?, ?)');
//         stmt.run(celebrationid, image_path);
//         res.json({ success: true, message: 'Image uploaded successfully' });
//     } catch (err) {
//         console.error('Error uploading image:', err);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// });

// Following works but uploads only one file
// app.post('/api/celebration/image', (req, res, next) => {
//     celebrationUpload.single('playerImage')(req, res, (err) => {
//         if (err) {
//             console.error('Multer failed:', err);
//             if (err instanceof multer.MulterError) {
//                 return res.status(400).json({ success: false, message: err.message });
//             }
//             return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
//         }
//         next();
//     });
// }, (req, res) => {
//     console.log('body:', req.body);
//     console.log('file:', req.file);
//     console.log('location:', req.file.key);

//     if (!req.file) {
//         return res.status(400).json({ success: false, message: 'No file received (playerImage)' });
//     }
    
//     try {
//         const { celebrationid } = req.body;
//         const image_path = req.newFileName;
//         const stmt = db.prepare('insert into celebrationimages (celebrationid, image_path) VALUES (?, ?)');
//         stmt.run(celebrationid, image_path);
//         res.json({ success: true, message: 'Image uploaded successfully' });
//     } catch (err) {
//         console.error('Error uploading image:', err);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }

// });
// Above works but uploads only one file


app.post('/api/celebration/images', (req, res, next) => {
  celebrationMultiUpload.array('celebrationImages', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    next();
  });
}, (req, res) => {
  try {
    const { celebrationid } = req.body;

    if (!celebrationid) {
      return res.status(400).json({ success: false, message: 'celebrationid is required' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const stmt = db.prepare('INSERT INTO celebrationimages (celebrationid, image_path) VALUES (?, ?)');
    for (const file of req.files) {
      stmt.run(celebrationid, file.key || file.location || file.filename);
    }

    res.json({
      success: true,
      count: req.files.length,
      files: req.files.map(f => ({ key: f.key, url: f.location }))
    });
  } catch (err) {
    console.error('Error uploading celebration images:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/celebration/:celebrationid/images', async (req, res) => {
    const { celebrationid } = req.params;
    try {
        const stmt = db.prepare('SELECT id, image_path FROM celebrationimages WHERE celebrationid = ? and archive = 0');
        const images = stmt.all(celebrationid);
        res.json(images.map(img => ({ id:img.id, url: `https://rbcstorage.sfo3.digitaloceanspaces.com/${img.image_path}` })));
    } catch (err) {
        console.error('Error fetching celebration images:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
