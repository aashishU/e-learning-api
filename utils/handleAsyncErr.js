// function to catch async errors and pass them to Error Handling Middleware
function handleAsyncErr(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(err => next(err));
    }
}

module.exports = handleAsyncErr;