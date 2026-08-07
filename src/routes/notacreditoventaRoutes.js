const express = require('express');
const router = express.Router();
const notacreditoventaController = require('../controllers/notacreditoventaController');

router.post('/', notacreditoventaController.create);
router.get('/:codigo', notacreditoventaController.getByCodigo);
router.get('/', notacreditoventaController.getAll);

module.exports = router;
