const express = require('express');
const router = express.Router();
const herramientaMovimientoController = require('../controllers/herramientaMovimientoController');

router.get('/', herramientaMovimientoController.getAll);
router.post('/', herramientaMovimientoController.create);

module.exports = router;