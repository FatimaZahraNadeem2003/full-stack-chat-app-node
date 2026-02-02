const express = require('express')
const { protectAdmin } = require('../middleware/authMiddleware');
const { sendMessage, allMessages, deleteMessage, clearNotifications } = require('../controllers/messageControllers');

const router = express.Router()

router.route('/').post(protectAdmin, sendMessage)
router.route('/:chatId').get(protectAdmin, allMessages)
router.route('/:messageId').delete(protectAdmin, deleteMessage)
router.route('/clear-notifications').put(protectAdmin, clearNotifications)

module.exports = router;