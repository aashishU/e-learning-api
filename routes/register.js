const express = require('express');
const router = express.Router({mergeParams: true});
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const handleAsyncErr = require('../utils/handleAsyncErr');
const AppError = require('../utils/AppError');
const { randomString } = require('../utils/seedData');
const { registerEmail, courseEnrollEmail, resetPasswordEmail } = require('../utils/email');

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

// Register new student
router.post('/', upload.single('image'), handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const studentSchema = Joi.object({
        student: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')).required()
        }).required()
    });

    // Validate req.body data
    const { error } = studentSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    // get data from req.body
    const { name, email, password } = req.body.student;
    const newId = { id: randomString(10) };

    // Image Upload for Avatar 
    const default_data = {
        url: 'https://res.cloudinary.com/dfjkjdfdo/image/upload/v1712916868/eLearningApi/avatar.png', filename: 'eLearningApi/avatar'
    };

    // get data from req.file
    const data = req.file !== undefined ? { url: `${req.file.path}`, filename: `${req.file.filename}` } : default_data;
    const avatar = JSON.stringify(data);

    // Convert password into HASH...
    const hash = await bcrypt.hash(password, 12);

    // check if email is unique
    const client = await pool.connect();
    const result = await client.query(`SELECT id FROM student WHERE email = '${email}'`);
    const isEmailPresent = (result.rows[0]);

    if (isEmailPresent) {
        client.release();
        throw new AppError("Email already exist", 409);
    }

    // insert data into student table and create new student
    await client.query(`INSERT INTO student (id, name, email, password, avatar, enrolled_course) VALUES ('${newId.id}', '${name}', '${email}', '${hash}', '${avatar}', ARRAY[]::varchar[])`);
    client.release();

    // CREATE JWT and put newId in it
    const token = jwt.sign(newId, ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

    // Register Email
    registerEmail(email, name);

    // send jwt back with status code
    return res.status(200).json({ authToken: token });
}));

// Register new SuperUser
router.post('/su', handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const superuserSchema = Joi.object({
        su: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')).required()
        }).required()
    });

    // Validate req.body data
    const { error } = superuserSchema.validate(req.body);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    // get data from req.body
    const { name, email, password } = req.body.su;
    const new_id = { id: randomString(20) };

    // convert password into HASH
    const hash = await bcrypt.hash(password, 12);

    // check if email is unique
    const client = await pool.connect();
    const result = await client.query(`SELECT su_id FROM superuser WHERE su_email = '${email}'`);
    const isEmailPresent = (result.rows[0]);

    if (isEmailPresent) {
        client.release();
        throw new AppError("Email already exist!!", 409);
    }

    // insert data into superuser table and create new superuser
    await client.query(`INSERT INTO superuser (su_id, su_name, su_email, su_password) VALUES ('${new_id.id}', '${name}', '${email}', '${hash}')`);
    client.release();

    // CREATE JWT and put newId in it
    const token = jwt.sign(new_id, ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

    // send jwt back with status code
    return res.status(200).json({ authToken: token });
}));

module.exports = router;