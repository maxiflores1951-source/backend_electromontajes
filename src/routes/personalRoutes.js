const express = require('express');
const router = express.Router();
const personalController = require('../controllers/personalController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', personalController.getAll);
router.get('/:id', personalController.getById);
router.post('/', authMiddleware, resolvePersonal, personalController.insert);
router.put('/:id', authMiddleware, resolvePersonal, personalController.update);

module.exports = router;
