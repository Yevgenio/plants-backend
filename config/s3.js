const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  ...(process.env.S3_ENDPOINT_URL && { endpoint: process.env.S3_ENDPOINT_URL }),
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: !!process.env.S3_ENDPOINT_URL,
});

const bucket = () => process.env.S3_BUCKET;

const putObject = (key, buffer, contentType) =>
  s3.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: buffer, ContentType: contentType }));

const deleteObject = (key) =>
  s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));

module.exports = { s3, putObject, deleteObject };
