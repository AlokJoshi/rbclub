require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const admin_ids = process.env.ADMIN_IDS ? JSON.parse(process.env.ADMIN_IDS) : [];

function isAdmin(userId) {
    return admin_ids.includes(userId.toString());
}

async function userExists(username) {
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
        const result = await client.query('SELECT id, username FROM player WHERE username = $1;', [username]);
        client.release();
        return result
    } catch (err) {
        console.error('Error fetching username:', err);
        return false;
    }
}
async function addUser(username, password) {
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
        const result = await client.query(`INSERT INTO player (username, password) VALUES ($1, crypt($2, gen_salt('bf')));`, [username, password]);
        client.release();
        return true;
    } catch (err) {
        console.error('Error adding user:', err);
        return false;
    }
}

async function passwordMatches(username, password) {
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
        const result = await client.query(`SELECT (password = crypt($2, password)) AS password_match FROM player WHERE username = $1;`, [username, password]);
        client.release();
        return result.rows.length > 0 && result.rows[0].password_match;
    } catch (err) {
        console.error('Error verifying password:', err);
        return false;
    }
}
async function changePassword(username, newPassword) {
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
        const result = await client.query(`UPDATE player SET password = crypt($2, gen_salt('bf')) WHERE username = $1;`, [username, newPassword]);
        client.release();
        return true;
    } catch (err) {
        console.error('Error changing password:', err);
        return false;
    }
}
const registeredUsers = async () => {
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
        const result = await client.query('SELECT first, last, username FROM player where username is not null;');
        client.release();
        return result.rows
    } catch (err) {
        console.error('Error fetching registered users:', err);
        return [];
    }
}

async function getTwoNonPlayer() {
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
        const result = await client.query(`SELECT first FROM nonplayer ORDER BY RANDOM() LIMIT 2;`);
        client.release();
        return result.rows;
    } catch (err) {
        console.error('Error fetching non-player users:', err);
        return [];
    }   
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function get18Players() {
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
        const result = await client.query(`SELECT first FROM player ORDER BY RANDOM() LIMIT 18;`);
        client.release();
        return result.rows;
    } catch (err) {
        console.error('Error fetching 18 players:', err);
        return [];
    }   
}

async function getMixOfPlayersAndNonPlayers() {
    const players = await get18Players();
    const nonPlayers = await getTwoNonPlayer();
    const mix =  shuffle(players.concat(nonPlayers));
    return mix;
}

async function getBridgeTerms() {
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
        const result = await client.query('SELECT term FROM bridgeterm;');
        client.release();
        return result.rows;
    } catch (err) {
        console.error('Error fetching bridge terms:', err);
        return [];
    }       
}
async function isValidBridgeTerm(term){
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
        const result = await client.query('SELECT valid FROM bridgeterm where term =$1;',[term]);
        client.release();
        return result.rows[0].valid
    } catch (err) {
        console.error('Error checking bridge term validity:', err);
        return false;
    }          
}

module.exports = {
    userExists,
    addUser,
    passwordMatches,
    changePassword,
    registeredUsers,
    isAdmin,
    getMixOfPlayersAndNonPlayers,
    getBridgeTerms,
    isValidBridgeTerm
}