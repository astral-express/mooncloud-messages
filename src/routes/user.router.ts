import { Router } from "express";
var router = Router();

router.get("/:id", (req, res) => {
  if (res.headersSent !== true) {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
  }
  res.render("mooncloud/mooncloud", {
    description: "Profile",
    user: req.user,
  });
});


export const userRouter = router;
