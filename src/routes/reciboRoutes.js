const express = require('express');
const router = express.Router();
const reciboController = require('../controllers/reciboController');

router.post('/', reciboController.create);
router.get('/', reciboController.getAll);
router.get('/impuestos-por-razon', reciboController.getImpuestosPorRazon);
router.get('/impuestos-por-fecha', reciboController.getImpuestosPorFecha);
router.get('/filtrar', reciboController.filtrar);

module.exports = router;
