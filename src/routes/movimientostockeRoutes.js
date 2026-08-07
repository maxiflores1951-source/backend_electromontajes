const express = require('express');
const router = express.Router();
const movimientostockeController = require('../controllers/movimientostockeController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/insertar-movimiento', authMiddleware, resolvePersonal, movimientostockeController.create);
router.get('/obtener-movimientos', movimientostockeController.getAll);

module.exports = router;
