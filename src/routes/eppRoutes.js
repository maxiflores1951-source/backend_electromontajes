const express = require('express');
const router = express.Router();
const eppController = require('../controllers/eppController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', eppController.getAll);
router.get('/variantes', eppController.getVariantes);
router.post('/', authMiddleware, resolvePersonal, eppController.create);
router.put('/:codEpp/cantidad', eppController.updateCantidad);
router.put('/factura/:codEpp/cantidad', eppController.updateCantidadFactura);

module.exports = router;
