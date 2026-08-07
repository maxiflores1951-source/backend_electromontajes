const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.get('/', clientesController.getAll);
router.post('/agregar', clientesController.create);
router.get('/clientes/:id/ventas', clientesController.getVentas);
router.get('/clientes/:id', clientesController.getById);
router.get('/estados-obra', clientesController.getEstadosObra);

module.exports = router;
