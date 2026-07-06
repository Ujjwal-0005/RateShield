const logger = (req, res, next) => {
    let timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.originalUrl}`);
    
    next();

};

module.exports = logger;
