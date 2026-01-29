const express = require('express');
const { registerUser, authUser, allUsers, createGuestUser, updateUserProfile } = require('../controllers/userControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router()

router.route('/').post(registerUser).get(protect,allUsers)
router.post('/login', authUser)
router.post('/guest', createGuestUser)
router.post('/update', protect, updateUserProfile)

module.exports = router;