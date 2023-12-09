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
exports.LocalUsersController = void 0;
const local_user_schema_1 = require("../database/schemas/local_user.schema");
var LocalUsersController;
(function (LocalUsersController) {
    /**
     * @param username: string
     * @returns string
     *
     * Function takes an username and returns userID that is converted
     * from MongoDB's ObjectId to String
     */
    function findUserIdViaUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_1.localUserModel.findOne({
                    username: username,
                });
                let userID = result === null || result === void 0 ? void 0 : result._id.toString();
                if (userID !== undefined) {
                    return userID;
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
    LocalUsersController.findUserIdViaUsername = findUserIdViaUsername;
    /**
     * @returns array of user objects
     *
     * Calling this function returns an array of objects of all local users
     */
    function getAllLocalUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_1.localUserModel.find().exec();
                if (!result) {
                    return null;
                }
                return result;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    LocalUsersController.getAllLocalUsers = getAllLocalUsers;
    /**
     * @param query: string
     * @returns array
     *
     * Takes a string argument, either user ID or username
     * and returns an user object
     */
    function getLocalUser(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let usersData = [];
            try {
                let users = yield local_user_schema_1.localUserModel.find({
                    username: {
                        $regex: query,
                    },
                });
                for (let i = 0; i < users.length; i++) {
                    usersData.push({
                        username: users[i].username,
                        avatar: users[i].avatar,
                        defaultAvatar: users[i].defaultAvatar,
                    });
                }
                return usersData.length > 0 ? usersData : null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    LocalUsersController.getLocalUser = getLocalUser;
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
    function createLocalUser(userID, username, email, password, avatar, rank, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield local_user_schema_1.localUserModel.create({
                    userID,
                    username,
                    email,
                    password,
                    avatar,
                    rank,
                    status,
                });
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.createLocalUser = createLocalUser;
    /**
     * @param email: string
     * @param username: string
     * @param avatar: string
     * @returns void
     *
     * Function for changing and updating user info
     */
    function updateLocalUser(email, username, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield local_user_schema_1.localUserModel.findOneAndUpdate({ email: email }, {
                    $set: {
                        email: email,
                        username: username,
                        avatar: avatar,
                    },
                });
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.updateLocalUser = updateLocalUser;
    /**
     * @param userID: string
     * @returns void
     *
     * Function for removing an user from db
     */
    function deleteLocalUser(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield local_user_schema_1.localUserModel.deleteOne({ userID: userID });
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.deleteLocalUser = deleteLocalUser;
})(LocalUsersController || (exports.LocalUsersController = LocalUsersController = {}));
//# sourceMappingURL=local_users.controller.js.map