const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;

const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
const hasCloudinaryKeys = Boolean(
  cloudName
  && apiKey
  && apiSecret,
);

if (!hasCloudinaryUrl && !hasCloudinaryKeys) {
  throw new Error(
    'Cloudinary is not configured. Add CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
  );
}

cloudinary.config(
  hasCloudinaryUrl
    ? { secure: true }
    : {
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      },
);

const uploadPropertyImage = async (file) => {
  if (!file || !file.buffer) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'homehive/properties',
        resource_type: 'image',
        overwrite: false,
        transformation: [
          { width: 1600, height: 1000, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

module.exports = {
  cloudinary,
  uploadPropertyImage,
};
