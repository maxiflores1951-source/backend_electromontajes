const express = require('express');
const router = express.Router();
const montomovilesController = require('../controllers/montomovilesController');

router.get('/', montomovilesController.getMonto);

module.exports = router;
