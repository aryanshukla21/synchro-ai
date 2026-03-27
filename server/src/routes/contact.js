const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contact.controller');

// POST /api/contact
router.post('/', submitContactForm);

module.exports = router;