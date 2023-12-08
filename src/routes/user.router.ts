import { Router } from "express";
import { FriendshipController } from "../controllers/friendship.controller";
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

export const userRouter = router;