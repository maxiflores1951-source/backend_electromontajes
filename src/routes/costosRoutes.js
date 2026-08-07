const express = require('express');
const router = express.Router();
const costosController = require('../controllers/costosController');

router.get('/', costosController.getAll);
router.post('/', costosController.create);
router.delete('/:codigo', costosController.remove);
router.put('/:codigo', costosController.update);

module.exports = router;
