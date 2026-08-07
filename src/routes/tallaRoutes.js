const express = require('express');
const router = express.Router();
const tallaController = require('../controllers/tallaController');

router.get('/', tallaController.getAll);
router.post('/agregar', tallaController.create);
router.put('/actualizar/:id', tallaController.update);
router.delete('/eliminar/:id', tallaController.remove);
router.get('/:id', tallaController.getById);

module.exports = router;
