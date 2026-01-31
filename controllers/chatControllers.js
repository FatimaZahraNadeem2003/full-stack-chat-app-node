const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');

const accessChat = asyncHandler(async (req,res) =>{
    const {userId} = req.body;

    if(!userId){
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat:false,
        $and:[
            {users:{$elemMatch:{$eq:req.user._id}}},
            {users:{$elemMatch:{$eq: userId}}}
        ]
    }).populate('users','-password').populate('latestMessage').populate('blockedBy');

    isChat = await User.populate(isChat,{
        path:'latestMessage.sender',
        select:"name pic email"
    });

    if(isChat.length > 0){
        res.send(isChat[0])
    }else{
        var chatData = {
            chatName:'sender',
            isGroupChat:false,
            users:[req.user._id, userId]
        };

        try {
            const createdChat = await Chat.create(chatData);

            const FullChat = await Chat.findOne({_id: createdChat._id}).populate(
                "users",
                "-password "
            ).populate('blockedBy');

            res.status(200).send(FullChat)
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
})

const fetchChat = asyncHandler(async (req,res)=>{
    try {
        Chat.find({users:{$elemMatch:{$eq: req.user._id}}})
        .populate("users","-password")
        .populate("groupAdmin","-password")
        .populate("latestMessage")
        .populate("blockedBy")
        .sort({updatedAt:-1})
        .then(async (results)=>{
            results = await User.populate(results,{
                path:'latestMessage.sender',
                select:"name pic email"
            });

        res.status(200).send(results);
        })
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

const createGroup = asyncHandler(async (req, res)=>{
    if(!req.body.users || !req.body.name){
        return res.status(400).send({message:"Please fill all the fields"});
    }

    var users = JSON.parse(req.body.users);

    if(users.length <2){
        return res.status(400)
        .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users:users,
            isGroupChat:true,
            groupAdmin:req.user
        });

        const fullGroupChat = await Chat.findOne({_id:groupChat._id})
        .populate("users","-password")
        .populate("groupAdmin","-password")
        .populate("blockedBy");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

const renameGroup = asyncHandler(async (req,res)=>{
    const {chatId, chatName} = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }
    
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only group admin can rename the group");
    }

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName
        },{
            new:true
        }
    )
    .populate("users","-password")
    .populate("groupAdmin","-password");

    if(!updatedChat){
        res.status(404);
        throw new Error("Chat Not Found");
    }else{
        res.json(updatedChat);
    }
})

const addToGroup = asyncHandler(async(req,res)=>{
    const {chatId, userId} = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }
    
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only group admin can add users");
    }

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push:{users:userId},
        },
        {new:true}
    )
    .populate("users","-password")
    .populate("groupAdmin","-password");

    if(!added){
        res.status(404);
        throw new Error("Chat Not Found")
    }else{
        res.json(added)
    }
})

const removeFromGroup = asyncHandler(async (req,res)=>{
    const {chatId, userId} = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }
    
    if (userId !== req.user._id.toString() && chat.groupAdmin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only group admin can remove other users");
    }

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull:{users:userId},
        },
        {new:true}
    )
    .populate("users","-password")
    .populate("groupAdmin","-password");

    if(!removed){
        res.status(404);
        throw new Error("Chat Not Found")
    }else{
        res.json(removed)
    }
})

const deleteGroup = asyncHandler(async (req, res) => {
    const { chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }
    
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only group admin can delete the group");
    }

    await Chat.findByIdAndDelete(chatId);
    
    res.json({ message: 'Group deleted successfully' });
});

const markChatAsRead = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        
        await Message.updateMany(
            { 
                chat: chatId, 
                sender: { $ne: req.user._id },
                isRead: { $ne: true }
            },
            { $set: { isRead: true } }
        );
        
        res.json({ message: 'Chat marked as read' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const deleteChat = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error('Chat not found');
        }
        
        if (!chat.users.some(user => user._id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('You are not authorized to delete this chat');
        }
        
        await Message.deleteMany({ chat: chatId });
        
        await Chat.findByIdAndDelete(chatId);
        
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const blockChat = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error('Chat not found');
        }
        
        if (!chat.users.some(user => user._id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('You are not authorized to block this chat');
        }
        
        if (!chat.blockedBy.includes(req.user._id)) {
            chat.blockedBy.push(req.user._id);
            await chat.save();
        }
        
        res.json({ message: 'Chat blocked successfully' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const unblockChat = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error('Chat not found');
        }
        
        if (!chat.users.some(user => user._id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('You are not authorized to unblock this chat');
        }
        
        chat.blockedBy = chat.blockedBy.filter(id => id.toString() !== req.user._id.toString());
        await chat.save();
        
        res.json({ message: 'Chat unblocked successfully' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = {accessChat, fetchChat, createGroup, renameGroup, addToGroup, removeFromGroup, markChatAsRead, deleteGroup, deleteChat, blockChat, unblockChat}