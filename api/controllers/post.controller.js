import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken"

export const getPosts = async (req,res) => {

    const query = req.query;
    const tokenUserId = req.userId;

    try{
        const posts = await prisma.post.findMany({
            where:{
                status: "APPROVED",
                city:query.city || undefined,
                type:query.type || undefined,
                property:query.property || undefined,
                bedroom:parseInt(query.bedroom) || undefined,
                user: {
                    is: {
                        isBlocked: false,
                    },
                },
                price:{
                    gte:parseInt(query.minPrice) || 0,
                    lte:parseInt(query.maxPrice) || 10000000,
                },
                ...(tokenUserId && {
                    NOT:{
                        userId:tokenUserId
                    }
                })
            }
        })

        setTimeout(() => {
            res.status(200).json(posts)
        }, 1000);

    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get posts"})
    }
}

export const getPost = async (req,res) => {

    const id = req.params.id

    try{

        let requestUserId = null;
        let requestIsAdmin = false;
        const token = req.cookies.token;

        if (token) {
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
                requestUserId = payload.id;
                requestIsAdmin = Boolean(payload.isAdmin);
            } catch (error) {
                requestUserId = null;
                requestIsAdmin = false;
            }
        }

        const post = await prisma.post.findUnique({
            where:{id},
            include:{
                postDetail:true,
                user:{
                    select:{
                        id:true,
                        username:true,
                        avatar:true,
                    }
                }
            }
        })

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const isOwner = requestUserId && post.userId === requestUserId;
        const canViewUnpublished = isOwner || requestIsAdmin;

        if ((!canViewUnpublished && post.status !== "APPROVED") || post.user?.isBlocked) {
            return res.status(404).json({ message: "Post not found" });
        }

        const saved = requestUserId
            ? await prisma.savedPost.findUnique({
                where:{
                    userId_postId:{
                        postId:id,
                        userId: requestUserId,
                    }
                }
            })
            : null;

        const canApplyForRent =
            post.type === "rent" &&
            post.rentalStatus === "AVAILABLE" &&
            !post.rentalLocked &&
            requestUserId &&
            !isOwner;

        res.status(200).json({
            ...post,
            isSaved: saved ? true : false,
            canApplyForRent: Boolean(canApplyForRent),
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get posts"})
    }
}

export const addPost = async (req,res) => {
    const body = req.body
    const tokenUserId = req.userId;

    const images = Array.isArray(body?.postData?.images)
        ? body.postData.images.filter((image) => typeof image === "string" && image.trim())
        : [];

    if (!images.length) {
        return res.status(400).json({ message: "At least one property image is required." });
    }

    try{

        const newPost = await prisma.post.create({
            data:{
                ...body.postData,
                images,
                status: body?.postData?.type === "rent" ? "APPROVED" : "PENDING",
                rentalStatus: "AVAILABLE",
                rentalLocked: false,
                monthlyRentAmount: body?.postData?.type === "rent" ? (Number.parseInt(body?.postData?.monthlyRentAmount, 10) || body.postData.price) : null,
                depositAmount: body?.postData?.type === "rent" ? (Number.parseInt(body?.postData?.depositAmount, 10) || Math.round(body.postData.price * 0.2)) : null,
                userId:tokenUserId,
                postDetail:{
                    create:body.postDetail,
                }
            }
        })

        res.status(200).json(newPost)
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to get post"})
    }
}

export const updatePost = async (req,res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const isAdmin = Boolean(req.isAdmin);
    const body = req.body;

    const sourcePostData = body?.postData || body || {};
    const sourcePostDetail = body?.postDetail || body?.detail || {};

    if (!sourcePostData || !sourcePostDetail) {
        return res.status(400).json({ message: "Invalid update payload." });
    }

    const toOptionalInt = (value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const postData = Object.fromEntries(
        Object.entries({
            title: sourcePostData.title,
            price: toOptionalInt(sourcePostData.price),
            address: sourcePostData.address,
            city: sourcePostData.city,
            bedroom: toOptionalInt(sourcePostData.bedroom),
            bathroom: toOptionalInt(sourcePostData.bathroom),
            latitude: sourcePostData.latitude,
            longitude: sourcePostData.longitude,
            type: sourcePostData.type,
            property: sourcePostData.property,
        }).filter(([, value]) => value !== undefined)
    );

    const postDetailData = Object.fromEntries(
        Object.entries({
            desc: sourcePostDetail.desc,
            utilities: sourcePostDetail.utilities,
            pet: sourcePostDetail.pet,
            income: sourcePostDetail.income,
            size: toOptionalInt(sourcePostDetail.size),
            school: toOptionalInt(sourcePostDetail.school),
            bus: toOptionalInt(sourcePostDetail.bus),
            restaurant: toOptionalInt(sourcePostDetail.restaurant),
        }).filter(([, value]) => value !== undefined)
    );

    try {
        const existingPost = await prisma.post.findUnique({
            where: { id },
            include: { postDetail: true },
        });

        if (!existingPost) {
            return res.status(404).json({ message: "Post not found." });
        }

        if (existingPost.userId !== tokenUserId && !isAdmin) {
            return res.status(403).json({ message: "Not Authorized!" });
        }

        const providedImages = Array.isArray(sourcePostData?.images)
            ? sourcePostData.images.filter((image) => typeof image === "string" && image.trim())
            : null;

        const finalImages = providedImages && providedImages.length
            ? providedImages
            : existingPost.images;

        if (!finalImages?.length) {
            return res.status(400).json({ message: "At least one property image is required." });
        }

        postData.images = finalImages;

        const finalPostDetailData = {
            ...postDetailData,
            desc: postDetailData.desc || existingPost.postDetail?.desc || "Property details updated.",
        };

        await prisma.post.update({
            where: { id },
            data: postData,
        });

        await prisma.postDetail.upsert({
            where: { postId: id },
            update: finalPostDetailData,
            create: {
                ...finalPostDetailData,
                postId: id,
            },
        });

        const updatedPost = await prisma.post.findUnique({
            where: { id },
            include: { postDetail: true },
        });

        return res.status(200).json({
            message: "Post updated successfully.",
            post: updatedPost,
            updatedId: id,
        })
    }
    catch(err) {
        console.log(err)

        if (err?.code === "P2023") {
            return res.status(400).json({ message: "Invalid property id." });
        }

        if (err?.code === "P2002") {
            return res.status(400).json({ message: "Duplicate value found in update data." });
        }

        res.status(500).json({message: err?.message || "Failed to update post"})
    }
}

export const deletePost = async (req,res) => {

    const id = req.params.id;
    const tokenUserId = req.userId;
    const isAdmin = Boolean(req.isAdmin);

    try {

        const post = await prisma.post.findUnique({
            where:{id}
        })

        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        if (post.userId !== tokenUserId && !isAdmin) {
            return res.status(403).json({message:"Not Authorized!"})
        }

        await prisma.savedPost.deleteMany({ where: { postId: id } });
        await prisma.postDetail.deleteMany({ where: { postId: id } });
        await prisma.post.delete({ where: { id } });

        return res.status(200).json({
            message:"Post Deleted",
            deletedId: id,
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({message:"Failed to delete post"})
    }
}