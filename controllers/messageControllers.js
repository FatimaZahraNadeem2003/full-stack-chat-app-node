const asyncHandler = require('express-async-handler')
const Message = require('../models/messageModel')
const User = require('../models/userModel')
const Chat = require('../models/chatModel')

const sendMessage = asyncHandler(async(req,res) => {
    const {content, chatId} = req.body;

    if(!content || !chatId){
        console.log('Invalid data passed into request');
        return res.sendStatus(400);
        
    }

    var newMessage = {
        sender: req.user._id,
        content:content,
        chat: chatId
    };

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
        const messages = await Message.find({chat: req.params.chatId}).populate('sender','name pic email').populate('chat');
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

const deleteMessage = asyncHandler(async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        
        if (!message) {
            res.status(404);
            throw new Error('Message not found');
        }
        
       if (message.sender.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('You can only delete your own messages');
        }
        
        await Message.findByIdAndDelete(req.params.messageId);
        
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

module.exports = {sendMessage, allMessages, deleteMessage}