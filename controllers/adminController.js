const asyncHandler = require('express-async-handler');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const generateToken = require('../config/generateToken');

const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            isAdmin: admin.isAdmin,
            token: generateToken(admin._id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid Email or Password');
    }
});

const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all fields');
    }

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
        res.status(400);
        throw new Error('Admin already exists');
    }

    const admin = await Admin.create({
        name,
        email,
        password
    });

    if (admin) {
        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            isAdmin: admin.isAdmin,
            token: generateToken(admin._id)
        });
    } else {
        res.status(400);
        throw new Error('Failed to create admin');
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const getAllChats = asyncHandler(async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('users', '-password')
            .populate('groupAdmin', '-password')
            .populate('latestMessage')
            .populate('blockedBy')
            .sort({ updatedAt: -1 });
        
        res.json(chats);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        
        await Chat.updateMany(
            { users: userId },
            { $pull: { users: userId } }
        );
        
        await Message.deleteMany({ sender: userId });
        
        res.json({ message: 'User terminated successfully' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const getAllMessages = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name pic email')
            .populate('chat')
            .sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { adminLogin, registerAdmin, getAllUsers, getAllChats, deleteUser, getAllMessages };