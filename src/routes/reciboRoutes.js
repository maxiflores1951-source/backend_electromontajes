const express = require('express');
const router = express.Router();
const reciboController = require('../controllers/reciboController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, reciboController.create);
router.get('/', reciboController.getAll);
router.get('/impuestos-por-razon', reciboController.getImpuestosPorRazon);
router.get('/impuestos-por-fecha', reciboController.getImpuestosPorFecha);
router.get('/filtrar', reciboController.filtrar);

module.exports = router;
