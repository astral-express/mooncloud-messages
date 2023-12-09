"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipController = void 0;
const local_user_schema_1 = require("../database/schemas/local_user.schema");
const friendship_schema_1 = require("../database/schemas/friendship.schema");
var FriendshipController;
(function (FriendshipController) {
    /**
     * @param user: string
     * @returns array
     *
     * Function that takes a requester (users username) and a receiver (users username)
     * as arguments in order to check if their friendship exists,
     * if it does, it returns friendship's ID as string
     */
    function findFriendships(user, friendshipID) {
        return __awaiter(this, void 0, void 0, function* () {
            let friendshipsData = [];
            try {
                let query;
                if (friendshipID) {
                    query = { _id: friendshipID };
                }
                else {
                    query = {
                        'username': user,
                    };
                }
                const result = yield local_user_schema_1.localUserModel.find(query, { friendships: 1 });
                const firstElem = result[0];
                const friendshipsArray = firstElem.friendships;
                friendshipsArray.forEach(friendshipObj => {
                    friendshipsData.push({
                        username: friendshipObj.username,
                        status: friendshipObj.status,
                    });
                });
                return friendshipsData.length > 0 ? friendshipsData : null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.findFriendships = findFriendships;
    /**
     *
     * @param requester: string
     * @param receiver: string
     * @returns string
     *
     * Function that writes a new object record of a friendship between 2 users and
     * sets it as Pending status (to be resolved depending if the users accepts or declines)
     */
    function requestFriend(requester, receiver) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield findFriendships(requester);
            if (result) {
                let friend;
                for (let i = 0; i < result.length; i++) {
                    friend = result[i].username;
                }
                if (friend !== receiver) {
                    try {
                        let users = yield local_user_schema_1.localUserModel.find({
                            username: {
                                $in: [requester, receiver]
                            }
                        });
                        if (users.length === 2) {
                            let id = crypto.randomUUID();
                            yield friendship_schema_1.friendshipModel.create({
                                friendship_id: id,
                                requester: {
                                    _id: (_a = users[0]) === null || _a === void 0 ? void 0 : _a._id,
                                    username: (_b = users[0]) === null || _b === void 0 ? void 0 : _b.username,
                                    email: (_c = users[0]) === null || _c === void 0 ? void 0 : _c.email,
                                },
                                receiver: {
                                    _id: (_d = users[1]) === null || _d === void 0 ? void 0 : _d._id,
                                    username: (_e = users[1]) === null || _e === void 0 ? void 0 : _e.username,
                                    email: (_f = users[1]) === null || _f === void 0 ? void 0 : _f.email,
                                },
                                status: 2,
                                description: "Pending",
                            });
                            yield local_user_schema_1.localUserModel.findOneAndUpdate({
                                username: requester,
                            }, {
                                $push: {
                                    friendships: {
                                        friendship_id: id,
                                        status: 2,
                                        friend_id: (_g = users[1]) === null || _g === void 0 ? void 0 : _g._id,
                                        username: (_h = users[1]) === null || _h === void 0 ? void 0 : _h.username,
                                        added_at: Date.now(),
                                    },
                                }
                            });
                            yield local_user_schema_1.localUserModel.findOneAndUpdate({
                                _id: receiver,
                            }, {
                                $push: {
                                    friendships: {
                                        friendship_id: id,
                                        status: 2,
                                        friend_id: (_j = users[0]) === null || _j === void 0 ? void 0 : _j._id,
                                        username: (_k = users[0]) === null || _k === void 0 ? void 0 : _k.username,
                                        added_at: Date.now(),
                                    },
                                }
                            });
                            return receiver;
                        }
                    }
                    catch (err) {
                        return undefined;
                    }
                }
            }
            else
                return null;
        });
    }
    FriendshipController.requestFriend = requestFriend;
    /**
     * @param friendship_id: string
     * @returns: boolean
     *
     * If a user doesn't accepts a request from a friend,
     * the friendship placeholder that was recorded when friend
     * request was send is going to be deleted
     */
    function rejectFriend(friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID = yield friendship_schema_1.friendshipModel.findOne({
                    _id: friendship_id,
                });
                if (friendshipID !== null || undefined) {
                    yield friendship_schema_1.friendshipModel.findOneAndDelete({
                        _id: friendshipID,
                    });
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.rejectFriend = rejectFriend;
    /**
     *
     * @param user_id: string
     * @param friendship_id: ObjectId (MongoDB Object)
     * @returns: boolean
     *
     * Takes user ID and friendship ID and checks if given friendship already
     * exists in users friendship array
     */
    function checkIfFriendshipExists(user_id, friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let user = yield local_user_schema_1.localUserModel.findOne({
                    _id: user_id,
                });
                if (user !== null || undefined) {
                    let userFriendshipsArray = user === null || user === void 0 ? void 0 : user.friendships;
                    if (!userFriendshipsArray)
                        return null;
                    else {
                        for (let i = 0; i < (userFriendshipsArray === null || userFriendshipsArray === void 0 ? void 0 : userFriendshipsArray.length); i++) {
                            let userFriendship = userFriendshipsArray[i].friendship_id;
                            if (userFriendship === friendship_id)
                                return true;
                            else
                                return false;
                        }
                    }
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.checkIfFriendshipExists = checkIfFriendshipExists;
    /**
     * @param friendship_id: string
     * @returns: boolean
     *
     * When a user clicks to accept a friend, function takes in user's friendshipID,
     * and changes its status to Accepted, while also adds a new record
     * in user's friendship array adding that friend's ID
     */
    function acceptFriend(friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID = yield friendship_schema_1.friendshipModel.findOne({
                    _id: friendship_id,
                });
                if (friendshipID !== null || undefined) {
                    let requesterID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.requester;
                    let receiverID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.receiver;
                    let requesterFriendshipResult = yield checkIfFriendshipExists(requesterID === null || requesterID === void 0 ? void 0 : requesterID._id, friendship_id);
                    if (requesterFriendshipResult === true)
                        return false;
                    let receiverFriendshipResult = yield checkIfFriendshipExists(receiverID === null || receiverID === void 0 ? void 0 : receiverID._id, friendship_id);
                    if (receiverFriendshipResult === true)
                        return false;
                    let requester = yield local_user_schema_1.localUserModel.findOne({
                        _id: requesterID === null || requesterID === void 0 ? void 0 : requesterID._id,
                    });
                    let receiver = yield local_user_schema_1.localUserModel.findOne({
                        _id: receiverID === null || receiverID === void 0 ? void 0 : receiverID._id,
                    });
                    yield local_user_schema_1.localUserModel.findOneAndUpdate({
                        _id: requesterID,
                    }, {
                        $push: {
                            friendships: {
                                friendship_id: friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID._id,
                                friend_id: receiver === null || receiver === void 0 ? void 0 : receiver._id,
                                username: receiver === null || receiver === void 0 ? void 0 : receiver.username,
                                email: receiver === null || receiver === void 0 ? void 0 : receiver.email,
                                avatar: receiver === null || receiver === void 0 ? void 0 : receiver.avatar,
                                added_at: Date.now(),
                            },
                        }
                    });
                    yield local_user_schema_1.localUserModel.findOneAndUpdate({
                        _id: receiverID,
                    }, {
                        $push: {
                            friendships: {
                                friendship_id: friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID._id,
                                friend_id: requester === null || requester === void 0 ? void 0 : requester._id,
                                username: requester === null || requester === void 0 ? void 0 : requester.username,
                                email: requester === null || requester === void 0 ? void 0 : requester.email,
                                avatar: requester === null || requester === void 0 ? void 0 : requester.avatar,
                                added_at: Date.now(),
                            },
                        }
                    });
                    yield friendship_schema_1.friendshipModel.findOneAndUpdate({
                        _id: friendshipID,
                    }, {
                        status: 1,
                        description: "Accepted",
                    });
                    return true;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.acceptFriend = acceptFriend;
    /**
     * @param friendship_id: string
     * @returns: boolean
     *
     * When a users click on delete friends, function takes friendship ID and
     * deletes friendship record as well as that friend's ID on both users
     */
    function deleteFriend(friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID = yield friendship_schema_1.friendshipModel.findOne({
                    _id: friendship_id,
                });
                if (friendshipID !== null || undefined) {
                    let requesterID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.requester;
                    let receiverID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.receiver;
                    yield friendship_schema_1.friendshipModel.findOneAndDelete({
                        _id: friendshipID,
                    });
                    yield local_user_schema_1.localUserModel.updateOne({
                        _id: requesterID,
                    }, {
                        $pull: {
                            friendships: receiverID,
                        }
                    });
                    yield local_user_schema_1.localUserModel.updateOne({
                        _id: receiverID,
                    }, {
                        $pull: {
                            friendships: requesterID,
                        }
                    });
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.deleteFriend = deleteFriend;
    /**
     *
     * @param username: string
     * @returns: Array<string>
     *
     * Function that returns an array of friends from given username
     */
    function getAllFriendsOfAUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_1.localUserModel.findOne({
                    username: username,
                });
                const friendshipsArray = result === null || result === void 0 ? void 0 : result.friendships;
                if (!friendshipsArray) {
                    return null;
                }
                if ((friendshipsArray === null || friendshipsArray === void 0 ? void 0 : friendshipsArray.length) > 0) {
                    return friendshipsArray;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.getAllFriendsOfAUser = getAllFriendsOfAUser;
})(FriendshipController || (exports.FriendshipController = FriendshipController = {}));
//# sourceMappingURL=friendship.controller.js.map