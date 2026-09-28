import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required: [true,"Name is Required."],
        trim: true,
        maxlength: [50,"Name cannot exceed 50 characters."]
    },
    email:{
        type: String,
        required:[true,"Email is Required."],
        unique: true,
        lowercase: true,
        trim:true,
    },
    password: {
        type:String,
        minlength: [6,"Password must be at least 6 characters long."],
        select: false,
    },
    googleId:{
        type: String,
        default: null,
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user",
    },
    isVerified:{
        type:Boolean,
        default: false,
    },
    isBanned: {
        type:Boolean,
        default: false,
    },
    avatar: {
        type:String,
        default: null,
    },
    
    // Credits
    creditBalance:{
        type:Number,
        default:100,
    },
    creditUsed:{
        type:Number,
        default:0,
    },
    creditResetDate:{
        type:Date,
        default: ()=> new Date(new Date().setMonth(new Date().getMonth()+1)),
    },

    //Subscription
    subscription:{
        type:String,
        enum:["free","pro","enterprise"],
        default: "free",
    },

    // Code workspace project count
    codeProjectCount:{
        type:Number,
        default: 0,
    },

    // Auth
    refreshToken:{
        type:String,
        default: null,
    },
}, {timestamps:true});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password,12);
});

userSchema.methods.comparePassword = async function (candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model("User", userSchema);
export default User;