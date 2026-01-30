const express = require('express');
const { adminLogin, registerAdmin, getAllUsers, getAllChats, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/login').post(adminLogin);
router.route('/register').post(registerAdmin);
router.route('/users').get(protect, getAllUsers);
router.route('/chats').get(protect, getAllChats);
router.route('/user/:userId').delete(protect, deleteUser); 

module.exports = router;