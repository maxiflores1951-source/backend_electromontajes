const express = require('express');
const router = express.Router();
const valoresController = require('../controllers/valoresController');

router.get('/', valoresController.getAll);
router.get('/excepto-codigo-1', valoresController.getExceptoCodigo1);

module.exports = router;
