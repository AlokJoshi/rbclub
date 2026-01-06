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
    const filename=data.first.toLowerCase()+data.last.toLowerCase()+ext;
    req.newFileName=folder+filename;
    cb(null,folder + filename);
    // cb(null, Date.now().toString() + '-' + file.originalname);
  },
  // Optional: Set ACL for public-read
  acl: 'public-read',
  // Optional: Set content type
  contentType: multerS3.AUTO_CONTENT_TYPE
});

const upload = multer({ storage })

// ; (async () => {
//     try {
//         const buckets = await s3.send(new ListBucketsCommand({}));
//         for (const bucket of buckets.Buckets) {
//             if (bucket.Name === process.env.SPACES_BUCKET) {
//                 console.log(`Found bucket: ${bucket.Name} (created on ${bucket.CreationDate})`);
//                 const folders = await s3.send(new ListObjectsV2Command({ Bucket: bucket.Name, Prefix: '', Delimiter: '/' }));
//                 const foldersList = folders.CommonPrefixes;
//                 if (foldersList.length === 0) {
//                     console.log("No folders found in bucket.");
//                 } else {
//                     foldersList.forEach(folder => {
//                         console.log("Folder:", folder.Prefix);
//                     });
//                 }
//             }
//             console.log("Buckets:", buckets.Buckets);
//         }
//     } catch (err) {
//         console.error('Error listing S3 buckets:', err);
//     }
// })();

module.exports = {
    test,
    upload
};
