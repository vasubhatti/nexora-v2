import { protect } from "./auth.js";

export const adminOnly = async (req,res,next) => {
    await protect(req,res,async ()=>{
        if(req.user.role != "admin"){
            return res.status(403).json({
                success: false,
                message: "Access denied. Admins only.",
            })
        }
        next();
    })
}