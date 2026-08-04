const express = require('express');
const router = express.Router();
const familiaUnidadController = require('../controllers/familiaUnidadController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', familiaUnidadController.getAll);
router.get('/:codigo', familiaUnidadController.getByCodigo);
router.post('/', authMiddleware, resolvePersonal, familiaUnidadController.create);
router.put('/:codigo', authMiddleware, resolvePersonal, familiaUnidadController.update);
router.delete('/:codigo', authMiddleware, resolvePersonal, familiaUnidadController.remove);

module.exports = router;
