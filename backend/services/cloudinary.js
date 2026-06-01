const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary service connected successfully.');
} else {
  console.log('Cloudinary not configured. Falling back to local file system upload.');
}

const uploadToCloudinary = (fileBuffer, folder = 'magizhvagam') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(new Error('Cloudinary is not configured.'));
    }
    
    cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    ).end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Error deleting image from Cloudinary: ${error.message}`);
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary
};
