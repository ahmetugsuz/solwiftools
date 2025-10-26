const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Upload file to S3 for bundler section
const uploadBundlerImageToS3 = async (file) => {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const key = `bundler-images/${uuidv4()}.${fileExtension}`;
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image');
  }
};

// Delete file from S3 for bundler section
const deleteBundlerImageFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split('/').pop();
    const params = {
      Bucket: BUCKET_NAME,
      Key: `bundler-images/${key}`
    };
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete image');
  }
};

module.exports = {
  uploadBundlerImageToS3,
  deleteBundlerImageFromS3
}; 