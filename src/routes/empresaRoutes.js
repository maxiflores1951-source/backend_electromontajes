const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

router.get('/', empresaController.getAll);
router.get('/:id', empresaController.getById);

module.exports = router;
