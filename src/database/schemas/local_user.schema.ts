import mongoose from "mongoose";

interface LocalUser {
    userID: string,
    username: string,
    email: string,
    password: string,
    defaultAvatar: string,
    avatar: string,
    created_at?: Date,
    edited_at?: Date,
    deleted_at?: Date,
}

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
    default: "",
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

userSchema.pre("save", function (next) {
  this.edited_at = new Date();
  next();
});

export const localUserModel = mongoose.model("local_users", userSchema);