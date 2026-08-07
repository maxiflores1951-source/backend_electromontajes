const express = require('express');
const router = express.Router();
const motivosController = require('../controllers/motivosController');

router.get('/', motivosController.getAll);

module.exports = router;
