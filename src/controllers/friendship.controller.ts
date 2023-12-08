import crypro from "crypto";
import { localUserModel } from "../database/schemas/local_user.schema";
import { friendshipModel } from "../database/schemas/friendship.schema";

export namespace FriendshipController {

    type FriendshipsArray = {
        username: String,
        status: Number,
    }

    /**
     * @param user: string
     * @returns array
     * 
     * Function that takes a requester (users username) and a receiver (users username)
     * as arguments in order to check if their friendship exists,
     * if it does, it returns friendship's ID as string
     */
    export async function findFriendships(user: string, friendshipID?: string): Promise<FriendshipsArray[] | null | undefined> {
        let friendshipsData: FriendshipsArray[] = [];
        try {
            let query: any;
            if (friendshipID) {
                query = { _id: friendshipID };
            } else {
                query = {
                    'username': user,
                };
            }
            const result = await localUserModel.find(query, { friendships: 1 });
            const firstElem = result[0];
            const friendshipsArray = firstElem.friendships;
            friendshipsArray.forEach(friendshipObj => {
                friendshipsData.push({
                    username: friendshipObj.username,
                    status: friendshipObj.status,
                });
            })
            return friendshipsData.length > 0 ? friendshipsData : null;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * 
     * @param requester: string
     * @param receiver: string
     * @returns string
     * 
     * Function that writes a new object record of a friendship between 2 users and
     * sets it as Pending status (to be resolved depending if the users accepts or declines)
     */
    export async function requestFriend(requester: string, receiver: string): Promise<String | null | undefined> {
        let result = await findFriendships(requester);
        if (result) {
            let friend;
            for (let i = 0; i < result.length; i++) {
                friend = result[i].username;
            }
            if (friend !== receiver) {
                try {
                    let users = await localUserModel.find({
                        username:
                        {
                            $in: [requester, receiver]
                        }
                    });
                    if (users.length === 2) {
                        let id = crypto.randomUUID();
                        await friendshipModel.create({
                            friendship_id: id,
                            requester: {
                                _id: users[0]?._id,
                                username: users[0]?.username,
                                email: users[0]?.email,
                            },
                            receiver: {
                                _id: users[1]?._id,
                                username: users[1]?.username,
                                email: users[1]?.email,
                            },
                            status: 2,
                            description: "Pending",
                        });
                        await localUserModel.findOneAndUpdate({
                            username: requester,
                        },
                            {
                                $push: {
                                    friendships: {
                                        friendship_id: id,
                                        status: 2,
                                        friend_id: users[1]?._id,
                                        username: users[1]?.username,
                                        added_at: Date.now(),
                                    },
                                }
                            }
                        )
                        await localUserModel.findOneAndUpdate({
                            _id: receiver,
                        },
                            {
                                $push: {
                                    friendships: {
                                        friendship_id: id,
                                        status: 2,
                                        friend_id: users[0]?._id,
                                        username: users[0]?.username,
                                        added_at: Date.now(),
                                    },
                                }
                            }
                        )
                        return receiver;
                    }
                } catch (err: any) {
                    return undefined;
                }
            }
        } else return null;
    }

    /**
     * @param friendship_id: string
     * @returns: boolean
     * 
     * If a user doesn't accepts a request from a friend, 
     * the friendship placeholder that was recorded when friend
     * request was send is going to be deleted
     */
    export async function rejectFriend(friendship_id: string): Promise<boolean | undefined> {
        try {
            let friendshipID = await friendshipModel.findOne({
                _id: friendship_id,
            });
            if (friendshipID !== null || undefined) {
                await friendshipModel.findOneAndDelete(
                    {
                        _id: friendshipID,
                    },
                );
                return true;
            } else {
                return false;
            }
        }
        catch (err: any) {
            return undefined;
        }
    }

    /**
     * 
     * @param user_id: string
     * @param friendship_id: ObjectId (MongoDB Object)
     * @returns: boolean
     * 
     * Takes user ID and friendship ID and checks if given friendship already
     * exists in users friendship array
     */
    export async function checkIfFriendshipExists(user_id: String | undefined, friendship_id: String | undefined): Promise<boolean | null | undefined> {
        try {
            let user = await localUserModel.findOne({
                _id: user_id,
            })
            if (user !== null || undefined) {
                let userFriendshipsArray = user?.friendships;
                if (!userFriendshipsArray) return null;
                else {
                    for (let i = 0; i < userFriendshipsArray?.length; i++) {
                        let userFriendship = userFriendshipsArray[i].friendship_id;
                        if (userFriendship === friendship_id) return true;
                        else return false;
                    }
                }
            }
        } catch (err) {
            return undefined;
        }
    }

    /**
     * @param friendship_id: string
     * @returns: boolean
     * 
     * When a user clicks to accept a friend, function takes in user's friendshipID,
     * and changes its status to Accepted, while also adds a new record 
     * in user's friendship array adding that friend's ID
     */
    export async function acceptFriend(friendship_id: string): Promise<boolean | undefined> {
        try {
            let friendshipID = await friendshipModel.findOne({
                _id: friendship_id,
            });
            if (friendshipID !== null || undefined) {
                let requesterID = friendshipID?.requester;
                let receiverID = friendshipID?.receiver;

                let requesterFriendshipResult = await checkIfFriendshipExists(requesterID?._id, friendship_id);
                if (requesterFriendshipResult === true) return false;
                let receiverFriendshipResult = await checkIfFriendshipExists(receiverID?._id, friendship_id);
                if (receiverFriendshipResult === true) return false;

                let requester = await localUserModel.findOne({
                    _id: requesterID?._id,
                })

                let receiver = await localUserModel.findOne({
                    _id: receiverID?._id,
                })

                await localUserModel.findOneAndUpdate({
                    _id: requesterID,
                },
                    {
                        $push: {
                            friendships: {
                                friendship_id: friendshipID?._id,
                                friend_id: receiver?._id,
                                username: receiver?.username,
                                email: receiver?.email,
                                avatar: receiver?.avatar,
                                added_at: Date.now(),
                            },
                        }
                    }
                )
                await localUserModel.findOneAndUpdate({
                    _id: receiverID,
                },
                    {
                        $push: {
                            friendships: {
                                friendship_id: friendshipID?._id,
                                friend_id: requester?._id,
                                username: requester?.username,
                                email: requester?.email,
                                avatar: requester?.avatar,
                                added_at: Date.now(),
                            },
                        }
                    }
                )
                await friendshipModel.findOneAndUpdate({
                    _id: friendshipID,
                },
                    {
                        status: 1,
                        description: "Accepted",
                    }
                )
                return true;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param friendship_id: string
     * @returns: boolean
     * 
     * When a users click on delete friends, function takes friendship ID and 
     * deletes friendship record as well as that friend's ID on both users
     */
    export async function deleteFriend(friendship_id: string): Promise<Boolean | undefined> {
        try {
            let friendshipID = await friendshipModel.findOne({
                _id: friendship_id,
            });
            if (friendshipID !== null || undefined) {
                let requesterID = friendshipID?.requester;
                let receiverID = friendshipID?.receiver;
                await friendshipModel.findOneAndDelete({
                    _id: friendshipID,
                })
                await localUserModel.updateOne({
                    _id: requesterID,
                },
                    {
                        $pull: {
                            friendships: receiverID,
                        }
                    },
                )
                await localUserModel.updateOne({
                    _id: receiverID,
                },
                    {
                        $pull: {
                            friendships: requesterID,
                        }
                    },
                )
                return true;
            } else {
                return false;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * 
     * @param username: string
     * @returns: Array<string>
     * 
     * Function that returns an array of friends from given username
     */
    export async function getAllFriendsOfAUser(username: string): Promise<Array<Object> | null | undefined> {
        try {
            let result = await localUserModel.findOne({
                username: username,
            });
            const friendshipsArray = result?.friendships;
            if (!friendshipsArray) {
                return null;
            }
            if (friendshipsArray?.length > 0) {
                return friendshipsArray;
            }
        } catch (err) {
            return undefined;
        }
    }
}
