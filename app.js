const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const AppError = require('./utils/AppError');
const logger = require("./logger");

const login = require('./routes/login');
const register = require('./routes/register');
const resetPassword = require('./routes/resetPassword');
const courses = require('./routes/courses');
const profile = require('./routes/profile');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Middleware to log HTTP requests
app.use(async (req, res, next) => {
    // Log request details
    logger.info(`req, ${req.method} ${req.originalUrl}`);

    // Log response details after the response is sent
    res.on('finish', () => {
        logger.info(`resp, ${res.statusCode} ${res.statusMessage}`);
    });

    next();
});

app.use('/login', login);

app.use('/register', register);

app.use('/reset-password', resetPassword);

app.use('/courses', courses);

app.use('/profile', profile);


app.all("*", (req, res, next) => {
    next(new AppError('Page Not Found', 404))
})

// Error Handling Middleware
app.use((err, req, res, next) => {
    const { message = 'Internal Server Error', status = 500 } = err;
    logger.error(`ERROR : ${message}`)
    res.status(status).send(`error : ${message}`);
})

app.listen(3000, () => {
    console.log("Serving on port 3000");
});
