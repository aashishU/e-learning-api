const jwt = require('jsonwebtoken');

// NEON DB Connection
const { Pool } = require('pg');
require('dotenv').config();

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ACCESS_TOKEN_SECRET } = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: false,
    },
});


// Middleware function to verify JWT token
function verifyToken(req, res, next) {
    // Get the JWT token from the Authorization header
    const token = req.headers['authorization'];

    // Check if token is provided
    if (!token) return res.status(401).json({ error: 'Token is required' });

    // Verify the token
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, currId) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }

        // If token is valid, save decoded token to request object for use in other middleware or routes
        req.user = currId;
        next();
    });
}

// isSuperuser
async function isSuperuser(req, res, next) {

    const currId = req.user.su_id;

    // check if currId is superuser table in DB
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM superuser WHERE su_id = '${currId}'`);
    client.release();

    const su = result.rows[0];
    if (!su) return res.status(403).send("Request Forbidden!");

    next();
}

module.exports = { verifyToken, isSuperuser };