require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');

const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

function test() {
    console.log("Test function in helper.js");
} 

const s3 = new S3Client({
    endpoint: "https://sfo3.digitaloceanspaces.com", // Replace with your space's region
    forcePathStyle: false, // Set to true if required by some third-party libraries
    region: "us-east-1", // AWS SDK requires a valid region string, but it's not used by DO
    credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY,
        secretAccessKey: process.env.SPACES_SECRET_KEY
    }
});

const storage = multerS3({
  s3,
  bucket: process.env.SPACES_BUCKET,
  key: function (req, file, cb) {
    const idx=file.originalname.lastIndexOf('.');
    const ext=idx>0?file.originalname.substring(idx):'';
    const data=req.body;
    const folder = "playerimages/";
    const uniqueSuffix = (new Date()).valueOf().toString();
    const filename = data.first.toLowerCase()+data.last.toLowerCase()+'-'+uniqueSuffix+ext;
    req.newFileName = folder+filename;
    cb(null,folder + filename);
    // cb(null, Date.now().toString() + '-' + file.originalname);
  },
  // Optional: Set ACL for public-read
  acl: 'public-read',
  // Optional: Set content type
  contentType: multerS3.AUTO_CONTENT_TYPE
});

const upload = multer({ storage })

module.exports = {
    test,
    upload
};
