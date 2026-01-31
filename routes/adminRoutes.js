const express = require('express');
const { adminLogin, registerAdmin, getAllUsers, getAllChats, deleteUser, getAllMessages } = require('../controllers/adminController');
const { protect, protectAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/login').post(adminLogin);
router.route('/register').post(registerAdmin);
router.route('/users').get(protect, getAllUsers);
router.route('/chats').get(protect, getAllChats);
router.route('/chat/:chatId/messages').get(protectAdmin, getAllMessages);
router.route('/user/:userId').delete(protect, deleteUser); 

module.exports = router;