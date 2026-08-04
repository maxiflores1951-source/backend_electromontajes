const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin } = require('../middlewares/validationMiddleware');

router.post('/login', validateLogin, authController.login);

module.exports = router;