const express = require('express');
const router = express.Router();
const { registerBusiness } = require('../controllers/businessController');

// Jab bhi koi POST request aayegi '/' par, registerBusiness function chalega
router.post('/', registerBusiness);

module.exports = router;