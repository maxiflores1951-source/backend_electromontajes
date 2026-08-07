const express = require('express');
const router = express.Router();
const presupuestoController = require('../controllers/presupuestoController');

router.post('/', presupuestoController.create);
router.get('/', presupuestoController.getAll);
router.get('/facturar', presupuestoController.getFacturar);
router.get('/presupuestos-activos', presupuestoController.getActivos);
router.get('/con-facturas', presupuestoController.getConFacturas);

module.exports = router;
