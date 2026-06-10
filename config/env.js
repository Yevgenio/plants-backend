const isProd = process.env.NODE_ENV === 'production';

const BASE_URL = process.env.BASE_URL || (isProd ? 'https://boukingolts.dev' : 'http://localhost:3000');
const API_URL = process.env.API_URL || (isProd ? 'https://api.boukingolts.dev' : 'http://localhost:5001');

const CORS_ORIGINS = [
  'http://localhost:3000',
  BASE_URL,
  `https://www.${new URL(BASE_URL).hostname}`,
  `https://staging.${new URL(BASE_URL).hostname}`,
];

module.exports = { BASE_URL, API_URL, CORS_ORIGINS };
