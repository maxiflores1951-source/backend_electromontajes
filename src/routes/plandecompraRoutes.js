const express = require('express');
const router = express.Router();
const plandecompraController = require('../controllers/plandecompraController');

router.get('/', plandecompraController.getAll);
router.post('/', plandecompraController.create);
router.put('/:id', plandecompraController.update);
router.delete('/:id', plandecompraController.remove);

module.exports = router;
