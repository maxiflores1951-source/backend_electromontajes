const express = require('express');
const router = express.Router();
const viaticosController = require('../controllers/viaticosController');

router.get('/', viaticosController.getAll);

module.exports = router;
