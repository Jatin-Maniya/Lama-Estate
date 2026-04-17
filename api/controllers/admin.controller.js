import prisma from "../lib/prisma.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      totalPosts,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
      pendingQueue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.post.count({ where: { status: "APPROVED" } }),
      prisma.post.count({ where: { status: "REJECTED" } }),
      prisma.post.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isBlocked: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        blockedUsers,
        totalPosts,
        pendingPosts,
        approvedPosts,
        rejectedPosts,
      },
      pendingQueue,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to load admin dashboard." });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const toggleUserBlock = async (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  if (typeof isBlocked !== "boolean") {
    return res.status(400).json({ message: "isBlocked must be a boolean." });
  }

  if (id === req.userId) {
    return res.status(400).json({ message: "Admin cannot block own account." });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        username: true,
        email: true,
        isBlocked: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update user status." });
  }
};

export const getPendingPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        postDetail: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch pending posts." });
  }
};

export const getAdminPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        postDetail: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch properties." });
  }
};

export const getAdminPostById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Property id is required." });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isBlocked: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Property not found." });
    }

    return res.status(200).json(post);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch property." });
  }
};

export const reviewPost = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ message: "action must be accept or reject." });
  }

  try {
    const updated = await prisma.post.update({
      where: { id },
      data: {
        status: action === "accept" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedById: req.userId,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to review post." });
  }
};

export const deleteAdminPost = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Invalid property id." });
  }

  try {
    await prisma.savedPost.deleteMany({ where: { postId: id } });
    await prisma.postDetail.deleteMany({ where: { postId: id } });

    const deletedPost = await prisma.post.deleteMany({ where: { id } });

    if (!deletedPost.count) {
      return res.status(404).json({ message: "Property not found." });
    }

    return res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    console.log("deleteAdminPost error:", error);

    if (error?.code === "P2023") {
      return res.status(400).json({ message: "Invalid property id." });
    }

    return res.status(500).json({ message: "Failed to delete property." });
  }
};
