const sendEmail = require('../services/emailServices');

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // 1. Validate the request
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message.'
            });
        }

        // 2. Send email TO your support team
        // Using the SMTP_USER as the receiving address for support emails
        const supportEmail = process.env.SMTP_USER;
        await sendEmail({
            email: supportEmail,
            subject: `New Contact Form Submission from ${name}`,
            message: `You have received a new message from the Synchro-AI contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        });

        // 3. Send auto-reply confirmation TO the user
        await sendEmail({
            email: email,
            subject: 'We received your message - Synchro-AI Support',
            message: `Hi ${name},\n\nThank you for reaching out to us. We have received your message and our support team will get back to you shortly.\n\nYour original message:\n"${message}"\n\nBest regards,\nThe Synchro-AI Team`
        });

        // 4. Send success response to frontend
        res.status(200).json({
            success: true,
            message: 'Message sent successfully.'
        });

    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending your message. Please try again later.'
        });
    }
};