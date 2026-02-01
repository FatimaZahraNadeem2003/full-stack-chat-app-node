const express = require('express');
const { adminLogin, registerAdmin, getAllUsers, getAllChats, deleteUser, getAllMessages, getAdminGroups, getGroupsAdminIsIn, createAdminGroup, accessAdminChat } = require('../controllers/adminController');
const { protect, protectAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/login').post(adminLogin);
router.route('/register').post(registerAdmin);
router.route('/users').get(protectAdmin, getAllUsers);
router.route('/chats').get(protectAdmin, getAllChats);
router.route('/chat/:chatId/messages').get(protectAdmin, getAllMessages);
router.route('/user/:userId').delete(protectAdmin, deleteUser);
router.route('/groups/created').get(protectAdmin, getAdminGroups);
router.route('/groups/member').get(protectAdmin, getGroupsAdminIsIn);
router.route('/group').post(protectAdmin, createAdminGroup);
router.route('/chat').post(protectAdmin, accessAdminChat);

module.exports = router;