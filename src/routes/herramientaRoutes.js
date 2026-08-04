const express = require('express');
const router = express.Router();
const herramientaController = require('../controllers/herramientaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', herramientaController.getAll);
router.get('/disponibles', herramientaController.getDisponibles);
router.get('/nextCode/:familyCode', herramientaController.getNextCode);
router.get('/responsable/:idResponsable', herramientaController.getByResponsable);
router.post('/', authMiddleware, herramientaController.create);
router.put('/:codigoHerramienta/condicion', authMiddleware, herramientaController.updateCondicion);
router.put('/:codigoHerramienta/nombre', authMiddleware, herramientaController.updateNombreCondicion);

module.exports = router;
