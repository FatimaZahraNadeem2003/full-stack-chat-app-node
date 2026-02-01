const express = require('express');
const { registerUser, authUser, allUsers, createGuestUser, updateUserProfile, changePassword, searchAdmin } = require('../controllers/userControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router()

router.route('/').post(registerUser).get(protect,allUsers)
router.post('/login', authUser)
router.post('/guest', createGuestUser)
router.post('/update', protect, updateUserProfile)
router.post('/change-password', protect, changePassword)
router.get('/search-admin', protect, searchAdmin)

module.exports = router;