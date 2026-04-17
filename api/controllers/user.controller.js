import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"

export const getUsers = async (req,res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                isAdmin: true,
                isBlocked: true,
                createdAt: true,
            },
        });
        res.status(200).json(users);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get Users!"})
    }
}

export const getUser = async (req,res) => {
    const id = req.params.id;
    try {
        const user = await prisma.user.findUnique({
            where:{id}
        });
        res.status(200).json(user);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get User!"})
    }
}

export const updateUser = async (req,res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    const {password,avatar,...inputs} = req.body;

    // console.log(id)
    // console.log(tokenUserId)

    if(id !== tokenUserId) {
        return res.status(403).json({messgae:"Not Authorized!"})
    }

    let updatedPassword = null;

    try {

        if(password) {
            updatedPassword = await bcrypt.hash(password,10);
        }

        const updatedUser = await prisma.user.update({
            where:{id},
            data:{
                ...inputs,
                ...(updatedPassword && {password : updatedPassword}),
                ...(avatar && {avatar}),
            }
        })

        const {password:userpassword,...rest} = updatedUser

        res.status(200).json(rest)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed To Update User!"})
    }
}

export const deleteUser = async (req,res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    if(id !== tokenUserId) {
        return res.status(403).json({messgae:"Not Authorized!"})
    }

    try {
        await prisma.user.delete({
            where:{id}
        })

        res.status(200).json({message:"User Deleted"})
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed To delete User!"})
    }
}

export const savePost = async (req,res) => {
    const postId = req.body.postId;
    const tokenUserId = req.userId;

    try{
        const savedPost = await prisma.savedPost.findUnique({
            where:{
                userId_postId:{
                    userId:tokenUserId,
                    postId,
                }
            }
        })

        if(savedPost) {
            await prisma.savedPost.delete({
                where:{
                    id:savedPost.id,
                }
            })
            res.status(200).json({message:"Post Removed From Saved List"})
        }else {
             await prisma.savedPost.create({
                data:{
                    userId:tokenUserId,
                    postId,
                }
            })
            res.status(200).json({message:"Post Saved"})
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to Find Posts!"})
    }
}

export const profilePosts = async(req,res) => {
    const tokenUserId = req.userId;

    try{
        const usersPosts = await prisma.post.findMany({
            where:{
                userId:tokenUserId
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        const saved = await prisma.savedPost.findMany({
            where:{
                userId:tokenUserId
            },
            include:{
                post:true,
            }
        })

        const savedPosts = saved.map(item=>item.post)
        res.status(200).json({usersPosts,savedPosts})

    }catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed To get profile Posts!"})
    }
}

export const getNotificationNumber = async(req,res) => {
    const tokenUserId = req.userId;

    try{
        const number = await prisma.chat.count({
            where:{
                userIDs:{
                    hasSome:[tokenUserId],
                },
                NOT:{
                    seenBy:{
                        hasSome:[tokenUserId]
                    }
                }
            }
        })

        res.status(200).json(number);
    }
    catch(err) {
        console.log(err);
        res.status(500).json({message:""})
    }
}