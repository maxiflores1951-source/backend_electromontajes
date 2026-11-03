const express = require('express');
const router = express.Router();
const valoresController = require('../controllers/valoresController');

router.get('/', valoresController.getAll);
router.get('/excepto-codigo-1', valoresController.getExceptoCodigo1);
router.post('/agregar', valoresController.create);
router.put('/:id', valoresController.update);
router.delete('/:id', valoresController.remove);

module.exports = router;
