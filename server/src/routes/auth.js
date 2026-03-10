const express = require('express');
const {
    register,
    login,
    verifyOtp,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    refreshToken,
    googleAuth,
    setAccountPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/me', protect, getMe);

router.post('/google', googleAuth);
router.post('/set-password', protect, setAccountPassword);

// UPDATED: Added upload.single('avatar') to process the file upload
router.put('/updatedetails', protect, upload.single('avatar'), updateDetails);

module.exports = router;