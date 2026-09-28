import {verifyAccessToken} from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js"

export const protect = async (req,res,next)=> {
    try {
        let token;

        if(
            req.headers.authorization && 
            req.headers.authorization.startsWith("Bearer")
        ){
            token = req.headers.authorization.split(" ")[1];
        }

        if(!token){
            return next(new AppError("Not authenticated. Please log in.",401));
        }

        const decode = verifyAccessToken(token);
        const user = await User.findById(decode.id).select("-password");

        if(!user){
            return next(new AppError("User no longer exist.",401));
        }

        if(user.isBanned){
            return next(new AppError("Your account has been suspended.",403));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new AppError("Invalid token. Please log in again.",401));
    }
}

export const restrictTo = (...roles) => (req,res,next)=>{
    if(!roles.includes(req.user.role)){
        return next(new AppError("You do not have permission.",403));
    }
    next();
}