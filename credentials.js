require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
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
        const result = await client.query('SELECT username FROM player WHERE username = $1;', [username]);
        client.release();
        return result.rows.length > 0;
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

module.exports = {
  userExists,
  addUser,
  passwordMatches,
  changePassword,
  registeredUsers
}