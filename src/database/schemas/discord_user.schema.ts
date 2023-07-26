import mongoose from "mongoose";

interface DiscordUser {
  userID: string;
  discordID: string;
  discordUsername: string;
  discordEmail: string;
  discordAvatar: string;
  created_at?: Date;
  edited_at?: Date;
  deleted_at?: Date;
}

const discordUserSchema = new mongoose.Schema<DiscordUser>({
  userID: {
    type: String,
    unique: true,
    immutable: true,
    required: true,
  },
  discordID: {
    type: String,
    unique: true,
    immutable: true,
    required: true,
  },
  discordEmail: {
    type: String,
    unique: true,
    required: true,
  },
  discordUsername: {
    type: String,
    unique: true,
  },
  discordAvatar: {
    type: String,
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

discordUserSchema.pre("save", function (next) {
  this.edited_at = new Date();
  next();
});

const discordUserModel = mongoose.model("discord_users", discordUserSchema);
export default discordUserModel;
