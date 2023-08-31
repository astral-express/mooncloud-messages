import { randomUUID } from "crypto";
import { chatModel } from "../database/schemas/chat.schema";

export namespace ChatController {
    /**
     * @param sender: string
     * @param receiver: string
     * 
     * Checks if chat exists between the two given users as arguments,
     * if it doesn't returns null
     */
    export async function checkIfChatExists(sender: string, receiver: string): Promise<string | null | undefined> {
        try {
            let chat = await chatModel.find({
                $or:
                    [
                        {
                            $and:
                                [
                                    {
                                        "members.user": sender,
                                    },
                                    {
                                        "members.user": receiver,
                                    }
                                ]
                        },
                        {
                            $and:
                                [
                                    {
                                        "members.user": receiver,
                                    },
                                    {
                                        "members.user": sender,
                                    }
                                ]
                        }
                    ]
            });
            if (!chat) {
                return null;
            } else {
                return chat[0].id;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param sender: string
     * @param receiver: string
     * 
     * If function checkIfChatExists returns false, this function will be called
     * in order to create a new chat record in db for given users in args
     */
    export async function initiateChat(sender: string, receiver: string, receivers?: Array<string>): Promise<Boolean | null | undefined> {
        let desc;
        if (receivers !== null) {
            desc = "private chat"
        } else {
            desc = "group chat"
        }
        try {
            await chatModel.create({
                chatID: randomUUID(),
                time: new Date(),
                members: [
                    {
                        user: sender,
                    },
                    {
                        user: receiver,
                    }
                ],
                messages: [],
                description: desc,
                total_messages: 0,
            })
            return true;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param chatID: string
     * 
     * Updates chat record on message sent and adds it to the messages array
     */
    export async function sendMessage(sender: string, message: string, chatID: string): Promise<Boolean | undefined> {
        try {
            let chat = await chatModel.findOne({
                _id: chatID,
            })
            if (chat) {
                let date = Math.floor((new Date()).getTime() / 1000)
                await chatModel.updateOne({
                    _id: chat,
                },
                    {
                        $push: {
                            messages: {
                                user: sender,
                                message: message,
                                timestamp: date,
                            }
                        },
                    })
            } return true;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param chatID: string
     * 
     * Loads all of the chat's messages and sends them to the user for front end rendering
     */
    export async function loadChat(chatID: string): Promise<any | undefined> {
        try {
            let chat = await chatModel.findOne({
                _id: chatID,
            })
            if (chat) {
                console.log(chat.messages);
            }
        } catch (err: any) {
            return undefined;
        }
    }
}