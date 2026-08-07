const express = require('express');
const router = express.Router();
const coloresController = require('../controllers/coloresController');

router.get('/', coloresController.getAll);
router.get('/:id', coloresController.getById);
router.post('/agregar', coloresController.create);

module.exports = router;
