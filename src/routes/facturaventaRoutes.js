const express = require('express');
const router = express.Router();
const facturaventaController = require('../controllers/facturaventaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, facturaventaController.create);
router.get('/', facturaventaController.getAll);
router.get('/por-razonsocial/:id', facturaventaController.getByRazonSocial);
router.put('/:codigo', authMiddleware, resolvePersonal, facturaventaController.update);
router.get('/filtrar', facturaventaController.filtrar);
router.get('/por-cliente/:id', facturaventaController.getByCliente);
router.get('/por-cliente-razonsocial/:idCliente/:idRazonSocial', facturaventaController.getPorClienteRazonSocial);
router.get('/calendario', facturaventaController.getCalendario);
router.get('/saldos-cliente', facturaventaController.getSaldosPorCliente);

module.exports = router;
