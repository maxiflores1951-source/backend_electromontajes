const express = require('express');
const router = express.Router();
const sitfiscalController = require('../controllers/sitfiscalController');

router.get('/', sitfiscalController.getAll);

module.exports = router;
