import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    role:{
        type: String,
        enum:["user","assistant"],
        required: true,
    },
    content:{
        type:String,
        default: "",
    },

    // Message type determines how it renders
    type:{
        type:String,
        enum: ["text","image","document","voice","image_generated"],
        default: "text",
    },

    // for uploaded files
    file:{
        name:String,
        mimeType: String,
        size: Number,
    },

    // for generated images
    imageUrl: {
        type:String,
        default: null,
    },

    // Credits used for this message
    creditsUsed: {
        type:Number,
        default: 0
    },
},{timestamps:true});

// Index for fast conversation message lookup
messageSchema.index({conversation:1, createdAt:1});

const Message = mongoose.model("Message",messageSchema);
export default Message;