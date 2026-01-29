require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const sqlite = require('better-sqlite3');
// Initialize the sqlite database connection
const db = new sqlite('mydb.sqlite', { verbose: console.log });


const admin_ids = process.env.ADMIN_IDS ? JSON.parse(process.env.ADMIN_IDS) : [];

function isAdmin(userId) {
    return admin_ids.includes(userId.toString());
}

function userExists(username) {
    try {
        const stmt = db.prepare('SELECT id, username FROM player WHERE username = ?;');
        const res = stmt.all(username);
        const result = (res.length === 0) ? false : true;
        return result;
    } catch (err) {
        console.error('Error fetching username:', err);
        return false;
    }
}

function addUser(username, password) {
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const stmt = db.prepare('INSERT INTO player (username, password) VALUES (?, ?);');
    const result = stmt.run(username, hashedPassword);
    return result;
}

// this function is async because bcrypt.compare is async
async function login(username, password) {
    const stmt = db.prepare('SELECT id, first, last, password FROM player WHERE username = ?');

    const row = stmt.get(username);
    if (!row) {
        console.log('User not found.');
        return { valid: false, message: 'User not found' };
    }

    const securelogin = (password === row.first.toLowerCase().trim() + row.id.toString()) ? false : true;

    // Compare the provided password with the stored hash
    const result = await bcrypt.compare(password, row.password);
    if (result) {
        console.log('Login successful! Passwords match.');
        return { valid: true, id: row.id, securelogin, message: 'Login successful!' };
    } else {
        console.log('Invalid credentials. Passwords do not match.');
        return { valid: false, message: 'Invalid credentials' };
    }
}

async function passwordMatches(username, password) {
    const stmt = db.prepare('SELECT id, first, last, password FROM player WHERE username = ?');

    const row = stmt.get(username);
    if (!row) {
        return { valid: false, message: 'User not found' };
    }

    // Compare the provided password with the stored hash
    const result = await bcrypt.compare(password, row.password);
    return result ? { valid: true, id: row.id, message: 'Old Password matches' } : { valid: false, message: 'Old Password does not match' };
}

async function changePassword(username, newPassword) {
    try {
        const saltRounds = 10;
        const hashedNewPassword = bcrypt.hashSync(newPassword, saltRounds);
        const updateStmt = db.prepare('UPDATE player SET password = ? WHERE username = ?');
        updateStmt.run(hashedNewPassword, username);
        return true;
    } catch (err) {
        console.error('Error changing password:', err);
        return false;
    }
}

const bulkregister = (users) => {
    // users is an array of objects with first and last properties
    const registered = [];
    users.forEach(user => {
        const result = register(user.first, user.last);
        registered.push({ first: user.first, last: user.last, ...result });
    });
    return registered;
}

const register = (first, last, username) => {
    // since only members can register and use this app,
    // we add the first and last name and username
    // to the player table. After adding the user we get their id and use that
    // to construct their temporary password (first + id). This is returned back to the app
    // which displays it to the admin user so they can inform the member of their temporary credentials.
    try {
        //check if username already exists
        const existingUser = userExists(username);
        if (existingUser) {
            console.error('Username already exists:', username);
            return { error: 'Username already exists' };
        }
        const stmt = db.prepare('INSERT INTO player (first, last, username) VALUES (?, ?, ?) returning id;');
        const id = stmt.get(first.trim(), last.trim(), username).id;
        const tempPassword = first.trim().toLowerCase() + id.toString();
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(tempPassword, saltRounds);
        const updateStmt = db.prepare('UPDATE player SET password = ? WHERE id = ?;');
        updateStmt.run(hashedPassword, id);
        return { username: username, tempPassword: tempPassword }
    } catch (err) {
        console.error('Error registering user:', err);
    }
}

const registeredUsers = () => {
    try {
        const stmt = db.prepare('SELECT first, last, username FROM player WHERE username IS NOT NULL;');
        return stmt.all();
    } catch (err) {
        console.error('Error fetching registered users:', err);
        return [];
    }
}

async function getTwoNonPlayer() {
    try {
        // const pool = new Pool({ 
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool
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
        // const pool = new Pool({ 
        //     user: process.env.PG_USER,  
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,      
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool
        const client = await pool.connect();
        const result = await client.query(`SELECT first FROM player ORDER BY RANDOM() LIMIT 18;`);
        client.release();
        return result.rows;
    } catch (err) {
        console.error('Error fetching 18 players:', err);
        return [];
    }
}

async function isNonPlayer(first) {
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool
        const client = await pool.connect();
        const result = await client.query('SELECT first FROM nonplayer where first = $1;', [first]);
        client.release();
        return result.rows.length > 0 ? true : false;
    } catch (err) {
        console.error('Error fetching isNonPlayer:', err);
        return false;
    }

}

function isPlayer(fullname, phone) {
    try {
        const first = fullname.split(' ')[0];
        const last = fullname.split(' ')[1];
        const stmt = db.prepare('SELECT * FROM player where lower(first) = ? AND lower(last) = ? AND phone = ?;');
        const result = stmt.all(first, last, phone.replaceAll('-', ''));
        console.log('isPlayer query result:', result);
        let exists = result.length > 0 ? true : false;
        return {
            exists, id: exists ? result[0].id : null, username: exists ? result[0].username : null,
            phone: exists ? result[0].phone : null,
            fullname: exists ? result[0].first + ' ' + result[0].last : null,
        };
    } catch (err) {
        console.error('Error checking isPlayer:', err);
        return false;
    }

}

async function getBridgeTerms() {
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool
        const client = await pool.connect();
        const result = await client.query('SELECT term FROM bridgeterm;');
        client.release();
        return result.rows;
    } catch (err) {
        console.error('Error fetching bridge terms:', err);
        return [];
    }
}
async function isInvalidBridgeTerm(term) {
    try {
        // const pool = new Pool({
        //     user: process.env.PG_USER,
        //     host: process.env.PG_HOST,
        //     database: process.env.PG_DATABASE,
        //     password: process.env.PG_PASSWORD,
        //     port: Number(process.env.PG_PORT) || 5432,
        //     ssl: { rejectUnauthorized: false } // try if cloud requires SSL
        // });
        const pool = globalPool
        const client = await pool.connect();
        const result = await client.query('SELECT valid FROM bridgeterm where term =$1;', [term]);
        client.release();
        return !(result.rows.length > 0 && result.rows[0].valid)
    } catch (err) {
        console.error('Error checking bridge term validity:', err);
        return false;
    }
}

module.exports = {
    userExists,
    addUser,
    changePassword,
    registeredUsers,
    isAdmin,
    getBridgeTerms,
    isInvalidBridgeTerm,
    isNonPlayer,
    isPlayer,
    login,
    register,
    bulkregister,
    passwordMatches
}