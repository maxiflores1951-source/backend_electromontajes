const express = require('express');
const router = express.Router();
const conceptoController = require('../controllers/conceptoController');

router.get('/', conceptoController.getAll);
router.get('/nextCode/:familyCode', conceptoController.getNextCode);

module.exports = router;
