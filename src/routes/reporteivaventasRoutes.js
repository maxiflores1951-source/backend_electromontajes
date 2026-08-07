const express = require('express');
const router = express.Router();
const reporteivaventasController = require('../controllers/reporteivaventasController');

router.post('/reporteiva_ventas', reporteivaventasController.create);
router.get('/reporteiva_ventas', reporteivaventasController.getAll);

module.exports = router;
