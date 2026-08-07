const express = require('express');
const router = express.Router();
const remitoventaController = require('../controllers/remitoventaController');

router.post('/insertar-remito-venta', remitoventaController.insertarRemitoVenta);
router.get('/remito/:codigo', remitoventaController.getRemitoByCodigo);
router.get('/obtener-remitos-venta', remitoventaController.getObtenerRemitosVenta);
router.get('/remitos-articulos-por-servicio/:idServicio', remitoventaController.getArticulosPorServicio);
router.get('/movimientos-articulos', remitoventaController.getMovimientosArticulos);
router.put('/remito/precios', remitoventaController.actualizarPrecios);
router.get('/costos-remitos/:idServicio', remitoventaController.getCostosRemitos);
router.put('/actualizar-remito-venta/:codigo', remitoventaController.actualizarRemitoVenta);

module.exports = router;
