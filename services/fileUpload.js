// Used to interact with AWS Service
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS
  .config
  .loadFromPath('config/aws_config.json');
var s3bucket = new AWS.S3({
  params: {
    Bucket: 'varshalteamprivatebucket'
  }
});

// To Upload media on S3
function s3Upload(files, path) {
  return new Promise((resolve, reject) => {
    try {

      var data = {
        Bucket: "varshalteamprivatebucket",
        Key: path,
        Body: files,
        ACL: 'public-read'
      };

      s3bucket.upload(data, function (err, rese) {
        if (err) {
          throw err
        }
        resolve(rese.Location);
      });
    }
    catch(e) {
      reject({message:"Could not upload image",err:e});
    }
  });
}

module.exports = s3Upload


