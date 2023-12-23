import { Router } from "express";
var router = Router();

router.get("/:id", async (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("mooncloud/mooncloud", {
        user: req.user,
    });
});

export const userRouter = router;