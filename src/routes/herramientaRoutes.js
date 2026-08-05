const express = require('express');
const router = express.Router();
const herramientaController = require('../controllers/herramientaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', herramientaController.getAll);
router.get('/disponibles', herramientaController.getDisponibles);
router.get('/nextCode/:familyCode', herramientaController.getNextCode);
router.get('/responsable/:idResponsable', herramientaController.getByResponsable);
router.post('/', authMiddleware, resolvePersonal, herramientaController.create);
router.put('/:codigoHerramienta', authMiddleware, resolvePersonal, herramientaController.update);
router.put('/:codigoHerramienta/condicion', authMiddleware, resolvePersonal, herramientaController.updateCondicion);
router.put('/:codigoHerramienta/nombre', authMiddleware, resolvePersonal, herramientaController.update);

module.exports = router;
