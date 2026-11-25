const express = require('express');
const router = express.Router();
const notacreditoventaController = require('../controllers/notacreditoventaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, notacreditoventaController.create);
router.get('/:codigo', notacreditoventaController.getByCodigo);
router.get('/', notacreditoventaController.getAll);
router.put('/:codigo', authMiddleware, resolvePersonal, notacreditoventaController.update);
router.put('/:codigo/imputar', authMiddleware, resolvePersonal, notacreditoventaController.imputar);
router.get('/imputaciones', notacreditoventaController.getImputaciones);

module.exports = router;
