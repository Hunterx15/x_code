const express = require('express');

const authRouter =  express.Router();
const {register, login,logout, adminRegister,deleteProfile} = require('../controllers/userAuthent')
const { getProfile, getSubmissionHistory, getDashboard } = require('../controllers/userProfile')
const { getAchievements, getLeaderboard } = require('../controllers/achievements')
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');

// Register
authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);

// Profile + Dashboard (Batch F + G) — all behind userMiddleware, no new
// rate limiting (GET endpoints, low abuse risk, follow existing pattern).
authRouter.get('/profile', userMiddleware, getProfile);
authRouter.get('/submissions', userMiddleware, getSubmissionHistory);
authRouter.get('/dashboard', userMiddleware, getDashboard);

// Achievements + Leaderboard (Batch I)
authRouter.get('/achievements', userMiddleware, getAchievements);
authRouter.get('/leaderboard', userMiddleware, getLeaderboard);
authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
        avatarUrl: req.result.avatarUrl || null,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile

