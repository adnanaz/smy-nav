import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// Verify configuration
if (!process.env.CLOUDINARY_URL) {
  console.error('❌ CLOUDINARY_URL not found in environment variables');
} else {
  console.log('✅ Cloudinary configured successfully');
}

// Helper function to upload file to Cloudinary
export const uploadToCloudinary = async (file, folder = 'smy-nav/participants') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto', // Automatically detect file type
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default cloudinary;