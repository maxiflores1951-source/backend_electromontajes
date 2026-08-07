const express = require('express');
const router = express.Router();
const tipocomprobanteController = require('../controllers/tipocomprobanteController');

router.get('/', tipocomprobanteController.getAll);
router.get('/compra', tipocomprobanteController.getCompra);

module.exports = router;
