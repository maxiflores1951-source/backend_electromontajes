const express = require('express');
const router = express.Router();
const feriadosController = require('../controllers/feriadosController');

router.get('/', feriadosController.getAll);
router.post('/', feriadosController.create);
router.delete('/', feriadosController.remove);

module.exports = router;
