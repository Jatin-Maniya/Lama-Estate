import prisma from "../lib/prisma.js";

const now = () => new Date();

export const completeExpiredRentals = async () => {
  const today = now();

  const expiredAgreements = await prisma.rentalAgreement.findMany({
    where: {
      status: "ACTIVE",
      expectedEndDate: { lt: today },
    },
    include: {
      post: true,
    },
  });

  for (const agreement of expiredAgreements) {
    await prisma.$transaction([
      prisma.rentalAgreement.update({
        where: { id: agreement.id },
        data: { status: "ENDED" },
      }),
      prisma.post.update({
        where: { id: agreement.postId },
        data: {
          rentalStatus: "AVAILABLE",
          rentalLocked: false,
          activeRenterId: null,
          rentStartDate: null,
          rentEndDate: null,
        },
      }),
      prisma.notification.createMany({
        data: [
          {
            userId: agreement.ownerId,
            type: "RENTAL_COMPLETED",
            title: "Rental agreement completed",
            message: `Rental agreement for ${agreement.post.title} has ended. Property is available again.`,
          },
          {
            userId: agreement.renterId,
            type: "RENTAL_COMPLETED",
            title: "Rental period completed",
            message: `Your rental period for ${agreement.post.title} has completed.`,
          },
        ],
      }),
    ]);
  }

  return expiredAgreements.length;
};

export const createMonthlyRentReminders = async () => {
  const activeAgreements = await prisma.rentalAgreement.findMany({
    where: { status: "ACTIVE" },
    include: { post: true },
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  let reminderCount = 0;

  for (const agreement of activeAgreements) {
    const alreadyPaid = await prisma.payment.findFirst({
      where: {
        agreementId: agreement.id,
        purpose: "RENT",
        billingMonth: currentMonth,
        status: "SUCCESS",
      },
    });

    if (alreadyPaid) continue;

    const existingReminder = await prisma.notification.findFirst({
      where: {
        userId: agreement.renterId,
        type: "RENT_DUE",
        message: {
          contains: currentMonth,
        },
      },
    });

    if (existingReminder) continue;

    await prisma.notification.createMany({
      data: [
        {
          userId: agreement.renterId,
          type: "RENT_DUE",
          title: "Monthly rent due",
          message: `Rent for ${currentMonth} is pending for ${agreement.post.title}.`,
        },
        {
          userId: agreement.ownerId,
          type: "RENT_DUE",
          title: "Rent reminder sent",
          message: `Reminder sent to renter for ${currentMonth} rent of ${agreement.post.title}.`,
        },
      ],
    });

    reminderCount += 1;
  }

  return reminderCount;
};

export const runRentalLifecycleJobs = async () => {
  const [expiredCount, reminderCount] = await Promise.all([
    completeExpiredRentals(),
    createMonthlyRentReminders(),
  ]);

  return { expiredCount, reminderCount };
};
