const express = require('express');
const router = express.Router();
const billetesController = require('../controllers/billetesController');

router.get('/', billetesController.getAll);

module.exports = router;
