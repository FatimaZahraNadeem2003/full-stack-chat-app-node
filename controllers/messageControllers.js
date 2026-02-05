const asyncHandler = require('express-async-handler')
const Message = require('../models/messageModel')
const User = require('../models/userModel')
const Chat = require('../models/chatModel')

const sendMessage = asyncHandler(async(req,res) => {
    const {content, chatId, fileUrl, fileName, fileType, replyTo} = req.body;

    if((!content && !fileUrl) || !chatId){
        console.log('Invalid data passed into request');
        return res.sendStatus(400);
        
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    if (chat.blockedBy && chat.blockedBy.length > 0) {
        if (chat.blockedBy.some(blockedUserId => blockedUserId.equals(req.user._id))) {
            res.status(403);
            throw new Error('Cannot send message: You have blocked this chat');
        }
        
        const otherUsers = chat.users.filter(user => !user.equals(req.user._id));
        for (const otherUser of otherUsers) {
            if (chat.blockedBy.some(blockedUserId => blockedUserId.equals(otherUser))) {
                res.status(403);
                throw new Error('Cannot send message: This chat has been blocked by another participant');
            }
        }
    }

    var newMessage = {
        sender: req.user._id,
        content: content || '',
        chat: chatId,
        isRead: false
    };
    
    if (fileUrl) {
        newMessage.fileUrl = fileUrl;
        newMessage.fileName = fileName;
        newMessage.fileType = fileType;
    }
    
    if (replyTo) {
        newMessage.replyTo = replyTo;
    }

    try {
        var message = await Message.create(newMessage);
        message = await message.populate('sender','name pic');
        message = await message.populate('chat');
        message = await User.populate(message,{
            path:'chat.users',
            select:'name pic email'
        });

        await Chat.findByIdAndUpdate(req.body.chatId,{
            latestMessage:message
        });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }

})

    
const allMessages = asyncHandler(async (req,res) =>{
    try {
        const isAdmin = req.user.isAdmin;
        
        if (isAdmin) {
            const messages = await Message.find({chat: req.params.chatId})
                .populate('sender','name pic email')
                .populate('chat')
                .populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'name pic'
                    }
                });
            res.json(messages);
        } else {
            const chat = await Chat.findById(req.params.chatId);
            if (!chat) {
                res.status(404);
                throw new Error('Chat not found');
            }
            
            if (!chat.users.some(user => user._id.toString() === req.user._id.toString())) {
                res.status(403);
                throw new Error('You are not authorized to access this chat');
            }
            
            const messages = await Message.find({chat: req.params.chatId})
                .populate('sender','name pic email')
                .populate('chat')
                .populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'name pic'
                    }
                });
            res.json(messages);
        }
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

const deleteMessage = asyncHandler(async (req, res) => {
    try {
        console.log('Delete request received:', req.params.messageId, req.body);
        const message = await Message.findById(req.params.messageId);
        
        if (!message) {
            res.status(404);
            throw new Error('Message not found');
        }
        
        // Check for deleteForEveryone in query params (converted to boolean)
        const deleteForEveryone = req.query.deleteForEveryone === 'true';
        console.log('deleteForEveryone value:', deleteForEveryone, 'raw query value:', req.query.deleteForEveryone);
        
        if (deleteForEveryone) {
            if (message.sender.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('You can only delete messages for everyone that you sent');
            }
            
            await Message.findByIdAndDelete(req.params.messageId);
            res.json({ message: 'Message deleted for everyone' });
        } else {
            await Message.findByIdAndDelete(req.params.messageId);
            res.json({ message: 'Message deleted for you' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(400);
        throw new Error(error.message);
    }
})

const clearNotifications = asyncHandler(async (req, res) => {
    try {
        const userChats = await Chat.find({ users: req.user._id }).select('_id');
        
        await Message.updateMany(
            { 
                chat: { $in: userChats },
                isRead: { $ne: true }
            },
            { $set: { isRead: true } }
        );
        
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

module.exports = {sendMessage, allMessages, deleteMessage, clearNotifications}