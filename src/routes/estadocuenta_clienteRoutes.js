const express = require('express');
const router = express.Router();
const estadocuentaClienteController = require('../controllers/estadocuenta_clienteController');

router.get('/:id/presupuestos-completo', estadocuentaClienteController.getPresupuestosCompleto);
router.get('/:id/resumen-servicios', estadocuentaClienteController.getResumenServicios);

module.exports = router;
