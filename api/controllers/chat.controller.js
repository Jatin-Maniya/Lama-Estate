import prisma from "../lib/prisma.js";

export const getChats = async(req,res) => {
    const tokenUserId = req.userId;

    try{
        const chats = await prisma.chat.findMany({
            where:{
                userIDs:{
                    hasSome:[tokenUserId],
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        const enrichedChats = await Promise.all(
            chats.map(async (chat) => {
                const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

                if (!receiverId) {
                    return {
                        ...chat,
                        receiver: null,
                    };
                }

                const receiver = await prisma.user.findUnique({
                    where:{
                        id:receiverId,
                    },
                    select:{
                        id:true,
                        username:true,
                        avatar:true,
                    }
                })

                return {
                    ...chat,
                    receiver,
                };
            })
        );

        res.status(200).json(enrichedChats)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get chats!"})
    }
}

export const getChat = async(req,res) => {
    const tokenUserId = req.userId
    try{
        const chat = await prisma.chat.findFirst({
            where:{
                id:req.params.id,
                userIDs:{
                    hasSome:[tokenUserId],
                }
            },
            include:{
                messages:{
                    orderBy:{
                        createdAt:"asc"
                    }
                }
            }
        })

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }

        const seenSet = Array.from(new Set([...(chat.seenBy || []), tokenUserId]));

        await prisma.chat.update({
            where:{
                id:req.params.id
            },
            data:{
                seenBy:{
                    set:seenSet,
                }
            }
        })

        res.status(200).json(chat)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get chat!"})
    }
}

export const addChat = async(req,res) => {

    const tokenUserId = req.userId
    const receiverId = req.body.receiverId;

    if (!receiverId) {
        return res.status(400).json({ message: "receiverId is required." });
    }

    if (receiverId === tokenUserId) {
        return res.status(400).json({ message: "Cannot start chat with yourself." });
    }

    try{
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true, isBlocked: true },
        });

        if (!receiver || receiver.isBlocked) {
            return res.status(404).json({ message: "Receiver is unavailable." });
        }

        const existingChat = await prisma.chat.findFirst({
            where: {
                userIDs: {
                    hasEvery: [tokenUserId, receiverId],
                },
            },
        });

        if (existingChat) {
            return res.status(200).json(existingChat);
        }

        const newChat = await prisma.chat.create({
            data:{
                userIDs: [tokenUserId, receiverId],
                seenBy: [tokenUserId],
            }
        })

        res.status(200).json(newChat)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to add chats!"})
    }
}

export const readChat = async(req,res) => {
    const tokenUserId = req.userId;
    try{
        const existing = await prisma.chat.findFirst({
            where: {
                id: req.params.id,
                userIDs: {
                    hasSome: [tokenUserId],
                },
            },
            select: {
                seenBy: true,
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Chat not found." });
        }

        const seenSet = Array.from(new Set([...(existing.seenBy || []), tokenUserId]));

        const chat = await prisma.chat.update({
            where:{
                id:req.params.id,
            },
            data:{
                seenBy:{
                    set:seenSet,
                }
            }
        })

        res.status(200).json(chat)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to read chats!"})
    }
}

export const deleteChat = async (req, res) => {
    const tokenUserId = req.userId;
    const chatId = req.params.id;

    try {
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userIDs: {
                    hasSome: [tokenUserId],
                },
            },
            select: {
                id: true,
            },
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }

        await prisma.message.deleteMany({
            where: {
                chatId,
            },
        });

        await prisma.chat.delete({
            where: {
                id: chatId,
            },
        });

        return res.status(200).json({ message: "Chat deleted.", deletedId: chatId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Failed to delete chat." });
    }
}

