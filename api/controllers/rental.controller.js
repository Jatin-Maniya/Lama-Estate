import crypto from "crypto";
import Razorpay from "razorpay";
import prisma from "../lib/prisma.js";

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const ensureRentalPostIsOpen = (post) => {
  if (!post) return "Property not found.";
  if (post.type !== "rent") return "Applications are only available for rental properties.";
  if (post.status !== "APPROVED") return "Property is not published yet.";
  if (post.rentalStatus !== "AVAILABLE" || post.rentalLocked) return "Property is currently not available.";
  return null;
};

export const applyForRent = async (req, res) => {
  const { postId } = req.params;
  const applicantId = req.userId;
  const {
    fullName,
    phone,
    email,
    governmentIdUrl,
    employmentDetails,
    rentalHistory,
    familyOccupantsInfo,
    reasonForRenting,
    stayDurationMonths,
    expectedStartDate,
    additionalNotes,
  } = req.body;

  const duration = Number.parseInt(stayDurationMonths, 10);

  if (
    !fullName ||
    !phone ||
    !email ||
    !governmentIdUrl ||
    !employmentDetails ||
    !familyOccupantsInfo ||
    !reasonForRenting ||
    !duration ||
    duration < 1
  ) {
    return res.status(400).json({ message: "All mandatory application fields are required." });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    const availabilityError = ensureRentalPostIsOpen(post);

    if (availabilityError) {
      return res.status(400).json({ message: availabilityError });
    }

    if (post.userId === applicantId) {
      return res.status(400).json({ message: "Owner cannot apply to own property." });
    }

    const existing = await prisma.rentalApplication.findFirst({
      where: {
        postId,
        applicantId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Application already submitted for this property." });
    }

    const startDate = expectedStartDate ? new Date(expectedStartDate) : new Date();
    const endDate = addMonths(startDate, duration);

    const application = await prisma.rentalApplication.create({
      data: {
        postId,
        ownerId: post.userId,
        applicantId,
        fullName,
        phone,
        email,
        governmentIdUrl,
        employmentDetails,
        rentalHistory,
        familyOccupantsInfo,
        reasonForRenting,
        stayDurationMonths: duration,
        expectedStartDate: startDate,
        expectedEndDate: endDate,
        additionalNotes,
      },
    });

    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: "RENTAL_APPLICATION",
        title: "New rental application",
        message: `${fullName} applied for ${post.title}.`,
      },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to submit rental application." });
  }
};

export const getOwnerApplications = async (req, res) => {
  try {
    const applications = await prisma.rentalApplication.findMany({
      where: { ownerId: req.userId },
      include: {
        post: true,
        applicant: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch owner applications." });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await prisma.rentalApplication.findMany({
      where: { applicantId: req.userId },
      include: {
        post: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch your applications." });
  }
};

export const acceptApplication = async (req, res) => {
  const { applicationId } = req.params;
  const ownerId = req.userId;

  try {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: applicationId },
      include: { post: true },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (application.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to accept this application." });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending applications can be accepted." });
    }

    if (application.post.rentalLocked || application.post.rentalStatus === "OUT_OF_RENT") {
      return res.status(409).json({ message: "Property is already locked for another renter." });
    }

    const monthlyRentAmount = application.post.monthlyRentAmount || application.post.price;
    const depositAmount = application.post.depositAmount || Math.round(monthlyRentAmount * 0.2);

    const result = await prisma.$transaction(async (tx) => {
      const lockedPost = await tx.post.updateMany({
        where: {
          id: application.postId,
          rentalLocked: false,
          rentalStatus: "AVAILABLE",
        },
        data: {
          rentalLocked: true,
          rentalStatus: "OUT_OF_RENT",
          activeRenterId: application.applicantId,
          rentStartDate: application.expectedStartDate,
          rentEndDate: application.expectedEndDate,
          monthlyRentAmount,
          depositAmount,
        },
      });

      if (!lockedPost.count) {
        throw new Error("PROPERTY_ALREADY_LOCKED");
      }

      await tx.rentalApplication.updateMany({
        where: {
          postId: application.postId,
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      const acceptedApplication = await tx.rentalApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      });

      const agreement = await tx.rentalAgreement.create({
        data: {
          postId: application.postId,
          ownerId,
          renterId: application.applicantId,
          applicationId: acceptedApplication.id,
          status: "PENDING_DEPOSIT",
          startDate: application.expectedStartDate,
          expectedEndDate: application.expectedEndDate,
          monthlyRentAmount,
          depositAmount,
        },
      });

      await tx.notification.createMany({
        data: [
          {
            userId: application.applicantId,
            type: "APPLICATION_ACCEPTED",
            title: "Application accepted",
            message: `Your application for ${application.post.title} was accepted. Pay deposit to confirm rental.`,
          },
          {
            userId: ownerId,
            type: "RENTER_SELECTED",
            title: "Renter selected",
            message: `You selected a renter for ${application.post.title}.`,
          },
        ],
      });

      return agreement;
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    if (error?.message === "PROPERTY_ALREADY_LOCKED") {
      return res.status(409).json({ message: "Property already has an active renter." });
    }

    return res.status(500).json({ message: "Failed to accept application." });
  }
};

export const rejectApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await prisma.rentalApplication.findUnique({ where: { id: applicationId } });

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (application.ownerId !== req.userId && application.applicantId !== req.userId) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({ message: "Only pending applications can be updated." });
    }

    const nextStatus = application.ownerId === req.userId ? "REJECTED" : "WITHDRAWN";

    const updated = await prisma.rentalApplication.update({
      where: { id: applicationId },
      data: { status: nextStatus },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update application." });
  }
};

export const getOwnerAgreements = async (req, res) => {
  try {
    const agreements = await prisma.rentalAgreement.findMany({
      where: { ownerId: req.userId },
      include: {
        post: true,
        renter: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(agreements);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch owner agreements." });
  }
};

export const getRenterAgreements = async (req, res) => {
  try {
    const agreements = await prisma.rentalAgreement.findMany({
      where: { renterId: req.userId },
      include: {
        post: true,
        owner: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(agreements);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch renter agreements." });
  }
};

const createOrderForPayment = async ({ amount, receipt }) => {
  const razorpay = getRazorpayClient();

  if (!razorpay) {
    return {
      id: `mock_order_${crypto.randomBytes(8).toString("hex")}`,
      amount,
      currency: "INR",
      receipt,
      isMock: true,
    };
  }

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt,
  });

  return {
    ...order,
    isMock: false,
  };
};

export const createDepositOrder = async (req, res) => {
  const { agreementId } = req.body;

  if (!agreementId) {
    return res.status(400).json({ message: "agreementId is required." });
  }

  try {
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { id: agreementId },
      include: { post: true },
    });

    if (!agreement) return res.status(404).json({ message: "Agreement not found." });
    if (agreement.renterId !== req.userId) return res.status(403).json({ message: "Not authorized." });
    if (!["PENDING_DEPOSIT", "ACTIVE"].includes(agreement.status)) {
      return res.status(400).json({ message: "Agreement is not payable." });
    }

    const order = await createOrderForPayment({
      amount: agreement.depositAmount,
      receipt: `deposit_${agreement.id}`,
    });

    const payment = await prisma.payment.create({
      data: {
        agreementId: agreement.id,
        payerId: req.userId,
        receiverId: agreement.ownerId,
        purpose: "DEPOSIT",
        amount: agreement.depositAmount,
        status: "CREATED",
        razorpayOrderId: order.id,
      },
    });

    return res.status(201).json({ payment, order, key: process.env.RAZORPAY_KEY_ID || "mock_key" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to create deposit order." });
  }
};

export const verifyDepositPayment = async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!paymentId) return res.status(400).json({ message: "paymentId is required." });

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { agreement: true },
    });

    if (!payment) return res.status(404).json({ message: "Payment not found." });
    if (payment.payerId !== req.userId) return res.status(403).json({ message: "Not authorized." });

    if (payment.status === "SUCCESS") return res.status(200).json(payment);

    const isMockOrder = payment.razorpayOrderId?.startsWith("mock_order_");

    if (!isMockOrder && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Invalid payment signature." });
      }
    }

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          razorpayPaymentId: razorpayPaymentId || null,
          razorpaySignature: razorpaySignature || null,
        },
      }),
      prisma.rentalAgreement.update({
        where: { id: payment.agreementId },
        data: { status: "ACTIVE" },
      }),
      prisma.notification.createMany({
        data: [
          {
            userId: payment.receiverId,
            type: "DEPOSIT_PAID",
            title: "Deposit received",
            message: "Tenant has paid the advance deposit.",
          },
          {
            userId: payment.payerId,
            type: "DEPOSIT_CONFIRMED",
            title: "Deposit confirmed",
            message: "Your deposit payment was verified successfully.",
          },
        ],
      }),
    ]);

    return res.status(200).json(updatedPayment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to verify deposit payment." });
  }
};

export const createMonthlyRentOrder = async (req, res) => {
  const { agreementId, billingMonth } = req.body;

  if (!agreementId) return res.status(400).json({ message: "agreementId is required." });

  try {
    const agreement = await prisma.rentalAgreement.findUnique({ where: { id: agreementId } });
    if (!agreement) return res.status(404).json({ message: "Agreement not found." });
    if (agreement.renterId !== req.userId) return res.status(403).json({ message: "Not authorized." });
    if (agreement.status !== "ACTIVE") return res.status(400).json({ message: "Agreement is not active." });

    const month = billingMonth || new Date().toISOString().slice(0, 7);

    const existing = await prisma.payment.findFirst({
      where: {
        agreementId,
        purpose: "RENT",
        billingMonth: month,
        status: "SUCCESS",
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Rent already paid for this month." });
    }

    const order = await createOrderForPayment({
      amount: agreement.monthlyRentAmount,
      receipt: `rent_${agreement.id}_${month}`,
    });

    const payment = await prisma.payment.create({
      data: {
        agreementId,
        payerId: req.userId,
        receiverId: agreement.ownerId,
        purpose: "RENT",
        amount: agreement.monthlyRentAmount,
        billingMonth: month,
        status: "CREATED",
        razorpayOrderId: order.id,
      },
    });

    return res.status(201).json({ payment, order, key: process.env.RAZORPAY_KEY_ID || "mock_key" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to create rent payment order." });
  }
};

export const verifyMonthlyRentPayment = async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!paymentId) return res.status(400).json({ message: "paymentId is required." });

  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ message: "Payment not found." });
    if (payment.payerId !== req.userId) return res.status(403).json({ message: "Not authorized." });

    if (payment.status === "SUCCESS") return res.status(200).json(payment);

    const isMockOrder = payment.razorpayOrderId?.startsWith("mock_order_");

    if (!isMockOrder && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Invalid payment signature." });
      }
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        razorpayPaymentId: razorpayPaymentId || null,
        razorpaySignature: razorpaySignature || null,
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: payment.receiverId,
          type: "RENT_PAID",
          title: "Monthly rent received",
          message: `Rent payment received for ${payment.billingMonth}.`,
        },
        {
          userId: payment.payerId,
          type: "RENT_CONFIRMED",
          title: "Monthly rent paid",
          message: `Rent payment confirmed for ${payment.billingMonth}.`,
        },
      ],
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to verify rent payment." });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ payerId: req.userId }, { receiverId: req.userId }],
      },
      include: {
        agreement: {
          include: {
            post: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(payments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch payments." });
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

export const markNotificationRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

    if (!notification || notification.userId !== req.userId) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update notification." });
  }
};
