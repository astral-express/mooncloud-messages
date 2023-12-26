import mongoose from "mongoose";

interface LocalUser {
    userID: String;
    username: String;
    email: String;
    password: String;
    defaultAvatar: String;
    avatar: String;
    description: String;
    friendships: [friendshipType];
    status: String;
    created_at?: Date;
    edited_at?: Date;
    deleted_at?: Date;
}

type friendshipType = {
    friendship_id: String,
    friend_id: String,
    status: Number
    username: String,
    added_at: Date,
}

let friendshipSchema = new mongoose.Schema<friendshipType>({
    friendship_id: String,
    friend_id: String,
    status: Number,
    username: String,
    added_at: Date,
})

const userSchema = new mongoose.Schema<LocalUser>({
    userID: {
        type: String,
        unique: true,
        immutable: true,
        required: true,
    },
    username: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        private: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    defaultAvatar: {
        type: String,
        default: "default_user_avatar.jpg",
    },
    avatar: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: "No bio",
    },
    friendships: [friendshipSchema],
    status: {
        type: String,
        default: "offline",
    },
    created_at: {
        type: Date,
        immutable: true,
        default: Date,
    },
    edited_at: {
        type: Date,
        default: Date,
    },
    deleted_at: {
        type: Date,
    },
});

/**
 * Update edited_at row on user update
 */
userSchema.pre("save", function (next) {
    this.edited_at = new Date();
    next();
});

export const localUserModel = mongoose.model("local_users", userSchema);
