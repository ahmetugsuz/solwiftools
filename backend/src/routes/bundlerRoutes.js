// src/routes/bundlerRoutes.js
const express = require('express');
const { subscribeBundler } = require('../controllers/bundlerController');
const router = express.Router();

router.post('/subscribe', subscribeBundler);

module.exports = router;
