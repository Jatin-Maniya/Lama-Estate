import express from "express";
import {verifyToken,optionalVerifyToken} from "../middleware/verifyToken.js"
import { addPost, deletePost, getPost, getPosts, updatePost } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/",optionalVerifyToken,getPosts)
router.get("/:id",getPost)
router.post("/",verifyToken,addPost)
router.put("/:id",verifyToken,updatePost)
router.delete("/:id",verifyToken,deletePost)


export default router;