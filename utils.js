const pg_1 = require("pg");
// Configuration for your local PostgreSQL instance
const pool = new pg_1.Pool({
    user: process.env.PG_USER, // Replace with your PG username
    host: process.env.PG_HOST, // Google cloud SQL IP address
    database: process.env.PG_DATABASE, // Replace with your database name
  password: 'G80#ssPK', // Replace with your PG password
    port: Number(process.env.PG_PORT) || 5432, //PG port specified in cloud SQL
    //myipaddress is 99.151.24.46   // Default PG port
});
// Function to fetch data from a table
async function fetchDataFromTable() {
    const query = 'SELECT * FROM player;'; // Replace 'users' with your table name
    try {
        const client = await pool.connect();
        const result = await client.query(query);
        //console.log('Data from table:', result.rows);
        client.release(); // Release the client back to the pool
        return result.rows;
    }
    catch (err) {
        console.error('Error executing query', err.stack);
    }
    finally {
        // Optional: Close the pool completely when done (for short-lived scripts)
        // await pool.end(); 
    }
}
async function createPlayerTable() {
  const tableBody = document.getElementById('mainTableBody');
  const data = await fetchDataFromTable(); 
  for (const row of data) {
    const tableRow = document.createElement('tr');
    for (const key in row) {
      const cell = document.createElement('td');
      cell.textContent = row[key];
      tableRow.appendChild(cell);
    }
    tableBody.appendChild(tableRow);
  }
}
module.exports = { greet, createPlayerTable };
