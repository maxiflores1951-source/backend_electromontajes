const express = require('express');
const router = express.Router();
const devolucionventaController = require('../controllers/devolucionventaController');

router.post('/insertar-devolucion-venta', devolucionventaController.insertarDevolucionVenta);
router.get('/remitos-articulos-por-servicio/:idServicio', devolucionventaController.getRemitosArticulosPorServicio);
router.get('/devoluciones-articulos-por-servicio/:idServicio', devolucionventaController.getDevolucionesArticulosPorServicio);
router.get('/obtener-devoluciones-venta', devolucionventaController.getObtenerDevolucionesVenta);
router.put('/actualizar-devolucion-venta/:codigo', devolucionventaController.actualizarDevolucionVenta);

module.exports = router;
