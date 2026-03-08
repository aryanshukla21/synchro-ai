const cloudinary = require('cloudinary').v2;
const fs = require('fs/promises'); // Use promises to prevent blocking the Node.js event loop

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file from the local 'uploads' folder to Cloudinary
 * @param {string} localFilePath - Path to the file stored temporarily on the server
 * @param {string} folder - The Cloudinary folder name (e.g., 'submissions', 'avatars')
 * @returns {object|null} - The Cloudinary response object or null if failed
 */
const uploadOnCloudinary = async (localFilePath, folder = 'synchro-ai') => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detects image, pdf, video, etc.
            folder: folder
        });

        // File has been uploaded successfully, remove the locally saved temporary file asynchronously
        try {
            await fs.unlink(localFilePath);
        } catch (unlinkError) {
            console.error("Failed to delete temporary local file after upload:", unlinkError);
        }

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Remove the locally saved temporary file as the upload operation failed
        try {
            if (localFilePath) {
                await fs.unlink(localFilePath);
            }
        } catch (unlinkError) {
            console.error("Failed to delete temporary local file after error:", unlinkError);
        }

        return null;
    }
};

/**
 * Deletes a file from Cloudinary using its public ID
 * @param {string} publicId - The public ID of the file on Cloudinary
 * @returns {object|null} - The result of the deletion or null if failed
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
    }
};

module.exports = { uploadOnCloudinary, deleteFromCloudinary };