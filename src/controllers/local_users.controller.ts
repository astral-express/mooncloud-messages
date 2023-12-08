import { localUserModel } from "../database/schemas/local_user.schema";
export namespace LocalUsersController {
    /**
     * @param username: string
     * @returns string
     * 
     * Function takes an username and returns userID that is converted
     * from MongoDB's ObjectId to String
     */
    export async function findUserIdViaUsername(username: string): Promise<string | boolean | undefined> {
        try {
            let result = await localUserModel.findOne({
                username: username,
            })
            let userID = result?._id.toString();
            if (userID !== undefined) {
                return userID;
            } else {
                return false;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @returns array of user objects
     * 
     * Calling this function returns an array of objects of all local users
     */
    export async function getAllLocalUsers(): Promise<Array<Object> | null | undefined> {
        try {
            let result = await localUserModel.find().exec();
            if (!result) {
                return null;
            }
            return result;
        } catch (err: any) {
            return undefined;
        }
    }

    type UserArray = {
        username: String,
        avatar: String,
        defaultAvatar: String,
    }

    /**
     * @param query: string
     * @returns array
     * 
     * Takes a string argument, either user ID or username
     * and returns an user object
     */
    export async function getLocalUser(query: string): Promise<UserArray[] | null | undefined> {
        let usersData = [];
        try {
            let users = await localUserModel.find({
                username: {
                    $regex: query,
                },
            });
            for (let i = 0; i < users.length; i++) {
                usersData.push({
                    username: users[i].username,
                    avatar: users[i].avatar,
                    defaultAvatar: users[i].defaultAvatar,
                })
            }
            return usersData.length > 0 ? usersData : null;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param userID: string
     * @param username: string
     * @param email: string
     * @param password: string
     * @param avatar: string
     * @param rank: string
     * @param status: string
     * @returns void
     * 
     * Function for creating a new user record
     */
    export async function createLocalUser(
        userID: string,
        username: string,
        email: string,
        password: string,
        avatar: string,
        rank: number,
        status: string
    ): Promise<void | null> {
        try {
            await localUserModel.create({
                userID,
                username,
                email,
                password,
                avatar,
                rank,
                status,
            });
        } catch (err: any) {
            return null;
        }
    }

    /**
     * @param email: string
     * @param username: string
     * @param avatar: string
     * @returns void
     * 
     * Function for changing and updating user info
     */
    export async function updateLocalUser(
        email: string,
        username?: string | undefined,
        avatar?: string | undefined
    ): Promise<void | null> {
        try {
            await localUserModel.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        email: email,
                        username: username,
                        avatar: avatar,
                    },
                }
            );
        } catch (err: any) {
            return null;
        }
    }

    /**
     * @param userID: string
     * @returns void
     * 
     * Function for removing an user from db
     */
    export async function deleteLocalUser(userID: string): Promise<void | null> {
        try {
            await localUserModel.deleteOne({ userID: userID });
        } catch (err: any) {
            return null;
        }
    }
}
