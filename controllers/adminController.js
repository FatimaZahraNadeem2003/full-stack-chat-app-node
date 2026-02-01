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

const getAdminGroups = asyncHandler(async (req, res) => {
    try {
        // Get groups where admin is the group admin
        const adminCreatedGroups = await Chat.find({
            isGroupChat: true,
            groupAdmin: req.admin._id
        })
        .populate('users', '-password')
        .populate('groupAdmin', '-password')
        .populate('latestMessage')
        .sort({ updatedAt: -1 });
        
        res.json(adminCreatedGroups);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const getGroupsAdminIsIn = asyncHandler(async (req, res) => {
    try {
        // Get groups where admin is a member (but not necessarily admin)
        const groupsAdminIsIn = await Chat.find({
            isGroupChat: true,
            users: { $elemMatch: { $eq: req.admin._id } }
        })
        .populate('users', '-password')
        .populate('groupAdmin', '-password')
        .populate('latestMessage')
        .sort({ updatedAt: -1 });
        
        res.json(groupsAdminIsIn);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const createAdminGroup = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.status(400)
            .send("More than 2 users are required to form a group chat");
    }

    users.push(req.admin._id);

    const groupExists = await Chat.findOne({
        chatName: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        isGroupChat: true
    });

    if (groupExists) {
        return res.status(400)
            .send("Group name already exists");
    }

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.admin._id
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("blockedBy");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const accessAdminChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.admin._id } } },
            { users: { $elemMatch: { $eq: userId } } }
        ]
    }).populate('users', '-password').populate('latestMessage').populate('blockedBy');

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: "name pic email"
    });

    if (isChat.length > 0) {
        res.send(isChat[0])
    } else {
        var chatData = {
            chatName: 'sender',
            isGroupChat: false,
            users: [req.admin._id, userId]
        };

        try {
            const createdChat = await Chat.create(chatData);

            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password "
            ).populate('blockedBy');

            res.status(200).send(FullChat)
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

module.exports = { adminLogin, registerAdmin, getAllUsers, getAllChats, deleteUser, getAllMessages, getAdminGroups, getGroupsAdminIsIn, createAdminGroup, accessAdminChat };