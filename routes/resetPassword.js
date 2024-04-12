const express = require('express');
const router = express.Router({ mergeParams: true });
const Joi = require('joi');

const handleAsyncErr = require('../utils/handleAsyncErr');
const AppError = require('../utils/AppError');
const randomPasswordHash = require('../utils/randomPasswordHash');
const { resetPasswordEmail } = require('../utils/email');


// NEON DB Connection
const { Pool } = require('pg');
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, NODE_ENV } = process.env;

if (NODE_ENV !== "production") {
    require('dotenv').config();
}

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

// Password Reset for Student(need email)
router.post('/', handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const resetPasswordSchema = Joi.object({
        email: Joi.string().email().lowercase().required()
    });

    // Validate req.body data
    const { error } = resetPasswordSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    // get email from req.body
    const { email } = req.body;

    // generate random password, save hash of random password
    const newPassword = await randomPasswordHash();
    const password = newPassword.password;
    const hash = newPassword.hash;
    console.log(newPassword)

    // UPDATE student SET password = ${hash} WHERE email = ${email}
    const client = await pool.connect();
    const result = await client.query(`UPDATE student SET password = '${hash}' WHERE email = '${email}'`);
    client.release();

    if (result.rowCount === 0) throw new AppError("Invalid Email Address", 401);

    // send mail to email with ${new password}
    resetPasswordEmail(email, password);

    // send message back with status code
    return res.status(200).json({ message: "New Password Generated, Check Email" });
}));

// Password Reset for superAdmin/superUser
router.post('/su', handleAsyncErr(async (req, res) => {

    // Define Joi schema for req.body data
    const resetPasswordSchema = Joi.object({
        email: Joi.string().email().lowercase().required()
    });

    // Validate req.body data
    const { error } = resetPasswordSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    // get email from req.body
    const { email } = req.body;

    // generate random password, save hash of random password
    const newPassword = await randomPasswordHash();
    const password = newPassword.password;
    const hash = newPassword.hash;

    // UPDATE superuser SET password = ${hash} WHERE email = ${email}
    const client = await pool.connect();
    const result = await client.query(`UPDATE superuser SET su_password = '${hash}' WHERE su_email = '${email}'`);
    client.release();

    if (result.rowCount === 0) throw new AppError("Invalid Email Address", 401);

    // send mail to email with ${new password}
    resetPasswordEmail(email, password);

    // send message back with status code
    return res.status(200).json({ message: "New Password Generated, Check Email" });
}));

module.exports = router;