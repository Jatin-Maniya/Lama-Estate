import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

const ADMIN_EMAIL = "seed-admin@estate.local";

const sampleUsers = [
  {
    email: "seed-user1@estate.local",
    username: "seeduser1",
    password: "SeedUser@123",
    isBlocked: false,
  },
  {
    email: "seed-user2@estate.local",
    username: "seeduser2",
    password: "SeedUser@123",
    isBlocked: false,
  },
  {
    email: "seed-blocked@estate.local",
    username: "seedblocked",
    password: "SeedUser@123",
    isBlocked: true,
  },
];

const createPostPayload = (userId, overrides = {}) => ({
  title: "Sample Property",
  price: 1200,
  images: [
    "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1280",
  ],
  address: "12 Seed Street",
  city: "London",
  bedroom: 2,
  bathroom: 1,
  latitude: "51.5074",
  longitude: "-0.1278",
  type: "rent",
  property: "apartment",
  status: "PENDING",
  userId,
  ...overrides,
});

async function seed() {
  console.log("Starting admin panel seed...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      isAdmin: true,
      isBlocked: false,
      password: adminPassword,
      username: "seedadmin",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    create: {
      email: ADMIN_EMAIL,
      username: "seedadmin",
      password: adminPassword,
      avatar: "https://i.pravatar.cc/150?img=12",
      isAdmin: true,
      isBlocked: false,
      chatIDs: [],
    },
  });

  const createdUsers = [];

  for (const user of sampleUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        password: hashedPassword,
        isAdmin: false,
        isBlocked: user.isBlocked,
      },
      create: {
        email: user.email,
        username: user.username,
        password: hashedPassword,
        isAdmin: false,
        isBlocked: user.isBlocked,
        chatIDs: [],
      },
    });

    createdUsers.push(created);
  }

  const sampleUserIds = createdUsers.map((u) => u.id);

  await prisma.savedPost.deleteMany({
    where: {
      post: {
        userId: { in: sampleUserIds },
      },
    },
  });

  await prisma.postDetail.deleteMany({
    where: {
      post: {
        userId: { in: sampleUserIds },
      },
    },
  });

  await prisma.post.deleteMany({
    where: {
      userId: { in: sampleUserIds },
    },
  });

  const [user1, user2, blocked] = createdUsers;

  const pendingPost = await prisma.post.create({
    data: {
      ...createPostPayload(user1.id, {
        title: "Pending Approval Apartment",
        status: "PENDING",
        city: "Manchester",
      }),
      postDetail: {
        create: {
          desc: "Pending property created for admin review flow testing.",
          utilities: "tenant",
          pet: "allowed",
          income: "3x monthly rent",
          size: 920,
          school: 400,
          bus: 150,
          restaurant: 500,
        },
      },
    },
  });

  const approvedPost = await prisma.post.create({
    data: {
      ...createPostPayload(user2.id, {
        title: "Approved Sample Condo",
        status: "APPROVED",
        property: "condo",
        type: "buy",
        price: 245000,
        city: "Birmingham",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      }),
      postDetail: {
        create: {
          desc: "Approved listing visible in explore page.",
          utilities: "owner",
          pet: "not-allowed",
          income: "Employment verification required",
          size: 1340,
          school: 850,
          bus: 220,
          restaurant: 340,
        },
      },
    },
  });

  const rejectedPost = await prisma.post.create({
    data: {
      ...createPostPayload(user1.id, {
        title: "Rejected Listing Example",
        status: "REJECTED",
        city: "Leeds",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      }),
      postDetail: {
        create: {
          desc: "Rejected listing for moderation testing.",
          utilities: "shared",
          pet: "allowed",
          income: "No policy",
          size: 780,
          school: 600,
          bus: 180,
          restaurant: 200,
        },
      },
    },
  });

  const blockedApprovedPost = await prisma.post.create({
    data: {
      ...createPostPayload(blocked.id, {
        title: "Blocked User Approved Listing",
        status: "APPROVED",
        city: "Liverpool",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      }),
      postDetail: {
        create: {
          desc: "This stays hidden because the owner is blocked.",
          utilities: "tenant",
          pet: "not-allowed",
          income: "2x monthly rent",
          size: 640,
          school: 300,
          bus: 200,
          restaurant: 150,
        },
      },
    },
  });

  console.log("Seed complete.");
  console.log("Admin credentials: seed-admin@estate.local / Admin@123");
  console.log("Sample user credentials: seed-user1@estate.local / SeedUser@123");
  console.log("Created posts:", {
    pendingPost: pendingPost.id,
    approvedPost: approvedPost.id,
    rejectedPost: rejectedPost.id,
    blockedApprovedPost: blockedApprovedPost.id,
  });
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
