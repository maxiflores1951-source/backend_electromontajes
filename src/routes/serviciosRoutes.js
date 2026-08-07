const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');

router.get('/', serviciosController.getAll);
router.post('/insertar', serviciosController.create);
router.get('/por-cliente', serviciosController.getByCliente);
router.get('/estados-obra', serviciosController.getEstadosObra);
router.put('/actualizar/:IDOBRA', serviciosController.update);

module.exports = router;
