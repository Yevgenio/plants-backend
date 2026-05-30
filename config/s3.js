const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: !!process.env.AWS_ENDPOINT_URL,
});

const bucket = () => process.env.S3_BUCKET;

const putObject = (key, buffer, contentType) =>
  s3.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: buffer, ContentType: contentType }));

const deleteObject = (key) =>
  s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));

module.exports = { s3, putObject, deleteObject };
