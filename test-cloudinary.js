const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: './.env' });

console.log('Testing Cloudinary configuration...');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', process.env.CLOUDINARY_API_KEY);
console.log('API secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'undefined');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.ping()
  .then(result => {
    console.log('Cloudinary connection successful:', result);
  })
  .catch(error => {
    console.error('Cloudinary connection failed:', error);
  });