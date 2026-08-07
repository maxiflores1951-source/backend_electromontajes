const express = require('express');
const router = express.Router();
const devolucioncompraController = require('../controllers/devolucioncompraController');

router.post('/insertar-devolucion-compra', devolucioncompraController.create);
router.get('/obtener-devoluciones-compra', devolucioncompraController.getAll);

module.exports = router;
