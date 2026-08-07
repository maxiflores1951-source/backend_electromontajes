const express = require('express');
const router = express.Router();
const familiaeppController = require('../controllers/familiaeppController');

router.get('/', familiaeppController.getAll);

module.exports = router;
