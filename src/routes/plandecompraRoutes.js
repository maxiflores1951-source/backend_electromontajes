const express = require('express');
const router = express.Router();
const plandecompraController = require('../controllers/plandecompraController');

router.get('/', plandecompraController.getAll);

module.exports = router;
