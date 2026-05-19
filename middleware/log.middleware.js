const Log = require('../models/log.model');

const logRequest = async (req, res, next) => {
    if (req.path === '/healthz') return next();

    const startTime = Date.now();

    res.on('finish', async () => {  // Log only after response is sent
        const duration = Date.now() - startTime;

        let ip = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.socket.remoteAddress;
        ip = ip.replace(/^::ffff:/, '');

        const logData = {
            timestamp: new Date(),
            method: req.method,
            url: req.originalUrl,  // The page or API endpoint the user accessed
            ip: ip, 
            user: req.user ? req.user._id : null,  // Store user ID if logged in
            status: res.statusCode,
            responseTime: `${duration}ms`
        };
        try {
            await Log.create(logData); // Save log entry in MongoDB
        } catch (error) {
            console.error('Logging Error:', error);
        }
    });

    next(); // Pass control to the next middleware
};

module.exports = logRequest;
