const express = require('express');
require('dotenv').config({ quiet: true });
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;  

// console.log('PG host/user/db:', process.env.PG_HOST, process.env.PG_USER, process.env.PG_DATABASE);

app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded request bodies so req.body is populated
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { Pool } = require('pg');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
        const result = await client.query('SELECT id,first,last,email,phone,dob_month,ice_phone,ice_relation FROM player;');
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
    const q = {
        'm1':'SELECT first, last, phone, email FROM player where m1 order by first;',
        't1':'SELECT first, last, phone, email FROM player where t1 order by first;',
        'f1':'SELECT first, last, phone, email FROM player where f1 order by first;',    
        'ug':'SELECT first, last, phone, email FROM player where ug order by first;'
    };
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
        const result = await client.query(q[day]);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 

// POST route for creating a new player (accepts JSON or urlencoded)
app.post('/api/playerdata', async (req, res) => {
    const data = req.body;
    const alreadyExists = await playerExists(data.first, data.last);
    if (alreadyExists) {
        return res.status(400).json({ error: 'Player with the same first and last name already exists' });
    }
    console.log('Adding new player (playerdata):', data);
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
            (data.m1===true||data.m1==='true'||data.m1==='on'),
            (data.t1===true||data.t1==='true'||data.t1==='on'),
            (data.f1===true||data.f1==='true'||data.f1==='on'),
            (data.ug===true||data.ug==='true'||data.ug==='on')
        ]);
        client.release();
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error adding player (playerdata):', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/playerdata/:id', async (req, res) => {
    const playerId = req.params.id;
    const data = req.body;
    console.log('Updating player:', playerId, data);
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
        const result = await client.query('UPDATE player SET first=$1, last=$2, email=$3, phone=$4, dob_month=$5, acblNumber=$6, ice_phone=$7, ice_relation=$8, m1=$9, t1=$10, f1=$11, ug=$12 WHERE id = $13 RETURNING *;', [
            data.first,
            data.last,
            data.email,
            data.phone,
            data.dob_month,
            data.acblNumber,
            data.ice_phone,
            data.ice_relation,
            (data.m1===true||data.m1==='true'||data.m1==='on'),
            (data.t1===true||data.t1==='true'||data.t1==='on'),
            (data.f1===true||data.f1==='true'||data.f1==='on'),
            (data.ug===true||data.ug==='true'||data.ug==='on'),
            playerId
        ]);
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
