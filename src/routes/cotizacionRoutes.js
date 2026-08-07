const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');

router.get('/', cotizacionController.getAll);
router.post('/', cotizacionController.create);
router.delete('/:id', cotizacionController.deleteById);
router.get('/:codigo_cotizacion/detalles/:codigo_detalle/articulos', cotizacionController.getArticulos);
router.get('/materiales', cotizacionController.getMateriales);

module.exports = router;
