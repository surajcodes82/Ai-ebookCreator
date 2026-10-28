const express = require('express');
const { outline, chapter } = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.post('/generate-outline', outline);
router.post('/generate-chapter', chapter);

module.exports = router;
