const express = require('express');
const router = express.Router({mergeParams: true});
const Joi = require('joi');

const handleAsyncErr = require('../utils/handleAsyncErr');
const AppError = require('../utils/AppError');
const { courseEnrollEmail } = require('../utils/email');
const { verifyToken, isSuperuser } = require('../utils/middleware');


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


// All Courses
router.get('/', verifyToken, handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const courseSchema = Joi.object({
        name: Joi.string().lowercase(),
        category: Joi.string().lowercase(),
        level: Joi.string().lowercase(),
        page: Joi.allow(),
        limit: Joi.allow()
    });

    // Validate req.query data
    const { error } = courseSchema.validate(req.query);

    if (error) {
        let msg = (`${error.details.map(el => el.message).join(',')}`);
        if (msg.length > 80) {
            msg = msg.slice(0, 80);
        }
        throw new AppError(msg, 400);
    }

    // Filter Results
    let { name = "", category = "", level = "", page, limit } = req.query;

    // Construct the SQL query based on filtering options
    let query = 'SELECT * FROM course';
    let conditions = [];

    if (name) {
        conditions.push(`course_name = '${name}'`);
    }

    if (category) {
        conditions.push(`category = '${category}'`);
    }
    if (level) {
        conditions.push(`level = '${level}'`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // Paginated Results
    page = Number(page) || 1;
    limit = Number(limit > 5 ? 5 : limit) || 3;
    const results = {}

    const offset = (page - 1) * limit;

    // getting data from DB
    query += ` ORDER BY course_id LIMIT ${limit} OFFSET ${offset}`;

    const client = await pool.connect();
    const response = await client.query(query);

    // To get total number of results present for showing Next Page
    let countQuery = 'SELECT COUNT(*) FROM course ';
    if (conditions.length > 0) {
        countQuery += ` WHERE ` + conditions.join(' AND ');
    }
    const { rows } = await client.query(countQuery);
    client.release();

    const count = Number(rows[0].count);

    const startIndex = offset;
    const endIndex = page * limit;


    if (endIndex < count) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }


    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }

    results.results = response.rows;

    // return courses with status code
    return res.status(200).json(results);
}));

// currUser enroll in a course
router.get('/:course_id/enroll', verifyToken, handleAsyncErr(async (req, res) => {
    const user_id = req.user.id;
    const { course_id } = req.params;

    // currUser.enrolled_course add course_id
    const client = await pool.connect();
    const result = await client.query(`
    UPDATE student 
    SET enrolled_course = enrolled_course || ARRAY['${course_id}'] 
    WHERE id = '${user_id}'
    AND NOT EXISTS (
        SELECT 1 FROM student
        WHERE id = '${user_id}'
        AND '${course_id}' = ANY(enrolled_course)
    );`)

    // Error message for adding course_id to enrolled_course if already present
    if (result.rowCount === 0) {
        client.release();
        throw new AppError("Course already present!", 400);
    }

    // course.total_enrollments + 1
    await client.query(`
    UPDATE course
    SET total_enrollments = total_enrollments + 1
    WHERE course_id = '${course_id}'`);

    // find currUser email and name to send email
    const student = await client.query(`
    SELECT * FROM student
    WHERE id = '${user_id}'`);

    // find courseName to send email
    const course = await client.query(`
    SELECT course_name FROM course
    WHERE course_id = '${course_id}'
    `)

    client.release();

    const { name, email } = student.rows[0];
    const { course_name } = course.rows[0];

    // Send Course enrollment notification Email
    courseEnrollEmail(email, name, course_name);

    return res.status(200).json({ message: "New Course Enrolled" });
}));

// __________________________## CRUD For SuperUser ONLY ##____________________________

// Add new course
router.post('/new', verifyToken, isSuperuser, handleAsyncErr(async (req, res) => {

    // Define Joi schema for req.body data
    const courseSchema = Joi.object({
        course_name: Joi.string().required(),
        category: Joi.string().required(),
        level: Joi.string().required()
    });

    // Validate req.body data
    const { error } = courseSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400)
    }

    // req.body data
    const { course_name, category, level } = req.body;
    const total_enrollments = 0;

    // Check if course already present
    const client = await pool.connect();
    const courseExist = await client.query(`SELECT * FROM course WHERE course_name = '${course_name}'`);

    if (courseExist.rows[0]) {
        client.release();
        throw new AppError("Course already Present", 400);
    }

    // insert in course table
    const result = await client.query(`INSERT INTO course (course_name, category, level, total_enrollments) VALUES ('${course_name}', '${category}', '${level}', ${total_enrollments})`);
    client.release();

    if (result.rowCount === 0) throw new AppError();

    // return status code and success message
    return res.status(200).json({ message: "New Course added successfully" });
}));

// Update existing course
router.put('/:course_id', verifyToken, isSuperuser, handleAsyncErr(async (req, res) => {
    // Define Joi schema for req.body data
    const courseSchema = Joi.object({
        course_name: Joi.string().required(),
        category: Joi.string().required(),
        level: Joi.string().required(),
        total_enrollments: Joi.number().min(0).required()
    });

    // Validate req.body data
    const { error } = courseSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400)
    }

    // req.params course_id to update and other data in req.body
    const { course_id } = req.params;
    const { course_name, category, level, total_enrollments } = req.body;

    // check for same course_name
    const client = await pool.connect();
    let result = await client.query(`SELECT * FROM course WHERE NOT course_id = '${course_id}' AND course_name = '${course_name}'`);

    if (result.rows[0]) {
        client.release();
        throw new AppError("Course Name already exist", 401);
    }

    // Update query in db
    result = await client.query(`UPDATE course SET course_name = '${course_name}', category = '${category}', level = '${level}', total_enrollments = ${total_enrollments} WHERE course_id = '${course_id}'`);
    client.release();

    // Course to be updated is NOT FOUND!
    if (result.rowCount === 0) throw new AppError("Course not found!", 404);

    return res.status(200).json({ message: "Course updated successfully!" });
}));

// Delete existing course
router.delete('/:course_id', verifyToken, isSuperuser, handleAsyncErr(async (req, res) => {
    // req.params course_id to delete
    const { course_id: id } = req.params;

    // search and delete course from course table in DB
    const client = await pool.connect();
    const result = await client.query(`DELETE FROM course WHERE course_id = '${id}'`);
    client.release();

    if (result.rowCount === 0) throw new AppError("Course not found!", 404);

    // return status code and success message
    return res.status(200).json({ message: "Course deleted successfully" });
}));


module.exports = router;