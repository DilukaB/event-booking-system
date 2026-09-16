const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary storage (files go directly to cloud, no local disk needed)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'event-booking',           // folder inside your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }],
    public_id: (req, file) => `event-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

module.exports = upload;
