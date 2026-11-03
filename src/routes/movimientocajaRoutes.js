const express = require('express');
const router = express.Router();
const movimientocajaController = require('../controllers/movimientocajaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/caja', authMiddleware, resolvePersonal, movimientocajaController.create);
router.get('/obtener-movimientos-caja', movimientocajaController.getAll);
router.get('/caja-factura', movimientocajaController.getCajaFacturaRegistros);
router.post('/caja-factura', movimientocajaController.createCajaFactura);
router.get('/caja-factura/:codigoCaja', movimientocajaController.getCajaFacturaByCodigo);
router.delete('/caja-factura', movimientocajaController.deleteCajaFactura);
router.post('/rendir-caja', authMiddleware, resolvePersonal, movimientocajaController.rendirCaja);
router.put('/caja/:codigo', authMiddleware, resolvePersonal, movimientocajaController.updateCaja);

module.exports = router;
