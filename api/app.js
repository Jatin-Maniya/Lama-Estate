import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import postRoute from "./routes/post.route.js";
import authRoute from "./routes/auth.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import adminRoute from "./routes/admin.route.js";
import rentalRoute from "./routes/rental.route.js";
import { runRentalLifecycleJobs } from "./services/rentalLifecycle.service.js";

const app = express();

app.disable("etag");

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});

app.use(cors({origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials:true}));
app.use(express.json());
app.use(cookieParser()); 

app.use("/api/auth",authRoute);
app.use("/api/user",userRoute);
app.use("/api/posts",postRoute);
app.use("/api/test",testRoute);
app.use("/api/chats",chatRoute);
app.use("/api/messages",messageRoute);
app.use("/api/admin",adminRoute);
app.use("/api/rentals",rentalRoute);

const RENTAL_JOB_INTERVAL_MS = 1000 * 60 * 30; // 30 Minutes

setInterval(async () => {
    try {
        const result = await runRentalLifecycleJobs();
        if (result.expiredCount || result.reminderCount) {
            console.log("Rental lifecycle job", result);
        }
    } catch (error) {
        console.log("Rental lifecycle job failed", error?.message || error);
    }
}, RENTAL_JOB_INTERVAL_MS);

app.listen(process.env.PORT || 3000,()=>{
    console.log("Server is Running");
})

// set Interval Runs After every 30 minutes