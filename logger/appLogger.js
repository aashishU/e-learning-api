const winston = require('winston');
const { createLogger } = require("winston");
const Transport = require('winston-transport');

// NEON DB Connection
const { Pool } = require('pg');
require('dotenv').config();

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

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

// Custom Winston transport for PostgreSQL
class NanoTransport extends Transport {
    constructor(opts) {
        super(opts);
        this.pool = opts.pool;
    }

    log(info, callback) {
        const logEntry = {
            level: info.level,
            message: info.message,
            timestamp: new Date().toISOString()
        };



        this.pool.connect((err, client, release) => {
            if (err) {
                console.error('Error acquiring client from pool:', err);
                return callback(err);
            }

            client.query(`INSERT INTO log (level, message, timestamp) VALUES('${logEntry.level}', '${logEntry.message}', '${logEntry.timestamp}')`, (err) => {
                release(); // Release the client back to the pool
                if (err) {
                    console.error('Error inserting log into DB:', err);
                    return callback(err);
                }
                callback(); // Signal completion
            });
        });
    }
}

// Example usage:
const nanoTransport = new NanoTransport({ pool });

const appLogger = () => {
    return createLogger({
        // level: 'info',
        transports: [
            new winston.transports.File({ filename: 'combined.log' }),
            nanoTransport

        ],
    });

}

module.exports = appLogger;