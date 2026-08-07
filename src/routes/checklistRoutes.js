const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/items-con-secciones', checklistController.getItemsConSecciones);
router.post('/', authMiddleware, resolvePersonal, checklistController.create);
router.get('/', checklistController.getAll);

module.exports = router;
