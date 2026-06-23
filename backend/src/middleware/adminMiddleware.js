const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const adminMiddleware = async (req,res,next)=>{

    try{
       
        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not persent");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        // Bug #7 fix: check user existence FIRST, then check role from the
        // DB (not from the JWT, which may be stale). The old code checked
        // payload.role before checking if the user existed, and used the
        // JWT role instead of the DB role — allowing demoted admins to
        // retain access until token expiry.
        if(!result){
            throw new Error("User Doesn't Exist");
        }

        if(result.role !== 'admin')
            throw new Error("Invalid Token");

        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+err.message);
    }

}


module.exports = adminMiddleware;
