const express = require('express');
const router = express.Router();
const otropagosController = require('../controllers/otropagosController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, otropagosController.create);
router.get('/', otropagosController.getAll);
router.get('/:codigo', otropagosController.getByCodigo);
router.put('/:codigo', authMiddleware, resolvePersonal, otropagosController.update);

module.exports = router;
