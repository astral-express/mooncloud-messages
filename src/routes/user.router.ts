import { Router } from "express";
import { FriendshipController } from "../controllers/friendship.controller";
import { LocalUsersController } from "../controllers/local_users.controller";
import { ChatController } from "../controllers/chat.controller";
var router = Router();

router.get("/:id", async (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    const friendsArray = await FriendshipController.getAllFriendsOfAUser(`${req.params.id}`);
    res.render("mooncloud/mooncloud", {
        description: "Profile",
        user: req.user,
        friends: friendsArray,
    });
});

router.post("/search", async (req, res) => {
    const { input } = req.body;
    const result = await LocalUsersController.getLocalUser(input);
    console.log(result);
    if(!result) return null;
    res.json(result);
})

router.post("/tester", async (req, res) => {
    
})

export const userRouter = router;