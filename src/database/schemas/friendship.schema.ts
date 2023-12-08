import mongoose from "mongoose";
/**
 * Status:
 * 1 - friend request accepted
 * 2 - friend request pending
 * When a friend is denied or removed, the whole record will be removed
 */
interface Friendship {
    friendship_id: String;
    requester: userType;
    receiver: userType;
    status: Number;
    description: String;
    created_at?: Date;
}

let userSchema = new mongoose.Schema<userType>({
    _id: String,
    username: String,
    email: String,
})

type userType = {
    _id: String,
    username: String,
    email: String,
}

const friendshipSchema = new mongoose.Schema<Friendship>({
    friendship_id: String,
    requester: userSchema,
    receiver: userSchema,
    status: {
        type: Number,
        min: 0,
        max: 2,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        immutable: true,
        default: Date,
    },
});

export const friendshipModel = mongoose.model("friendships", friendshipSchema);
