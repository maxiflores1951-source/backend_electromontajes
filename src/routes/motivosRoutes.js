const express = require('express');
const router = express.Router();
const motivosController = require('../controllers/motivosController');

router.get('/', motivosController.getAll);
router.post('/', motivosController.create);
router.put('/:id', motivosController.update);
router.delete('/:id', motivosController.remove);

module.exports = router;
