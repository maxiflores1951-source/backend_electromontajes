const express = require('express');
const router = express.Router();
const preciosController = require('../controllers/preciosController');

router.post('/', preciosController.create);
router.get('/ultimo/:cod_articulo', preciosController.getUltimoPrecio);

module.exports = router;
