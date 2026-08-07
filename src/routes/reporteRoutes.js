const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/formas-pago', reporteController.getFormasPago);

module.exports = router;
