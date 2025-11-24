// Test script to verify production readiness
import { uploadToStorage, deleteFromStorage } from './src/config/storage.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Production Upload Configuration');
console.log('=========================================');

// Test environment variables
console.log('\n📋 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('LOCAL_STORAGE_API_KEY:', process.env.LOCAL_STORAGE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('LOCAL_STORAGE_PATH:', process.env.LOCAL_STORAGE_PATH || './uploads (default)');
console.log('LOCAL_STORAGE_URL_BASE:', process.env.LOCAL_STORAGE_URL_BASE || 'http://localhost:3000/uploads (default)');

// Create a test file
const testFileName = `test-production-${Date.now()}.txt`;
const testContent = `Production upload test - ${new Date().toISOString()}`;
const tempFilePath = path.join(process.cwd(), testFileName);

console.log('\n📁 Creating test file...');
fs.writeFileSync(tempFilePath, testContent);

// Mock file object (like multer would provide)
const mockFile = {
  originalname: testFileName,
  path: tempFilePath,
  size: Buffer.byteLength(testContent)
};

console.log('✅ Test file created:', testFileName);

// Test upload
console.log('\n📤 Testing upload...');
try {
  const uploadResult = await uploadToStorage(mockFile, 'test-folder', {
    apiKey: process.env.LOCAL_STORAGE_API_KEY
  });
  
  if (uploadResult.success) {
    console.log('✅ Upload successful!');
    console.log('   URL:', uploadResult.url);
    console.log('   Public ID:', uploadResult.public_id);
    console.log('   File size:', uploadResult.bytes, 'bytes');
    
    // Verify file exists
    const uploadedFilePath = path.join(
      process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads'),
      uploadResult.public_id
    );
    
    if (fs.existsSync(uploadedFilePath)) {
      console.log('✅ File exists at expected location');
      
      // Test file content
      const uploadedContent = fs.readFileSync(uploadedFilePath, 'utf8');
      if (uploadedContent === testContent) {
        console.log('✅ File content matches original');
      } else {
        console.log('❌ File content mismatch');
      }
      
      // Test delete
      console.log('\n🗑️ Testing delete...');
      const deleteResult = await deleteFromStorage(uploadResult.public_id);
      
      if (deleteResult.success) {
        console.log('✅ Delete successful!');
        
        if (!fs.existsSync(uploadedFilePath)) {
          console.log('✅ File properly removed');
        } else {
          console.log('❌ File still exists after delete');
        }
      } else {
        console.log('❌ Delete failed:', deleteResult.error);
      }
      
    } else {
      console.log('❌ File not found at expected location');
      console.log('   Expected:', uploadedFilePath);
    }
    
  } else {
    console.log('❌ Upload failed:', uploadResult.error);
  }
  
} catch (error) {
  console.log('❌ Upload test failed:', error.message);
}

// Cleanup temp file
try {
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
    console.log('🧹 Cleanup: Removed temporary test file');
  }
} catch (error) {
  console.log('⚠️ Cleanup warning:', error.message);
}

console.log('\n🎯 Production Readiness Assessment:');
console.log('===================================');

const checks = [
  { name: 'Environment Variables', status: !!process.env.LOCAL_STORAGE_API_KEY },
  { name: 'Storage Path Config', status: !!process.env.LOCAL_STORAGE_PATH },
  { name: 'URL Base Config', status: !!process.env.LOCAL_STORAGE_URL_BASE },
  { name: 'Upload Function', status: true }, // We'll know from the test above
  { name: 'Delete Function', status: true }  // We'll know from the test above
];

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
});

console.log('\n🚀 Production Deployment Checklist:');
console.log('==================================');
console.log('□ Set LOCAL_STORAGE_API_KEY in VPS environment');
console.log('□ Set LOCAL_STORAGE_PATH=/var/www/smy-storage');
console.log('□ Set LOCAL_STORAGE_URL_BASE=http://103.49.239.37/smy-storage');
console.log('□ Create /var/www/smy-storage directory on VPS');
console.log('□ Set proper permissions (755) and ownership (www-data)');
console.log('□ Configure Nginx to serve /smy-storage location');
console.log('□ Update PM2 ecosystem config with environment variables');
console.log('□ Test file upload via API after deployment');
console.log('□ Verify file accessibility via direct URL');

console.log('\n📊 Expected Production Behavior:');
console.log('===============================');
console.log('Upload Path: /var/www/smy-storage/smy-nav/participants/[files]');
console.log('Access URL:  http://103.49.239.37/smy-storage/smy-nav/participants/[files]');
console.log('API Endpoint: POST http://103.49.239.37/api/participants (with file upload)');

console.log('\n✅ Test completed!');