const express = require('express');
const router = express.Router({mergeParams: true});
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleAsyncErr = require('../utils/handleAsyncErr');
const AppError = require('../utils/AppError');

// NEON DB Connection
const { Pool } = require('pg');
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ACCESS_TOKEN_SECRET, NODE_ENV } = process.env;

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

// LOGIN for students
router.post('/', handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const studentLoginSchema = Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')).required()
    });

    // Validate req.body data
    const { error } = studentLoginSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    const { email, password } = req.body;

    // check if username and password exist and match with student table
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM student WHERE email = '${email}'`);
    client.release();

    const user = result.rows[0];
    // if user with given email doesn't exist
    if (!user) throw new AppError("Invalid email or password!", 401);

    // check password
    const validPassword = await bcrypt.compare(password, user.password);

    // if password is incorrect
    if (!validPassword) throw new AppError("Invalid email or password!", 401)

    const currId = { id: user.id };

    // CREATE JWT and put student ID in it
    const token = jwt.sign(currId, ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

    // send jwt back with status code
    return res.status(200).json({ authToken: token });
}));

// LOGIN for SuperUser
router.post('/su', handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const suLoginSchema = Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')).required()
    });

    // Validate req.body data
    const { error } = suLoginSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    const { email, password } = req.body;

    // check if username and password exist and match with superuser table
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM superuser WHERE su_email = '${email}'`);
    client.release();

    const user = (result.rows[0]);
    // if user with given email doesn't exist
    if (!user) throw new AppError("Invalid email or password!", 401);

    // check password
    const validPassword = await bcrypt.compare(password, user.su_password);

    // if password is incorrect
    if (!validPassword) throw new AppError("Invalid email or password!", 401)

    const currId = { su_id: user.su_id };

    // CREATE JWT and put student account details in it
    const token = jwt.sign(currId, ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

    // send jwt back with status code
    return res.status(200).json({ authToken: token });
}));

module.exports = router;