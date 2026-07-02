const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const fs = require('fs');
const path = require('path');

let cloudinary = null;
try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
} catch (err) {
    console.warn('⚠️ Cloudinary package not installed. Running in local fallback mode.');
}

router.post('/api/upload', auth, async (req, res) => {
    try {
        const { image } = req.body; // base64 string: "data:image/jpeg;base64,..."
        if (!image) {
            return res.status(400).json({ success: false, message: 'No image data provided' });
        }

        // If Cloudinary is configured
        if (cloudinary) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'sport_academy',
                });
                return res.status(200).json({
                    success: true,
                    url: uploadResponse.secure_url,
                    public_id: uploadResponse.public_id
                });
            } catch (clErr) {
                console.error('Cloudinary upload error:', clErr);
                // Fall back to local saving
            }
        }

        // Fallback: Save base64 image locally under e:\Mern\Projects\sport acedamy\sport acedamy\Backend\uploads
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Parse base64
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            // If not a valid data URL, just return what was sent or placeholder
            return res.status(200).json({
                success: true,
                url: image
            });
        }

        const ext = matches[1].split('/')[1] || 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, buffer);

        // Return local relative URL
        const localUrl = `http://localhost:4005/uploads/${filename}`;
        res.status(200).json({
            success: true,
            url: localUrl
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Image upload failed',
            error: error.message
        });
    }
});

module.exports = router;
