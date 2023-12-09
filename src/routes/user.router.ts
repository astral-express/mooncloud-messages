import { Router } from "express";
import { FriendshipController } from "../controllers/friendship.controller";
var router = Router();

router.get("/:id", async (req, res) => {
    (req as any).description = "Profile";
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    const friendsArray = await FriendshipController.getAllFriendsOfAUser(`${req.params.id}`);
    res.render("mooncloud/mooncloud", {
        description: (req as any).description,
        user: req.user,
        friends: friendsArray,
    });
});

export const userRouter = router;