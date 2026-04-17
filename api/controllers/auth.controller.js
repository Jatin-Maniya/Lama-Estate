import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async(req,res) => {
    // db Operation
    const {username,email,password} = req.body;

    try {

    // HASH THE PASSWORD

    const hashedPassword = await bcrypt.hash(password,10); // 10 = sault round

    // console.log(hashedPassword);

    // CREATE A NEW USER AND SAVE IT TO DB

    const adminCount = await prisma.user.count({
        where: { isAdmin: true },
    });

    const newUser = await prisma.user.create({
        data:{
            username,
            email,
            password:hashedPassword,
            isAdmin: adminCount === 0,
        }
    })

    console.log(newUser);

    res.status(201).json({message:"User Created Successfully"});

    }catch(err) {
        console.log(err);
        res.status(500).json({message:"Failed to create user!"});
    }
}

export const login = async (req,res) => {
    // db Operation
    const {email,password} = req.body;

    try {

    // Check if user exists

    const user = await prisma.user.findUnique({
        where:{
            email,
        },
    })

    if (!user) {
        return res.status(401).json({message:"Invalid Credentials!"});
    }

    if (user.isBlocked) {
        return res.status(403).json({ message: "Your account is blocked by admin." });
    }

    // Check if Password Correct

    const isPasswordValid = await bcrypt.compare(password,user.password);

    if(!isPasswordValid) {
        return res.status(401).json({message:"Invalid Credentials!"});
    }

    // Generate Cookie

    const expire = 1000 * 60 * 60 * 24 * 7 // 7 Days

    const token = jwt.sign({
        id:user.id,
        isAdmin:user.isAdmin
    },process.env.JWT_SECRET_KEY,{expiresIn:expire})  
    
    const {password:userPassword,...userInfo} = user

    res.cookie("token",token,{
        httpOnly:true,
        maxAge:expire,
    }).status(200).json(userInfo);

    }catch(err) {
        console.log(err);
        res.status(500).json({message:"Failed to Login"})
    }
}

export const logout = (req,res) => {
    res.clearCookie("token").status(200).json({message:"Logout Successful"})
}
