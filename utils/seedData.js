let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, NODE_ENV } = process.env;
const { json } = require('body-parser');
const bcrypt = require('bcrypt');
const randomPasswordHash = require('./randomPasswordHash');

if (NODE_ENV !== "production") {
    require('dotenv').config();
}

// NEON DB
const { Pool } = require('pg');

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
    },
});


// Create unique id's
function randomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = { randomString };


// Create Student Table
const createStudentTable = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('CREATE TABLE student (id VARCHAR(30) PRIMARY KEY, name VARCHAR(50) NOT NULL, email VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(100) NOT NULL, avatar JSONB, enrolled_course VARCHAR[])');
        // avatar[image_url, file_name]
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
    console.log('Table created');
}

// Create SuperUser Table
const createSuperuserTable = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('CREATE TABLE superuser (su_id VARCHAR(30) PRIMARY KEY, su_name VARCHAR(50), su_email VARCHAR(50) UNIQUE NOT NULL, su_password VARCHAR(100) NOT NULL )');

    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
    console.log('Table created');
}


// Create Course Table
const createCourseTable = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('CREATE TABLE course (course_id SERIAL PRIMARY KEY, course_name VARCHAR(30) UNIQUE NOT NULL, category VARCHAR(30), level VARCHAR(30), total_enrollments INT)');

    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }

    console.log('Table Created');
}

// Create Log Table
const createLogTable = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('CREATE TABLE log (id SERIAL PRIMARY KEY, level VARCHAR(10), message VARCHAR(100), timestamp VARCHAR(80))');
        console.log("Table Created")
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}

// default_avatar : ['https://res.cloudinary.com/dfjkjdfdo/image/upload/v1712905149/eLearningApi/akixhsid9i14tejdljtw.png','eLearningApi/akixhsid9i14tejdljtw']

// Student Data
const seedStudentTable = async () => {
    const client = await pool.connect();
    const password = (await randomPasswordHash()).hash;
    const testPassword = await bcrypt.hash('Test@Account123', 12);
    const default_data = {
        url: 'https://res.cloudinary.com/dfjkjdfdo/image/upload/v1712916868/eLearningApi/avatar.png', filename: 'eLearningApi/avatar'
    };
    const avatar = JSON.stringify(default_data);
    try {
        const res = await client.query(`
        INSERT INTO student (id, name, email, password, avatar, enrolled_course) 
        VALUES ('${randomString(10)}', 'Test Student', 'testaccount123@gmail.com', '${testPassword}', '${avatar}', ARRAY[]::varchar[]),
        ('${randomString(10)}', 'Julian Holder', 'quis@yahoo.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Ashely Frye', 'et.magnis@google.edu', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Kenyon Oneil', 'consectetuer.rhoncus@google.edu', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Ivory Macias', 'ac.arcu.nunc@outlook.org', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Sara Price', 'nec.orci@icloud.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Sydney Sosa', 'gravida.mauris@hotmail.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Evangeline Morrison', 'leo.morbi@yahoo.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Justina Atkinson', 'mus.aenean@aol.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Noel Carpenter', 'lacinia.sed.congue@hotmail.com', '${password}', '${avatar}', ARRAY[]::varchar[]), 
        ('${randomString(10)}', 'Jack Emerson', 'nec.quam@hotmail.com', '${password}', '${avatar}', ARRAY[]::varchar[])`);

        console.log("Student Table Seeded");

    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}

// SuperUser Data
const seedSuperuserData = async () => {
    const testPassword = await bcrypt.hash('Super@Admin123', 12);
    const client = await pool.connect();

    try {
        const res = await client.query(`
        INSERT INTO superuser (su_id, su_name, su_email, su_password) 
        VALUES ('${randomString(20)}', 'Super Admin', 'superadmin123@gmail.com', '${testPassword}')`);

        console.log("SU Table Seeded");

    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}


// Course Data
const seedCourseTable = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query(`
        INSERT INTO course (course_name, category, level, total_enrollments) 
        VALUES ('physics', 'science', 'intermediate', 4), 
        ('chemistry', 'science', 'beginner', 1),
        ('accounts', 'commerce', 'advance', 3),
        ('history', 'arts', 'beginner', 6),
        ('political science', 'arts', 'intermediate', 8),
        ('mathematics', 'commerce', 'intermediate', 1)`);

    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
    console.log("Course Table Seeded");
}


// Delete Table
const deleteTable = async () => {
    const table = 'log';
    const client = await pool.connect();
    await client.query(`DROP TABLE ${table}`);
    console.log(`${table} DELETED!!`);
    client.release();
}

// STEP - 1 (Create Tables)
// createStudentTable()
// createCourseTable();
// createSuperuserTable();
// createLogTable();

// STEP - 2 (Seed Data)
// seedStudentTable();
// seedCourseTable();
// seedSuperuserData();

// STEP -3 (Delete table if needed)
// deleteTable();