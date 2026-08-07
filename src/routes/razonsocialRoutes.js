const express = require('express');
const router = express.Router();
const razonsocialController = require('../controllers/razonsocialController');

router.get('/', razonsocialController.getAll);

module.exports = router;
