const appLogger = require('./appLogger');

let logger = null;

if (process.env.NODE_ENV !== 'production') {
    logger = appLogger();
};

module.exports = logger;
