const express = require('express');
const router = express.Router();
const movimientocajaController = require('../controllers/movimientocajaController');

router.post('/caja', movimientocajaController.create);
router.get('/obtener-movimientos-caja', movimientocajaController.getAll);
router.get('/caja-factura', movimientocajaController.getCajaFacturaRegistros);
router.post('/caja-factura', movimientocajaController.createCajaFactura);
router.get('/caja-factura/:codigoCaja', movimientocajaController.getCajaFacturaByCodigo);
router.delete('/caja-factura', movimientocajaController.deleteCajaFactura);
router.post('/rendir-caja', movimientocajaController.rendirCaja);
router.put('/caja/:codigo', movimientocajaController.updateCaja);

module.exports = router;
