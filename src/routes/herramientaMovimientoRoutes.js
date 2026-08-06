const express = require('express');
const router = express.Router();
const herramientaMovimientoController = require('../controllers/herramientaMovimientoController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', herramientaMovimientoController.getAll);
router.post('/', authMiddleware, resolvePersonal, herramientaMovimientoController.create);
router.put('/:movimientoId', authMiddleware, resolvePersonal, herramientaMovimientoController.update);

module.exports = router;