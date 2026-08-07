const express = require('express');
const router = express.Router();
const facturaventaController = require('../controllers/facturaventaController');

router.post('/', facturaventaController.create);
router.get('/', facturaventaController.getAll);
router.get('/por-razonsocial/:id', facturaventaController.getByRazonSocial);
router.put('/:codigo', facturaventaController.update);
router.get('/filtrar', facturaventaController.filtrar);
router.get('/por-cliente/:id', facturaventaController.getByCliente);
router.get('/por-cliente-razonsocial/:idCliente/:idRazonSocial', facturaventaController.getPorClienteRazonSocial);
router.get('/calendario', facturaventaController.getCalendario);

module.exports = router;
