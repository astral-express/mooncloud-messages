import { localUserModel } from "../database/schemas/local_user.schema";
import { Bcrypt } from "../public/utils/bcrypt.util";
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
     * @param regexQuery: string, 
     * @param multiQuery?: String[]
     * @returns array
     * 
     * Takes a string argument or multiple strings in an array,
     * and returns array of user objects
     */
    export async function getLocalUser(regexQuery: string, multiQuery?: String[]): Promise<UserArray[] | null | undefined> {
        let usersData = [];
        let query: any;
        try {
            if (multiQuery) {
                query = {
                    username: {
                        $in: multiQuery,
                    }
                }
            }
            if (regexQuery) {
                query = {
                    username: {
                        $regex: regexQuery,
                    },
                }
            }
            let users = await localUserModel.find(query);
            for (let i = 0; i < users.length; i++) {
                usersData.push({
                    username: users[i].username,
                    avatar: users[i].avatar,
                    defaultAvatar: users[i].defaultAvatar,
                    email: users[i].email,
                    userID: users[i].userID,
                    description: users[i].description,
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


    /**
     * @param user: string
     * @param password: string
     * @returns boolean
     * 
     * Function for checking passwords
     */
    export async function checkLocalUserPassword(user: string, password: string): Promise<boolean | null | undefined> {
        try {
            let result = await localUserModel.findOne({ username: user });
            if (result) {
                let isMatch = Bcrypt.comparePasswords(password, result.password);
                return isMatch;
            } return null;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }

    /**
     * @param user: string
     * @param newPassword: string
     * @returns boolean
     * 
     * Hashes and updates new password
     */
    export async function changeLocalUserPassword(user: string, newPassword: string): Promise<boolean | null | undefined> {
        try {
            let newHashedPassword = Bcrypt.hashedPassword(newPassword);
            let userQuery = {
                username: user,
            }
            let newPasswordQuery = {
                $set: {
                    password: newHashedPassword,
                }
            }
            let result = await localUserModel.updateOne(userQuery, newPasswordQuery)
            if (result?.matchedCount === 1) {
                return true;
            } else return false;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }
}
