const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { ApiResponse, ApiError } = require('../utils/apiResponse');
const { hashPassword, compareHash } = require('../utils/encryption');
const { uploadOnCloudinary } = require('../utils/cloudinaryHelper');
const sendEmail = require('../services/emailServices');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Register a user (Step 1: Create Account & Send OTP)
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, skills } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            if (!userExists.isVerified) {
                await User.deleteOne({ email });
            } else {
                return next(new ApiError('User already exists with this email', 400));
            }
        }

        const hashedPassword = await hashPassword(password);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            skills: skills || [],
            otp,
            otpExpires,
            isVerified: "false"
        });

        // Send OTP via Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Synchro-AI: Verify your account',
                message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #4F46E5;">Verify your Synchro-AI Account</h2>
                        <p>Hi ${user.name},</p>
                        <p>Thank you for registering. Please use the code below to verify your email address:</p>
                        <h1 style="background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px; letter-spacing: 5px;">${otp}</h1>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            });

            res.status(200).json(new ApiResponse(
                { email: user.email },
                'Registration successful. OTP sent to your email.'
            ));
        } catch (error) {
            // If email fails, delete user so they can try again
            await User.findByIdAndDelete(user._id);
            return next(new ApiError('Email could not be sent. Please try again.', 500));
        }

    } catch (error) {
        next(error);
    }
};

// Verify OTP (Step 2: Verify & Login)
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Find user and explicitly select OTP fields
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return next(new ApiError('Invalid email or user not found', 400));
        }

        if (user.isVerified) {
            return next(new ApiError('User is already verified. Please login.', 400));
        }

        if (user.otp !== otp) {
            return next(new ApiError('Invalid OTP', 400));
        }

        if (user.otpExpires < Date.now()) {
            return next(new ApiError('OTP has expired', 400));
        }

        // OTP is valid
        user.isVerified = "true";
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate Token and Login
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json(new ApiResponse(
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                token,
                refreshToken
            },
            'Account verified and logged in successfully'
        ));

    } catch (error) {
        next(error);
    }
};

// Login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new ApiError('Invalid email or password', 401));
        }

        // Check if verified
        if (!user.isVerified) {
            return next(new ApiError('Account not verified. Please check your email for OTP.', 403));
        }

        if (await compareHash(password, user.password)) {
            const token = generateToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            res.status(200).json(new ApiResponse(
                {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    token,
                    refreshToken
                },
                'Login successful'
            ));
        } else {
            return next(new ApiError('Invalid email or password', 401));
        }
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        res.status(200).json(new ApiResponse(
            req.user,
            'User profile retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return next(new ApiError('There is no user with that email', 404));
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        // NOTE: This points to your FRONTEND URL
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `
            You are receiving this email because you (or someone else) has requested the reset of a password.
            Please click on the link below to reset your password:
            \n\n ${resetUrl} \n\n
            This link will expire in 10 minutes.
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message
            });

            res.status(200).json(new ApiResponse(null, 'Email sent'));
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new ApiError('Email could not be sent', 500));
        }
    } catch (error) {
        next(error);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return next(new ApiError('Invalid token', 400));
        }

        // Set new password
        user.password = await hashPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json(new ApiResponse(null, 'Password updated success'));
    } catch (error) {
        next(error);
    }
};

exports.updateDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
        };

        // When using FormData, arrays are sent as comma-separated strings. We must parse it.
        if (req.body.skills) {
            fieldsToUpdate.skills = req.body.skills.split(',').map(s => s.trim()).filter(s => s);
        }

        // --- NEW: CLOUDINARY AVATAR UPLOAD LOGIC ---
        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'avatars');
            if (cloudinaryResponse) {
                fieldsToUpdate.avatar = cloudinaryResponse.secure_url;
            } else {
                return next(new ApiError('Failed to upload avatar to image server', 500));
            }
        }

        // Note: Using req.user._id instead of req.user.id for consistency
        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json(new ApiResponse(user, 'Profile updated successfully'));
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { token: incomingRefreshToken } = req.body;

        if (!incomingRefreshToken) {
            return next(new ApiError('Refresh token is required', 400));
        }

        // Verify the refresh token
        // Make sure you have JWT_REFRESH_SECRET defined in your .env file
        const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

        // Ensure the user still exists in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError('User associated with this token no longer exists', 404));
        }

        // Generate a fresh access token
        const newToken = generateToken(user._id);

        res.status(200).json(new ApiResponse({ token: newToken }, 'Token refreshed successfully'));
    } catch (error) {
        return next(new ApiError('Invalid or expired refresh token. Please log in again.', 401));
    }
};