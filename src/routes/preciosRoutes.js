const express = require('express');
const router = express.Router();
const preciosController = require('../controllers/preciosController');

router.post('/', preciosController.create);

module.exports = router;
