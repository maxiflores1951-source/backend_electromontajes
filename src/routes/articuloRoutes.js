const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', articuloController.getAll);
router.get('/proveedor/:codProveedor', articuloController.getByProveedor);
router.get('/:codArticulo', articuloController.getByCodigo);
router.post('/insert', authMiddleware, resolvePersonal, articuloController.create);
router.put('/:codArticulo', authMiddleware, resolvePersonal, articuloController.update);
router.put('/:codArticulo/stock', authMiddleware, resolvePersonal, articuloController.ajustarStock);

module.exports = router;
