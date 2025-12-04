import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

config();

// ES module equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

// Configuration is driven by environment variables only
// Do NOT hardcode secrets or API keys in source code. Set these in your .env or deployment environment.
const LOCAL_STORAGE_API_KEY = process.env.LOCAL_STORAGE_API_KEY || null;
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
const LOCAL_STORAGE_URL_BASE = process.env.LOCAL_STORAGE_URL_BASE || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000/uploads');

if (!LOCAL_STORAGE_API_KEY) {
  console.warn('⚠️ LOCAL_STORAGE_API_KEY is not set. Local storage API protection is disabled. Set LOCAL_STORAGE_API_KEY in your environment to enable it.');
}

// Helper function to ensure directory exists
const ensureDir = async (dir) => {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

// Upload file to local storage. Caller must provide folder (e.g. 'smy-nav/participants/..')
export const uploadToStorage = async (file, folder = 'smy-nav/participants', options = {}) => {
  console.log(LOCAL_STORAGE_API_KEY, 'LOCAL_STORAGE_API_KEY');
  
  try {
    // If an API key is set in environment, require caller to provide same key via options.apiKey
    if (LOCAL_STORAGE_API_KEY) {
      const providedKey = options.apiKey || null;
      if (!providedKey || providedKey !== LOCAL_STORAGE_API_KEY) {
        throw new Error('Invalid or missing storage API key');
      }
    }

    const safeFolder = folder.replace(/(^\/+|\/+$)/g, '');
    const destDir = path.join(LOCAL_STORAGE_PATH, safeFolder);
    await ensureDir(destDir);

    const uniqueName = `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname || file.path)}`;
    const destPath = path.join(destDir, uniqueName);

    // Move temporary file to destination
    await rename(file.path, destPath);

    const urlPath = `${safeFolder}/${uniqueName}`.split(path.sep).join('/');
    const publicUrl = LOCAL_STORAGE_URL_BASE ? `${LOCAL_STORAGE_URL_BASE.replace(/\/+$/,'')}/${urlPath}` : `/${urlPath}`;

    return {
      success: true,
      url: publicUrl,
      public_id: urlPath,
      original_filename: file.originalname || path.basename(file.path),
      format: path.extname(uniqueName).replace('.', ''),
      bytes: fs.statSync(destPath).size
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFromStorage = async (public_id) => {
  try {
    const filePath = path.join(LOCAL_STORAGE_PATH, public_id);
    try {
      await unlink(filePath);
      return { success: true, result: 'deleted' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  } catch (error) {
    console.error('Storage delete error:', error);
    return { success: false, error: error.message };
  }
};

export default { uploadToStorage, deleteFromStorage };
