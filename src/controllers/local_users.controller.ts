import { localUserModel } from "../database/schemas/local_user.schema";

export namespace LocalUsersController {
  export async function getAllLocalUsers() {
    return await localUserModel.find().exec();
  }

  export async function getLocalUser(query: string) {
    return await localUserModel.find({
      $or: [
        {
          userID: query,
        },
        {
          username: query,
        },
      ],
    });
  }

  export async function createLocalUser(
    userID: string,
    username: string,
    email: string,
    password: any,
    avatar: string,
    rank: number,
    status: string
  ) {
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
    } catch (err) {
      console.error(err);
    }
  }

  export async function updateLocalUser(
    email: string,
    username?: string | undefined,
    avatar?: string | undefined
  ) {
    return await localUserModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          email: email,
          username: username,
          avatar: avatar,
        },
      }
    );
  }

  export async function deleteLocalUser(userID: string) {
    return await localUserModel.deleteOne({ userID: userID });
  }
}
