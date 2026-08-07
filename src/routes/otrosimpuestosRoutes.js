const express = require('express');
const router = express.Router();
const otrosimpuestosController = require('../controllers/otrosimpuestosController');

router.get('/', otrosimpuestosController.getAll);

module.exports = router;
