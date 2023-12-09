"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let membersSchema = new mongoose_1.default.Schema([
    {
        user: String,
        avatar: String,
    },
    {
        user: String,
        avatar: String,
    },
]);
let messagesSchema = new mongoose_1.default.Schema({
    message_id: String,
    user: String,
    message: String,
    dateSent: String,
    dateRead: String,
});
const chatSchema = new mongoose_1.default.Schema({
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
exports.chatModel = mongoose_1.default.model("chats", chatSchema);
//# sourceMappingURL=chat.schema.js.map