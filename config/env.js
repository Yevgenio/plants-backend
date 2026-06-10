const isProd = process.env.NODE_ENV === 'production';

const BASE_URL = process.env.BASE_URL || (isProd ? 'https://boukingolts.dev' : 'http://localhost:3000');
const API_URL = process.env.API_URL || (isProd ? 'https://api.boukingolts.dev' : 'http://localhost:5001');
const IMAGE_BUCKET_URL = process.env.IMAGE_BUCKET_URL
  || (process.env.AWS_ENDPOINT_URL && process.env.S3_BUCKET
    ? `${process.env.AWS_ENDPOINT_URL}/${process.env.S3_BUCKET}`
    : `http://localhost:9000/${process.env.S3_BUCKET || 'images'}`);

const hostname = new URL(BASE_URL).hostname;
const COOKIE_DOMAIN = isProd ? `.${hostname}` : undefined;

const CORS_ORIGINS = [
  'http://localhost:3000',
  BASE_URL,
  `https://www.${hostname}`,
  `https://staging.${hostname}`,
];

module.exports = { BASE_URL, API_URL, IMAGE_BUCKET_URL, COOKIE_DOMAIN, CORS_ORIGINS };
