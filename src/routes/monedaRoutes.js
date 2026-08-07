const express = require('express');
const router = express.Router();
const monedaController = require('../controllers/monedaController');

router.get('/', monedaController.getAll);

module.exports = router;
