require('dotenv').config({ quiet: true });
const express = require('express');
const sqlite = require('better-sqlite3');
const session = require('express-session')
const SQLiteStore = require('connect-sqlite3')(session);
// const SqliteStore = require('better-sqlite3-session-store')(session);
const bcrypt = require('bcrypt');


const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const { upload } = require('./helper');
const { userExists, addUser, login, changePassword,
    registeredUsers, isAdmin, register, bulkregister,
    getBridgeTerms, isInvalidBridgeTerm, isNonPlayer,
    isPlayer } = require('./credentials')



// 1. Initialize the SQLite database
// connects to the existing SQLite database
const db = new sqlite('mydb.sqlite', { verbose: console.log });

// Optional: Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// 2. Configure session middleware
app.use(session({
    store: new SQLiteStore({
        // client: db,
        db: 'mydb.sqlite',
        dir: './',
        table: 'sessions',
        // expired: {
        //     clear: true, // Automatically clear expired sessions
        //     intervalMs: 900000 // Interval in milliseconds (15 minutes) for the cleanup check
        // }
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

app.get('/', (req, res) => {
    // req.session.viewCount = (req.session.viewCount || 0) + 1;
    try {
        req.session.insecurelogin = req.session.insecurelogin || false;
        req.session.securelogin = req.session.securelogin || false;
        req.session.username = req.session.username || '';
        req.session.userid = req.session.userid || 0;
        req.session.isAdmin = req.session.isAdmin || false;
        req.session.casuallogin = req.session.casuallogin || false;
        // req.session.save((err) => {
        //     if (err) {
        //         console.error('Error saving session:', err);
        //     }
        // });
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    catch (err) {
        console.error('Error in root route:', err);
    }
    // console.log(`View count for this session: ${req.session.viewCount}`);
    // res.sendFile(path.join(__dirname, 'public', 'index.html')); 
});


app.get('/isinvalidbridgeterm/:term', async (req, res) => {
    const term = req.params.term
    const isinvalid = await isInvalidBridgeTerm(term)
    req.session.termcheck = isinvalid
    res.send(isinvalid)
})

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

// app.put('/checknonmembers', async (req, res) => {
//     const nonmembers = req.body.nonmembers
//     const firstIsNonPlayer = await isNonPlayer(nonmembers[0])
//     const secondIsNonPlayer = await isNonPlayer(nonmembers[1])
//     const botharenonmembers = firstIsNonPlayer && secondIsNonPlayer
//     req.session.nonmemberscheck = botharenonmembers
//     const temporarylogin = botharenonmembers &&
//         req.session.termcheck && req.session.namecheck
//     req.session.temporarylogin = temporarylogin

//     res.json({
//         botharenonmembers: botharenonmembers,
//         temporarylogin: temporarylogin
//     })
// })

app.put('/checkfullnameandphone', async (req, res) => {
    const player = await isPlayer(req.body.fullname, req.body.phone)
    const valid = player.exists
    const id= player.id
    const username= player.username
    const fullname= player.fullname
    console.log('isPlayer response:', player);
    req.session.casuallogin = valid
    req.session.securelogin = false
    req.session.userid = id
    req.session.isAdmin = false
    req.session.username = username
    req.session.fullname = fullname
    res.json({ valid, id, fullname,
        message: valid ? 'Member of the club but you can only view the data.' : 'Not a member of the club. Sorry no access.' 
    },
    )
})


app.get('/bridgeterms', async (req, res) => {
    const result = await getBridgeTerms();
    res.send(result);
});

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
    req.session.username = username
    req.session.userid = userId
    req.session.isAdmin = admin
    res.json({ userId, isAdmin: admin, valid: true, message: result.message });
});

app.post('/changepassword', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const userExistsFlag = await userExists(username);
    if (!userExistsFlag) {
        return res.status(400).json({ success: false, message: 'User does not exist' });
    }
    const oldPasswordValid = await passwordMatches(username, oldPassword);
    if (!oldPasswordValid) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }
    const success = await changePassword(username, newPassword);
    if (success) {
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

//add user route should be available only to superuser or admin in real application
//this is because anyone can hit this endpoint and create users whereas
//in this application, list of users are pre-defined (members of the bridge club)
// app.post('/adduser', async (req, res) => {
//     const { username, password } = req.body;
//     const userExistsFlag = await userExists(username);
//     if (userExistsFlag) {
//         return res.status(400).json({ success: false, message: 'User already exists' });
//     }
//     const success = await addUser(username, password);
//     if (success) {
//         res.json({ success: true, message: 'User added successfully' });
//     } else {
//         res.status(500).json({ success: false, message: 'Failed to add user' });
//     }
// });

app.get('/api/playerdata', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id,image_path,first,last,email,phone,dob_month,ice_phone,ice_relation FROM player order by last;');
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
    const query = `SELECT first, last, phone, email FROM player where ${day} order by first;`
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool;
        const client = await pool.connect();
        const result = await client.query(query);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST route for creating a new player (accepts JSON or urlencoded)
// Accept multipart/form-data with optional file field 'playerImage'
app.post('/api/playerdata', upload.single('playerImage'), async (req, res) => {
    const data = req.body;
    const alreadyExists = await playerExists(data.first, data.last);
    if (alreadyExists) {
        return res.status(400).json({ error: 'Player with the same first and last name already exists' });
    }
    // console.log('Adding new player (playerdata):', { body: data, file: req.file && req.file.filename });
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool;
        const client = await pool.connect();
        const result = await client.query('INSERT INTO player (first, last, email, phone, dob_month, acblNumber, ice_phone, ice_relation, m1, t1, f1, ug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;', [
            data.first,
            data.last,
            data.email,
            data.phone,
            data.dob_month,
            data.acblNumber,
            data.ice_phone,
            data.ice_relation,
            (data.m1 === true || data.m1 === 'true' || data.m1 === 'on'),
            (data.t1 === true || data.t1 === 'true' || data.t1 === 'on'),
            (data.f1 === true || data.f1 === 'true' || data.f1 === 'on'),
            (data.ug === true || data.ug === 'true' || data.ug === 'on')
        ]);

        // If a file was uploaded, try to update the row with an image_path.
        if (req.file) {
            console.log('New file uploaded:', req.newFileName);
            const imagePath = req.newFileName;
            try {
                await client.query('UPDATE player SET image_path = $1 WHERE id = $2;', [imagePath, result.rows[0].id]);
                result.rows[0].image_path = imagePath;
            } catch (e) {
                console.warn('Could not persist image_path to DB (column may not exist):', e.message);
            }
        }

        client.release();
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error adding player (playerdata):', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Accept multipart/form-data with optional file field 'playerImage' for updates
app.put('/api/playerdata/:id', upload.single('playerImage'), async (req, res) => {
    const playerId = req.params.id;
    const data = req.body;
    console.log('Updating player:', playerId, { body: data, file: req.file && req.file.filename });
    const filename = req.newFileName
    try {

        const stmt = db.prepare('UPDATE player SET first=?, last=?, email=?, phone=?, dob_month=?, acblNumber=?, ice_phone=?, ice_relation=?, m1=?, t1=?, f1=?, ug=?, image_path=? WHERE id = ? RETURNING *;', [
            data.first,
            data.last,
            data.email,
            data.phone,
            data.dob_month == '' || data.dob_month === null ? 0 : data.dob_month,
            data.acblNumber,
            data.ice_phone,
            data.ice_relation,
            (data.m1 === true || data.m1 === 'true' || data.m1 === 'on'),
            (data.t1 === true || data.t1 === 'true' || data.t1 === 'on'),
            (data.f1 === true || data.f1 === 'true' || data.f1 === 'on'),
            (data.ug === true || data.ug === 'true' || data.ug === 'on'),
            filename,
            playerId
        ]);

        const result = stmt.run();

        // If a file was uploaded, try to update the row with an image_path.
        // if (req.file) {
        //     const imagePath = req.newFileName;
        //     try {
        //         // db.prepare('UPDATE player SET image_path = ? WHERE id = ?;').run(imagePath, playerId);
        //         result.rows[0].image_path = imagePath;
        //     } catch (e) {
        //         console.warn('Could not persist image_path to DB (column may not exist):', e.message);
        //     }
        // }

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

app.get('/get-session-id', (req, res) => {
    // Check if a session exists
    if (req.session) {
        // Access the session ID
        const sessionId = req.sessionID;
        const securelogin = req.session.securelogin ;
        const insecurelogin = req.session.insecurelogin ;
        const username = req.session.username;
        const userid = req.session.userid;
        const isAdmin = req.session.isAdmin;
        const casuallogin = req.session.casuallogin;
        console.log('Session ID:', sessionId);
        res.json({ sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin });
    } else {
        res.json({message: 'No session found'});
    }
});

async function playerExists(first, last) {
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool;
        const client = await pool.connect();
        const result = await client.query('SELECT EXISTS(SELECT 1 FROM player WHERE first = $1 AND last = $2)', [first, last]);
        client.release();
        const exists = result.rows[0].exists;
        return exists;
    } catch (err) {
        console.error('Error checking if player exists:', err);
        return false;
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
