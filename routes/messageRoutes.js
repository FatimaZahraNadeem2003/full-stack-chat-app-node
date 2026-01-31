const express = require('express')
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, allMessages, deleteMessage, clearNotifications } = require('../controllers/messageControllers');

const router = express.Router()

router.route('/').post(protect, sendMessage)
router.route('/:chatId').get(protect, allMessages)
router.route('/:messageId').delete(protect, deleteMessage)
router.route('/clear-notifications').put(protect, clearNotifications)

module.exports = router;