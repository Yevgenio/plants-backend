const Log = require('../models/log.model');
const { httpRequestsTotal, httpRequestDuration } = require('../lib/metrics');

function normalizeRoute(url) {
  return url
    .replace(/\/id\/[a-f0-9]{24}/gi, '/id/:id')
    .replace(/\/[a-f0-9]{24}/gi, '/:id')
    .split('?')[0];
}

const logRequest = async (req, res, next) => {
    if (req.path === '/healthz' || req.path === '/metrics') return next();

    const startTime = Date.now();

    res.on('finish', async () => {
        const duration = Date.now() - startTime;

        let ip = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : req.socket.remoteAddress;
        ip = ip.replace(/^::ffff:/, '');

        const route = normalizeRoute(req.originalUrl);
        httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
        httpRequestDuration.observe({ method: req.method, route }, duration / 1000);

        const logData = {
            timestamp: new Date(),
            method: req.method,
            url: req.originalUrl,
            ip,
            user: req.user ? req.user._id : null,
            status: res.statusCode,
            responseTime: `${duration}ms`,
            userAgent: req.headers['user-agent'] || null,
            referer: req.headers['referer'] || null,
            contentLength: parseInt(req.headers['content-length']) || 0,
        };
        try {
            await Log.create(logData);
        } catch (error) {
            console.error('Logging Error:', error);
        }
    });

    next();
};

module.exports = logRequest;
