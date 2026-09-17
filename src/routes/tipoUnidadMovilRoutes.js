const express = require('express');
const router = express.Router();
const tipoUnidadMovilController = require('../controllers/tipoUnidadMovilController');

router.get('/', tipoUnidadMovilController.getAll);
router.get('/:codigo', tipoUnidadMovilController.getByCodigo);
router.post('/agregar', tipoUnidadMovilController.create);
router.put('/:codigo', tipoUnidadMovilController.update);
router.delete('/:codigo', tipoUnidadMovilController.remove);

module.exports = router;
