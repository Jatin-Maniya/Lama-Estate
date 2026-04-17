import express from "express";
import {
  acceptApplication,
  applyForRent,
  createDepositOrder,
  createMonthlyRentOrder,
  getMyApplications,
  getMyNotifications,
  getMyPayments,
  getOwnerAgreements,
  getOwnerApplications,
  getRenterAgreements,
  markNotificationRead,
  rejectApplication,
  verifyDepositPayment,
  verifyMonthlyRentPayment,
} from "../controllers/rental.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/apply/:postId", verifyToken, applyForRent);

router.get("/applications/owner", verifyToken, getOwnerApplications);
router.get("/applications/me", verifyToken, getMyApplications);
router.patch("/applications/accept/:applicationId", verifyToken, acceptApplication);
router.patch("/applications/reject/:applicationId", verifyToken, rejectApplication);

router.get("/agreements/owner", verifyToken, getOwnerAgreements);
router.get("/agreements/renter", verifyToken, getRenterAgreements);

router.post("/payments/deposit/order", verifyToken, createDepositOrder);
router.post("/payments/deposit/verify", verifyToken, verifyDepositPayment);
router.post("/payments/rent/order", verifyToken, createMonthlyRentOrder);
router.post("/payments/rent/verify", verifyToken, verifyMonthlyRentPayment);
router.get("/payments/me", verifyToken, getMyPayments);

router.get("/notifications/me", verifyToken, getMyNotifications);
router.patch("/notifications/read/:notificationId", verifyToken, markNotificationRead);

export default router;
