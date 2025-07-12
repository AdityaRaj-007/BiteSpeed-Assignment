import express from "express";
import { placeOrder } from "../controllers/user-controller";

const router = express.Router();

router.route("/").post(placeOrder);

export default router;
