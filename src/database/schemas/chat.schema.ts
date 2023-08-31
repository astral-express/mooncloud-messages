import mongoose from "mongoose";

type membersType = [
    {
        user: String,
    },
    {
        user: String,
    },
]

type messagesType = {
    user: String,
    message: String,
    timestamp: String,
}

let membersSchema = new mongoose.Schema<membersType>(
    [
        {
            user: String,
        },
        {
            user: String,
        },
    ]
)

let messagesSchema = new mongoose.Schema<messagesType>({
    user: String,
    message: String,
    timestamp: String,
})

interface Chat {
    chatID: String;
    time: Date;
    members: [membersType];
    messages: [messagesType];
    description: String;
    total_messages: Number;
}

const chatSchema = new mongoose.Schema<Chat>({
    chatID: {
        type: String,
        unique: true,
        immutable: true,
        required: true,
    },
    time: {
        type: Date,
        required: true,
    },
    members: [membersSchema],
    messages: [messagesSchema],
    description: String,
    total_messages: {
        type: Number,
    }
});

export const chatModel = mongoose.model("chats", chatSchema);