import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botsRouter from "./bots";
import launcherRouter from "./launcher";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botsRouter);
router.use(launcherRouter);

export default router;
