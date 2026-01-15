const express = require('express');
require('dotenv').config({ quiet: true });
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const {upload} = require('./helper');
const {userExists,addUser,passwordMatches,changePassword,
    registeredUsers,isAdmin,getMixOfPlayersAndNonPlayers,
    getBridgeTerms,isInvalidBridgeTerm,isNonPlayer,
    isPlayer} = require('./credentials')

app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse JSON and URL-encoded request bodies so req.body is populated
// increase limits to allow larger multipart/form-data handling if necessary
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const { Pool } = require('pg');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/mixofplayersandnonplayers', async (req, res) => {
    const result = await getMixOfPlayersAndNonPlayers();
    res.send(result);
});

app.get('/isinvalidbridgeterm/:term',async (req,res) => {
    const term = req.params.term
    const isinvalid = await isInvalidBridgeTerm(term)
    res.send(isinvalid) 
})

app.put('/checknonplayers',async (req,res) => {
    const nonplayers = req.body.nonplayers
    const firstIsNonPlayer =  await isNonPlayer(nonplayers[0])
    const secondIsNonPlayer =  await isNonPlayer(nonplayers[1])
        
    console.log(firstIsNonPlayer && secondIsNonPlayer)
    res.send(firstIsNonPlayer && secondIsNonPlayer)
})

app.put('/checkfullname',async (req,res) => {
    const fullname = req.body.fullname
    const isFromClub =  await isPlayer(fullname)
        
    res.send(isFromClub)
})


app.get('/bridgeterms', async (req, res) => {
    const result = await getBridgeTerms();
    res.send(result);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    //returns an object with id and username if user exists else false
    const user = await userExists(username);  
    if (!user) {
        return res.json({ valid: false, message: 'User does not exist' });
    } 
    const userId = user.rows[0].id;
    const passwordValid = await passwordMatches(username, password);
    if (!passwordValid) {
        return res.json({  valid: false, message: 'Incorrect password' });
    }
    res.json({ userId, isAdmin: isAdmin(userId), valid: true, message: 'User validated successfully' });
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
    const users = await registeredUsers();
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
app.post('/adduser', async (req, res) => {
    const { username, password } = req.body;
    const userExistsFlag = await userExists(username);  
    if (userExistsFlag) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const success = await addUser(username, password);
    if (success) {
        res.json({ success: true, message: 'User added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to add user' });
    }
});

app.get('/api/playerdata', async (req, res) => {
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
        const client = await pool.connect();
        const result = await client.query('SELECT id,image_path,first,last,email,phone,dob_month,ice_phone,ice_relation FROM player;');
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching player data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/playerdata/:id', async (req, res) => {
    const playerId = req.params.id;
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM player where id = $1;', [playerId]);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching player data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/attendance/:day', async (req, res) => {
    const day = req.params.day;
    const query =`SELECT first, last, phone, email FROM player where ${day} order by first;`
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
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
    console.log('Adding new player (playerdata):', { body: data, file: req.file && req.file.filename });
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
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
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
        const client = await pool.connect();
        const result = await client.query('UPDATE player SET first=$1, last=$2, email=$3, phone=$4, dob_month=$5, acblNumber=$6, ice_phone=$7, ice_relation=$8, m1=$9, t1=$10, f1=$11, ug=$12, image_path=$13 WHERE id = $14 RETURNING *;', [
            data.first,
            data.last,
            data.email,
            data.phone,
            data.dob_month==''||data.dob_month===null?0:data.dob_month,
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

        // If a file was uploaded, try to update the row with an image_path.
        if (req.file) {
            const imagePath = req.newFileName;
            try {
                await client.query('UPDATE player SET image_path = $1 WHERE id = $2;', [imagePath, playerId]);
                result.rows[0].image_path = imagePath;
            } catch (e) {
                console.warn('Could not persist image_path to DB (column may not exist):', e.message);
            }
        }

        client.release();
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating player:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/api/playerdata/:id', async (req, res) => {
    const playerId = req.params.id;
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
        const client = await pool.connect();
        const result = await client.query('DELETE FROM player WHERE id = $1 RETURNING *;', [playerId]);
        client.release();
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
    } catch (err) {
        console.error('Error deleting player:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function playerExists(first, last) {
    try {
        const pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT) || 5432,
            ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        });
        const client = await pool.connect();
        const result = await client.query('SELECT EXISTS(SELECT 1 FROM player WHERE first = $1 AND last = $2)', [first, last]);
        client.release();
        return result.rows[0].exists;
    } catch (err) {
        console.error('Error checking if player exists:', err);
        return false;
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
