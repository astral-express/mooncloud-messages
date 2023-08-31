import mongoose from "mongoose";

interface Session {
    _id: string;
    expires: Date;
    session: string;
}

const sessionsSchema = new mongoose.Schema<Session>({
    _id: {
        type: String,
    },
    expires: {
        type: Date,
    },
    session: {
        type: String,
    }
})

export const sessions = mongoose.model("sessions", sessionsSchema);