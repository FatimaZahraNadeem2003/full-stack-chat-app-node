const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../config/generateToken');

const registerUser = asyncHandler(async (req,res) =>{
   const {name, email, password, pic} = req.body;

   if(!name || !email || !password){
      res.status(400);
      throw new Error('Please enter all the fields');
   }

   const userExists = await User.findOne({email});

   if(userExists){
      res.status(400);
      throw new Error('User already exists');
   }

   const userNameExists = await User.findOne({name: { $regex: new RegExp(`^${name}$`, 'i') }});
   if(userNameExists){
      res.status(400);
      throw new Error('Username already exists');
   }

   const user = await User.create({
      name,
      email,
      password,
      pic
   });

   if(user){
      res.status(201).json({
         _id: user._id,
         name: user.name,
         email: user.email,
         pic:user.pic,
         token: generateToken(user._id)
      })

   }else{
      res.status(400);
      throw new Error('User not found');
   }
});

const authUser = asyncHandler(async (req, res) =>{
   const {email, password} = req.body;

   const user = await User.findOne({email});

   if(user && (await user.matchPassword(password))){
      res.json({
         _id: user._id,
         name: user.name,
         email: user.email,
         pic:user.pic,
         token: generateToken(user._id)
      })
   }else{
      res.status(400);
      throw new Error('Invalid email or password');
   }
})

const allUsers = asyncHandler(async (req,res)=>{
   const keyword = req.query.search ? {
      $or:[
        {name:{$regex: req.query.search, $options:"i"}},
        {email:{$regex: req.query.search, $options:"i"}}
      ]
   }:{
   
   }
   const users = await User.find(keyword).find({_id:{$ne:req.user._id}});
   res.send(users);
})

const updateUserProfile = asyncHandler(async (req, res) => {
   const { name, pic } = req.body;

   const user = await User.findById(req.user._id); 

   if(user) {
      user.name = name || user.name;
      user.pic = pic || user.pic;

      const updatedUser = await user.save();

      res.json({
         _id: updatedUser._id,
         name: updatedUser.name,
         email: updatedUser.email,
         pic: updatedUser.pic,
         token: generateToken(updatedUser._id)
      });
   } else {
      res.status(404);
      throw new Error('User not found');
   }
})

const createGuestUser = asyncHandler(async (req, res) => {
   const email = 'demo@example.com';
   const name = 'Demo User';
   const password = '123456';
   const pic = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';

   const existingUser = await User.findOne({email});
   
   if(existingUser) {
      res.json({
         _id: existingUser._id,
         name: existingUser.name,
         email: existingUser.email,
         pic: existingUser.pic,
         token: generateToken(existingUser._id)
      });
   } else {
      const user = await User.create({
         name,
         email,
         password,
         pic
      });

      if(user){
         res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
         });
      } else {
         res.status(400);
         throw new Error('Guest user not created');
      }
   }
});

const changePassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body;

   const user = await User.findById(req.user._id);

   if(user && (await user.matchPassword(oldPassword))) {
      user.password = newPassword;
      const updatedUser = await user.save();
      
      res.json({
         message: 'Password changed successfully'
      });
   } else {
      res.status(400);
      throw new Error('Invalid current password');
   }
});

const searchAdmin = asyncHandler(async (req, res) => {
   try {
      const Admin = require('../models/adminModel');
      const admin = await Admin.findOne({ name: { $regex: req.query.search, $options: "i" } });
      
      if (admin) {
         res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            pic: admin.pic || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
            isAdmin: false 
         });
      } else {
         res.status(404).json({ message: 'Admin not found' });
      }
   } catch (error) {
      res.status(400);
      throw new Error(error.message);
   }
});

module.exports = {registerUser, authUser, allUsers, createGuestUser, updateUserProfile, changePassword, searchAdmin};