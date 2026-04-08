import express from "express";
import { getUsers, getUserById } from "../controllers/userController.js";
import { protect, role } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);

export default router;
