import prisma from "../lib/prisma.js";

export const addMessage = async(req,res) => {
    const tokenUserId = req.userId;
    const chatId = req.params.chatId;
    const text = req.body.text?.toString().trim();

    if (!text) {
        return res.status(400).json({ message: "Message text is required." });
    }

    try{
        const chat = await prisma.chat.findFirst({
            where:{
                id:chatId,
                userIDs:{
                    hasSome:[tokenUserId],
                }
            }
        })

        if(!chat) return res.status(404).json({message:"Chat Not Found"})

        const message = await prisma.message.create({
            data:{
                text,
                chatId,
                userId:tokenUserId,
            }
        })

        await prisma.chat.update({
            where:{
                id:chatId
            },
            data:{
                seenBy:{
                    set:[tokenUserId],
                },
                lastMessage:text,
            }
        })

        res.status(200).json(message);

    }catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed To Add Message!"})
    } 
}