import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import eventsRouter from "./events";
import bulletinRouter from "./bulletin";
import customSkinsRouter from "./customSkins";
import customBadgesRouter from "./customBadges";
import customBannersRouter from "./customBanners";
import authRouter from "./auth";
import mapsRouter from "./maps";
import badgeInventoryRouter from "./badgeInventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(eventsRouter);
router.use(bulletinRouter);
router.use(customSkinsRouter);
router.use(customBadgesRouter);
router.use(customBannersRouter);
router.use(mapsRouter);
router.use(badgeInventoryRouter);

export default router;
