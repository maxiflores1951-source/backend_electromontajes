const express = require('express');
const router = express.Router();
const vehiculosController = require('../controllers/vehiculosController');

router.get('/exclude', vehiculosController.getExclude);

module.exports = router;
