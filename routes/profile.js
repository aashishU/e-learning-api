const express = require('express');
const router = express.Router({mergeParams: true});
const { verifyToken } = require('../utils/middleware');

const handleAsyncErr = require('../utils/handleAsyncErr');
const AppError = require('../utils/AppError');

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


// Profile
router.get('/', verifyToken, handleAsyncErr(async (req, res) => {
    const { id } = req.user;
    // find student_profile in DB
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM student WHERE id = '${id}'`);
    client.release();

    const profile = result.rows[0];
    if (!profile) throw new AppError();

    // And send the student_profile with status code
    return res.status(200).json({ profile: profile });
}));

// View enrolled courses by currUser
router.get('/my-courses', verifyToken, handleAsyncErr(async (req, res) => {
    const user_id = req.user.id;

    // fetching enrolled_course from currUser row in student table
    const client = await pool.connect();
    let result = await client.query(`SELECT enrolled_course FROM student WHERE id = '${user_id}'`);

    // course_id's that currUser enrolled in
    const myCourses = (result.rows[0].enrolled_course);
    let courseList = [];

    // creating array of Promises for each query
    const promises = myCourses.map(async (courseId) => {
        result = await client.query(`SELECT * FROM course WHERE course_id = '${courseId}'`)
        return result.rows[0];
    });
    client.release();

    // Wait for all Promises to resolve
    const resolvedCourses = await Promise.all(promises);

    // Adding resolved courses to courseList and removing "Undefined"
    courseList = resolvedCourses.filter(course => course !== undefined);

    // response with status code and course data
    return res.status(200).json({ courseList });
}));

module.exports = router;