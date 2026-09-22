const express = require('express');
const router = express.Router();
const propietariosController = require('../controllers/propietariosController');

router.get('/', propietariosController.getAll);
router.get('/:id', propietariosController.getById);
router.post('/', propietariosController.create);
router.put('/:id', propietariosController.update);
router.delete('/:id', propietariosController.remove);

module.exports = router;
