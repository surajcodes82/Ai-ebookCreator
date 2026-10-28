const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadCover } = require('../middleware/upload');
const { uploadCover: uploadCoverHandler } = require('../controllers/uploadController');

const router = express.Router();

router.post('/cover', requireAuth, uploadCover.single('cover'), uploadCoverHandler);

module.exports = router;
