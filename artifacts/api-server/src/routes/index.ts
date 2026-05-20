import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import eventsRouter from "./events";
import bulletinRouter from "./bulletin";
import customSkinsRouter from "./customSkins";
import customBadgesRouter from "./customBadges";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(eventsRouter);
router.use(bulletinRouter);
router.use(customSkinsRouter);
router.use(customBadgesRouter);

export default router;
