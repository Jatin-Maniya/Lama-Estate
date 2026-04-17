import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js";

export const verifyToken = (req,res,next) => {
    const token = req.cookies.token;

    if(!token) return res.status(401).json({message:"Not Authenticated!"});

    jwt.verify(token,process.env.JWT_SECRET_KEY,async (err,payload) => {
        if(err) return res.status(403).json({message:"Token is Not Valid!"});

        try {
            const user = await prisma.user.findUnique({
                where: { id: payload.id },
                select: { id: true, isAdmin: true, isBlocked: true },
            });

            if (!user || user.isBlocked) {
                return res.status(403).json({ message: "Account is blocked." });
            }

            req.userId = user.id;
            req.isAdmin = user.isAdmin;
            next();
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Authorization failed." });
        }
    })
}

export const verifyAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: "Admin access required." });
    }

    next();
}

export const optionalVerifyToken = (req,res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.userId = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) {
            req.userId = null;
        } else {
            req.userId = payload.id;
        }
        next();
    })
}