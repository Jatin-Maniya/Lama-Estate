import express from "express";
import {
  deleteAdminPost,
  getAdminDashboard,
  getAdminPostById,
  getAdminPosts,
  getAdminUsers,
  getPendingPosts,
  reviewPost,
  toggleUserBlock,
} from "../controllers/admin.controller.js";
import { verifyAdmin, verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAdminUsers);
router.put("/users/:id/block", toggleUserBlock);
router.get("/posts", getAdminPosts);
router.get("/posts/pending", getPendingPosts);
router.get("/posts/:id", getAdminPostById);
router.put("/posts/:id/review", reviewPost);
router.delete("/posts/:id", deleteAdminPost);
router.post("/posts/:id/delete", deleteAdminPost);

export default router;
