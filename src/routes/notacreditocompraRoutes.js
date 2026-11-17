const express = require('express');
const router = express.Router();
const notacreditocompraController = require('../controllers/notacreditocompraController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, notacreditocompraController.create);
router.put('/:codigo', authMiddleware, resolvePersonal, notacreditocompraController.update);
router.put('/:codigo/imputar', authMiddleware, resolvePersonal, notacreditocompraController.imputar);
router.get('/imputaciones', notacreditocompraController.getImputaciones);
router.get('/', notacreditocompraController.getAll);

module.exports = router;
