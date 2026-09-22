const express = require('express');
const router = express.Router();
const medidasBateriasController = require('../controllers/medidasBateriasController');

router.get('/', medidasBateriasController.getAll);
router.get('/:id', medidasBateriasController.getById);
router.post('/', medidasBateriasController.create);
router.put('/:id', medidasBateriasController.update);
router.delete('/:id', medidasBateriasController.remove);

module.exports = router;
