const express = require('express');
const router = express.Router();
const facturacompraController = require('../controllers/facturacompraController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, facturacompraController.create);
router.get('/', facturacompraController.getAll);
router.put('/anular/:codigo', facturacompraController.anular);
router.get('/filtrar', facturacompraController.filtrar);
router.get('/facturas-por-servicio/:idServicio', facturacompraController.getFacturasPorServicio);
router.get('/factura-pendientes', facturacompraController.getFacturasPendientes);
router.put('/:codigo', facturacompraController.update);
router.get('/facturas-sin-periodoiva', facturacompraController.getFacturasSinPeriodoIva);
router.get('/facturas/proveedor', facturacompraController.getFacturasPorProveedor);
router.get('/facturas-por-razonsocial/:id', facturacompraController.getFacturasPorRazonSocial);
router.get('/filtrarcostos', facturacompraController.filtrarCostos);
router.get('/filtrarcostostodos', facturacompraController.filtrarCostosTodos);
router.get('/relaciones/:factura', facturacompraController.getRelaciones);
router.post('/orden', facturacompraController.crearRelacionOrden);
router.post('/factura', facturacompraController.crearRelacionFactura);
router.get('/indicadores-forma-pago', facturacompraController.getIndicadoresFormaPago);
router.delete('/factura', facturacompraController.eliminarRelacionFactura);
router.get('/costos-servicio/:idServicio', facturacompraController.getCostosPorServicio);

module.exports = router;
