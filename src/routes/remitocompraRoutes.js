const express = require('express');
const router = express.Router();
const remitocompraController = require('../controllers/remitocompraController');

router.post('/', remitocompraController.create);
router.get('/obtener-remitos-compra', remitocompraController.getAll);
router.get('/remitos-por-servicio/:idServicio', remitocompraController.getPorServicio);
router.get('/obtener-remitos-sin-orden', remitocompraController.getSinOrden);
router.get('/resumen-remitos-compra', remitocompraController.getResumen);
router.put('/:codigo', remitocompraController.update);
router.get('/obtener-remitos-sin-factura', remitocompraController.getSinFactura);

module.exports = router;
