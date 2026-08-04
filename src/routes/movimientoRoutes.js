const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', movimientoController.getAll);
router.post('/insertar-movimiento', authMiddleware, resolvePersonal, movimientoController.create);

module.exports = router;
