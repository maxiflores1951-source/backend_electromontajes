const express = require('express');
const router = express.Router();
const registrovehicularController = require('../controllers/registrovehicularController');

router.post('/insertar-registro-vehicular', registrovehicularController.create);
router.get('/obtener-movimientos-vehiculos', registrovehicularController.getMovimientos);

module.exports = router;
