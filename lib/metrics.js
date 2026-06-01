const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'backend_' });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const productViews = new client.Counter({
  name: 'gallery_product_views_total',
  help: 'Product page views',
  labelNames: ['product_id', 'product_name'],
  registers: [register],
});

const eventViews = new client.Counter({
  name: 'gallery_event_views_total',
  help: 'Event page views',
  labelNames: ['event_id', 'event_name'],
  registers: [register],
});

module.exports = { register, httpRequestsTotal, httpRequestDuration, productViews, eventViews };
