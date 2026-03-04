require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');

const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    endpoint: "https://sfo3.digitaloceanspaces.com", // Replace with your space's region
    forcePathStyle: false, // Set to true if required by some third-party libraries
    region: "us-east-1", // AWS SDK requires a valid region string, but it's not used by DO
    credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY,
        secretAccessKey: process.env.SPACES_SECRET_KEY
    }
});

const avatarStorage = multerS3({
  s3,
  bucket: process.env.SPACES_BUCKET,
  key: function (req, file, cb) {
    const idx = file.originalname.lastIndexOf('.');
    const ext = idx > 0 ? file.originalname.substring(idx) : '';
    const data = req.body;
    const folder = "playerimages/";
    const uniqueSuffix = (new Date()).valueOf().toString();
    const filename = `${data.first.toLowerCase() + data.last.toLowerCase()}-${uniqueSuffix}${ext}`;
    req.newFileName = folder + filename;
    cb(null, folder + filename);
  },
  // Optional: Set ACL for public-read
  acl: 'public-read',
  // Optional: Set content type
  contentType: multerS3.AUTO_CONTENT_TYPE
});

const celebrationStorage = multerS3({
  s3,
  bucket: process.env.SPACES_BUCKET,
  key: function (req, file, cb) {
    const idx = file.originalname.lastIndexOf('.');
    const ext = idx > 0 ? file.originalname.substring(idx) : '';
    const data = req.body;
    const folder = "celebrationimages/";
    const uniqueSuffix = (new Date()).valueOf().toString();
    const filename = `${data.celebrationid}-${uniqueSuffix}${ext}`;
    req.newFileName = folder + filename;
    cb(null, folder + filename);
  },
  // Optional: Set ACL for public-read
  acl: 'public-read',
  // Optional: Set content type
  contentType: multerS3.AUTO_CONTENT_TYPE
});


const celebrationMultiStorage = multerS3({
  s3,
  bucket: process.env.SPACES_BUCKET,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '';
    const celebrationId = req.body.celebrationid || 'unknown';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `celebrationimages/${celebrationId}-${unique}${ext}`);
  }
});

const celebrationMultiUpload = multer({
  storage: celebrationMultiStorage,
  limits: { files: 10, fileSize: 10 * 1024 * 1024 }
});

const avatarUpload = multer({ storage: avatarStorage })
const celebrationUpload = multer({ storage: celebrationStorage })

module.exports = {
    avatarUpload,
    avtarUpload: avatarUpload,
    celebrationUpload,
    celebrationMultiUpload
};

/* suggested by

require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT, // e.g. https://sfo3.digitaloceanspaces.com
  region: 'us-east-1',
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY
  }
});

const celebrationMultiStorage = multerS3({
  s3,
  bucket: process.env.SPACES_BUCKET,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '';
    const celebrationId = req.body.celebrationid || 'unknown';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `celebrationimages/${celebrationId}-${unique}${ext}`);
  }
});

const celebrationMultiUpload = multer({
  storage: celebrationMultiStorage,
  limits: { files: 10, fileSize: 5 * 1024 * 1024 }
});

module.exports = {
  celebrationMultiUpload
};


GPT-5.3-Codex*/
