import mongoose from "mongoose";

type membersType = [
    {
        user: string,
        avatar: string,
        email: string,
        status: string,
    },
    {
        user: string,
        avatar: string,
        email: string,
        status: string,
    },
]

type messagesType = {
    message_id: string,
    user: string,
    message: string,
    dateSent: string,
    dateRead: string,
}

let membersSchema = new mongoose.Schema<membersType>(
    [
        {
            user: String,
            avatar: String,
            email: String,
            status: String,
        },
        {
            user: String,
            avatar: String,
            email: String,
            status: String,
        },
    ]
)

let messagesSchema = new mongoose.Schema<messagesType>({
    message_id: String,
    user: String,
    message: String,
    dateSent: String,
    dateRead: String,
})

interface Chat {
    chatID: string;
    time: Date;
    members: membersType[];
    messages: messagesType[];
    description: string;
    total_messages: number;
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