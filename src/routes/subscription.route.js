import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getSubscriberList, getSubscribingList, toggleSubscription } from "../controllers/subscription.controller.js";

const router=Router()

router.use(verifyJwt)

router.route("/toggleSubscription/:userId").post(toggleSubscription)
router.route("/subscriberList/:userId").get(getSubscriberList)
router.route("/subscribingList/:userId").get(getSubscribingList)

export default router