import { Router } from 'express';
const router = Router();

import { mainRouter } from './main.router';
import { discordRouter } from './discord.router';
import { loginRouter } from './login.router';
import { logoutRouter } from './logout.router';
import { localSignupRouter } from './signup.router';
import { userRouter } from './user.router';

router.use('/', mainRouter);
router.use('/auth/login', loginRouter);
router.use('/auth/logout', logoutRouter);
router.use('/auth/signup', localSignupRouter);
router.use('/auth/signup/discord', discordRouter);
router.use('/user', userRouter);

export default router;
