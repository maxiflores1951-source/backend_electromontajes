const express = require('express');
const router = express.Router();
const ordencompraController = require('../controllers/ordencompraController');

router.post('/', ordencompraController.create);
router.get('/obtener-ordenes-compra', ordencompraController.getAll);
router.get('/obtener-ordenes-compra-no-afectadas', ordencompraController.getNoAfectadas);
router.put('/:codigo', ordencompraController.update);
router.get('/orden/:codigo', ordencompraController.getOrdenRelaciones);
router.get('/resumen-ordenes-compra', ordencompraController.getResumen);
router.delete('/orden/:tipo/:codigo', ordencompraController.eliminarRelacion);
router.post('/orden', ordencompraController.crearRelacion);

module.exports = router;
