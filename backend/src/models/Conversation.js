import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },
    title:{
        type:String,
        default:"New Chat",
        maxlength: [100,"Title cannot exceed 100 characters."],
    },

    // Auto-generated from first message
    isAutoTitle:{
        type:Boolean,
        default: true,
    },
    // Last message preview for sidebar
    lastMessage:{
        type: String,
        default:"",
    },
    messageCount: {
        type: Number,
        default: 0
    },
}, {timestamps:true});

// index for fast user conversational lookup
conversationSchema.index({user:1,updatedAt:-1});

const Conversation = mongoose.model("Conversation",conversationSchema);
export default Conversation;