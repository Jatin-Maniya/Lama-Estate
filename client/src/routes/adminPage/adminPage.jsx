import { useContext, useEffect, useMemo, useState } from "react";
import apiRequest from "../../lib/apiRequest";
import { AuthContext } from "../../context/AuthContext";
import "./adminPage.scss";
import { formatINR } from "../../lib/currency";

const adminSections = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "approvals", label: "Approvals", icon: "approve" },
  { key: "users", label: "Users", icon: "users" },
  { key: "properties", label: "Properties", icon: "property" },
  { key: "reports", label: "Reports", icon: "reports" },
  { key: "profile", label: "Admin Profile", icon: "profile" },
];

function AdminIcon({ type }) {
  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13.5h8v7.5H3v-7.5zm10-10h8v17.5h-8V3.5zM3 3.5h8V11H3V3.5z" />
      </svg>
    );
  }

  if (type === "approve") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l7.2 3v6.8c0 4.6-2.9 8.9-7.2 10.2-4.3-1.3-7.2-5.6-7.2-10.2V5L12 2zm-1 13.2l5.1-5.1-1.4-1.4-3.7 3.7-1.9-1.9-1.4 1.4 3.3 3.3z" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 11c1.9 0 3.5-1.6 3.5-3.5S17.9 4 16 4s-3.5 1.6-3.5 3.5S14.1 11 16 11zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm8 2c-2.3 0-7 1.2-7 3.5V20h14v-3.5c0-2.3-4.7-3.5-7-3.5zM8 13c-2.7 0-8 1.3-8 4v3h7v-3.5c0-1.3.7-2.4 2.2-3.2-.4-.2-.8-.3-1.2-.3z" />
      </svg>
    );
  }

  if (type === "property") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9 7v11h-6v-6H9v6H3V10l9-7zm0 2.5L5 11v8h2v-6h10v6h2v-8l-7-5.5z" />
      </svg>
    );
  }

  if (type === "reports") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3h16v18H4V3zm2 2v14h12V5H6zm2 10h2v2H8v-2zm3-4h2v6h-2v-6zm3-3h2v9h-2V8z" />
      </svg>
    );
  }

  if (type === "content") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16v3H4V4zm0 5h10v3H4V9zm0 5h16v3H4v-3z" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.1 12.9c.1-.3.1-.6.1-.9s0-.6-.1-.9l2.1-1.6-2-3.4-2.5 1a6.9 6.9 0 00-1.6-.9l-.4-2.7h-4l-.4 2.7c-.6.2-1.1.5-1.6.9l-2.5-1-2 3.4 2.1 1.6c-.1.3-.1.6-.1.9s0 .6.1.9L2.2 14.5l2 3.4 2.5-1c.5.4 1 .7 1.6.9l.4 2.7h4l.4-2.7c.6-.2 1.1-.5 1.6-.9l2.5 1 2-3.4-2.1-1.6zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
    </svg>
  );
}

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatPrice = (value) => {
  if (typeof value !== "number") return "-";
  return formatINR(value)
};

function PropertyMetaIcon({ type }) {
  if (type === "owner") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
      </svg>
    );
  }

  if (type === "location") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
      </svg>
    );
  }

  if (type === "category") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm7 0h11v8H10v-8z" />
      </svg>
    );
  }

  if (type === "beds") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10h18v9h-2v-2H5v2H3v-9zm4-4h5v3H7V6zm7 0h3a3 3 0 013 3v1h-6V6z" />
      </svg>
    );
  }

  if (type === "baths") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h4v2H9v5h11v2H4v-2h3V4zm-1 11h12a5 5 0 01-10 0h-2a7 7 0 0014 0h-2a5 5 0 01-12 0z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h10v2H7V2zm-2 4h14v16H5V6zm2 2v12h10V8H7z" />
    </svg>
  );
}

const matchesDateRange = (createdAt, filter) => {
  if (filter === "all") return true;
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const days = filter === "7d" ? 7 : 30;
  const diff = now - created;

  return diff <= days * 24 * 60 * 60 * 1000;
};

function AdminPage() {
  const { currentUser } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalType, setApprovalType] = useState("all");
  const [approvalDate, setApprovalDate] = useState("all");

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const [propertySearch, setPropertySearch] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("all");
  const [propertyCategory, setPropertyCategory] = useState("all");

  const [contentConfig, setContentConfig] = useState({
    showFeatured: true,
    autoApprove: false,
    enableReports: true,
  });

  const [settings, setSettings] = useState({
    timezone: "UTC",
    moderationLevel: "strict",
    emailAlerts: true,
    dailySummary: true,
  });

  const stats = dashboard?.stats || {
    totalUsers: 0,
    blockedUsers: 0,
    totalPosts: 0,
    pendingPosts: 0,
    approvedPosts: 0,
    rejectedPosts: 0,
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardRes, pendingRes, postsRes, usersRes] = await Promise.all([
        apiRequest.get("/admin/dashboard"),
        apiRequest.get("/admin/posts/pending"),
        apiRequest.get("/admin/posts"),
        apiRequest.get("/admin/users"),   
      ]);

      setDashboard(dashboardRes.data);
      setPendingPosts(pendingRes.data || []);
      setAllPosts(postsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeSection]);

  const reviewPost = async (postId, action) => {
    const key = `review-${postId}-${action}`;
    setBusyKey(key);

    try {
      await apiRequest.put(`/admin/posts/${postId}/review`, { action });
      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, status: action === "accept" ? "APPROVED" : "REJECTED" }
            : post
        )
      );
      setDashboard((prev) => {
        if (!prev?.stats) return prev;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            pendingPosts: Math.max(0, prev.stats.pendingPosts - 1),
            approvedPosts:
              action === "accept"
                ? prev.stats.approvedPosts + 1
                : prev.stats.approvedPosts,
            rejectedPosts:
              action === "reject"
                ? prev.stats.rejectedPosts + 1
                : prev.stats.rejectedPosts,
          },
        };
      });
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || "Failed to review post.");
    } finally {
      setBusyKey("");
    }
  };

  const toggleBlock = async (userId, isBlocked) => {
    const key = `block-${userId}`;
    setBusyKey(key);

    try {
      await apiRequest.put(`/admin/users/${userId}/block`, { isBlocked });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isBlocked } : user
        )
      );

      setSelectedUser((prev) =>
        prev?.id === userId ? { ...prev, isBlocked } : prev
      );

      setDashboard((prev) => {
        if (!prev?.stats) return prev;

        const wasBlocked = users.find((u) => u.id === userId)?.isBlocked;
        const delta = isBlocked === wasBlocked ? 0 : isBlocked ? 1 : -1;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            blockedUsers: Math.max(0, prev.stats.blockedUsers + delta),
          },
        };
      });
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setBusyKey("");
    }
  };

  const removePropertyFromList = async (postId) => {
    const key = `delete-${postId}`;
    setBusyKey(key);

    try {
      try {
        await apiRequest.delete(`/admin/posts/${postId}`);
      } catch (deleteError) {
        const status = deleteError?.response?.status;

        if (status === 404 || status === 405) {
          await apiRequest.post(`/admin/posts/${postId}/delete`);
        } else {
          throw deleteError;
        }
      }

      const removedPost = allPosts.find((post) => post.id === postId);
      setPendingPosts((prev) => prev.filter((post) => post.id !== postId));
      setAllPosts((prev) => prev.filter((post) => post.id !== postId));
      setError("");

      setDashboard((prev) => {
        if (!prev?.stats) return prev;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalPosts: Math.max(0, prev.stats.totalPosts - 1),
            pendingPosts:
              removedPost?.status === "PENDING"
                ? Math.max(0, prev.stats.pendingPosts - 1)
                : prev.stats.pendingPosts,
          },
        };
      });
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || "Failed to delete property.");
    } finally {
      setBusyKey("");
    }
  };

  const approvalRows = useMemo(() => {
    return pendingPosts.filter((post) => {
      const matchesSearch =
        `${post.title} ${post.city} ${post.user?.username || ""}`
          .toLowerCase()
          .includes(approvalSearch.toLowerCase());

      const matchesType = approvalType === "all" || post.type === approvalType;
      const matchesDate = matchesDateRange(post.createdAt, approvalDate);

      return matchesSearch && matchesType && matchesDate;
    });
  }, [pendingPosts, approvalSearch, approvalType, approvalDate]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = `${user.username} ${user.email}`
        .toLowerCase()
        .includes(userSearch.toLowerCase());

      const role = user.isAdmin ? "admin" : "user";
      const status = user.isBlocked ? "blocked" : "active";

      const matchesRole = userRoleFilter === "all" || role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "all" || status === userStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const propertyRows = useMemo(() => {
    return allPosts
      .map((post) => ({
        ...post,
        flagged: (post.images?.length || 0) === 0 || post.price > 10000000,
      }))
      .filter((post) => {
        const matchesSearch = `${post.title} ${post.city}`
          .toLowerCase()
          .includes(propertySearch.toLowerCase());

        const matchesStatus =
          propertyStatus === "all" || post.status === propertyStatus;

        const matchesCategory =
          propertyCategory === "all" || post.property === propertyCategory;

        return matchesSearch && matchesStatus && matchesCategory;
      });
  }, [allPosts, propertySearch, propertyStatus, propertyCategory]);

  const recentActivity = useMemo(() => {
    const blocked = users.filter((user) => user.isBlocked).slice(0, 3);
    const pending = pendingPosts.slice(0, 4);

    const blockedItems = blocked.map((user) => ({
      id: `user-${user.id}`,
      label: `${user.username} account is blocked`,
      date: formatDate(user.createdAt),
      kind: "user",
    }));

    const pendingItems = pending.map((post) => ({
      id: `post-${post.id}`,
      label: `${post.title} is pending approval`,
      date: formatDate(post.createdAt),
      kind: "property",
    }));

    return [...pendingItems, ...blockedItems];
  }, [users, pendingPosts]);

  const approvalPercent =
    stats.totalPosts > 0
      ? Math.round((stats.approvedPosts / stats.totalPosts) * 100)
      : 0;

  const rejectionPercent =
    stats.totalPosts > 0
      ? Math.round((stats.rejectedPosts / stats.totalPosts) * 100)
      : 0;

  const pendingPercent =
    stats.totalPosts > 0
      ? Math.round((stats.pendingPosts / stats.totalPosts) * 100)
      : 0;

  const sectionBadges = {
    approvals: stats.pendingPosts,
    users: stats.totalUsers,
    properties: stats.totalPosts,
    reports: recentActivity.length,
  };

  const renderDashboard = () => (
    <>
      <section className="statsGrid">
        <article className="statCard">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
          <span>Accounts on platform</span>
        </article>
        <article className="statCard">
          <h3>Total Properties</h3>
          <p>{stats.totalPosts}</p>
          <span>Published and pending</span>
        </article>
        <article className="statCard">
          <h3>Pending Approvals</h3>
          <p>{stats.pendingPosts}</p>
          <span>Waiting for review</span>
        </article>
        <article className="statCard">
          <h3>Blocked Users</h3>
          <p>{stats.blockedUsers}</p>
          <span>Restricted accounts</span>
        </article>
      </section>

      <section className="panel chartPanel">
        <div className="panelTitle">
          <h2>Moderation Distribution</h2>
          <span>Live overview</span>
        </div>

        <div className="chartBars" role="img" aria-label="Moderation status chart">
          <div className="barRow">
            <label>Approved</label>
            <div className="barTrack"><span style={{ width: `${approvalPercent}%` }} /></div>
            <strong>{approvalPercent}%</strong>
          </div>
          <div className="barRow">
            <label>Rejected</label>
            <div className="barTrack rejected"><span style={{ width: `${rejectionPercent}%` }} /></div>
            <strong>{rejectionPercent}%</strong>
          </div>
          <div className="barRow">
            <label>Pending</label>
            <div className="barTrack pending"><span style={{ width: `${pendingPercent}%` }} /></div>
            <strong>{pendingPercent}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelTitle">
          <h2>Recent Activity</h2>
          <span>{recentActivity.length} items</span>
        </div>

        {!recentActivity.length ? (
          <p className="empty">No recent activity found.</p>
        ) : (
          <div className="activityList">
            {recentActivity.map((item) => (
              <article key={item.id} className="activityItem">
                <div className={`activityDot ${item.kind}`} />
                <div>
                  <p>{item.label}</p>
                  <span>{item.date}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const renderApprovals = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>Approval Management</h2>
        <span>{approvalRows.length} results</span>
      </div>

      <div className="filters">
        <input
          value={approvalSearch}
          onChange={(e) => setApprovalSearch(e.target.value)}
          placeholder="Search by title, city, owner"
        />
        <select value={approvalType} onChange={(e) => setApprovalType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="buy">Buy</option>
          <option value="rent">Rent</option>
        </select>
        <select value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)}>
          <option value="all">All Dates</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {approvalRows.length === 0 ? (
        <p className="empty">No pending approvals matched your filters.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Type</th>
                <th>City</th>
                <th>Price</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvalRows.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.user?.username || "Unknown"}</td>
                  <td>{post.type}</td>
                  <td>{post.city}</td>
                  <td>{formatINR(post.price)}</td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      disabled={busyKey.startsWith(`review-${post.id}`)}
                      onClick={() => reviewPost(post.id, "accept")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="reject"
                      disabled={busyKey.startsWith(`review-${post.id}`)}
                      onClick={() => reviewPost(post.id, "reject")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderUsers = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>User Management</h2>
        <span>{filteredUsers.length} users</span>
      </div>

      <div className="filters">
        <input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search users by name or email"
        />
        <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="empty">No users matched your filters.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Properties</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`pill ${user.isAdmin ? "admin" : "user"}`}>
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${user.isBlocked ? "blocked" : "active"}`}>
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td>{user._count?.posts ?? 0}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="actions">
                    <button type="button" className="ghost" onClick={() => setSelectedUser(user)}>
                      View
                    </button>
                    <button
                      type="button"
                      className={user.isBlocked ? "accept" : "reject"}
                      disabled={busyKey === `block-${user.id}` || user.isAdmin}
                      onClick={() => toggleBlock(user.id, !user.isBlocked)}
                    >
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderProperties = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>Property Management</h2>
        <span>{propertyRows.length} properties</span>
      </div>

      <div className="filters">
        <input
          value={propertySearch}
          onChange={(e) => setPropertySearch(e.target.value)}
          placeholder="Search properties by title or city"
        />
        <select value={propertyCategory} onChange={(e) => setPropertyCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="condo">Condo</option>
          <option value="land">Land</option>
        </select>
        <select value={propertyStatus} onChange={(e) => setPropertyStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {propertyRows.length === 0 ? (
        <p className="empty">No properties matched your filters.</p>
      ) : (
        <div className="propertyGrid">
          {propertyRows.map((post) => (
            <article key={post.id} className="propertyCard">
              <div className="propertyImageWrap">
                <img
                  src={post.images?.[0] || "/bg.png"}
                  alt={post.title}
                  loading="lazy"
                />
                <span className={`pill status ${post.status.toLowerCase()}`}>
                  {post.status}
                </span>
                <span className="imageCount">
                  {post.images?.length || 0} photos
                </span>
              </div>

              <div className="propertyBody">
                <h3>{post.title}</h3>

                <div className="listedBy">
                  <img
                    src={post.user?.avatar || "/noavatar.jpg"}
                    alt={`${post.user?.username || "User"} avatar`}
                  />
                  <div>
                    <label>Listed by</label>
                    <p>{post.user?.username || "Unknown User"}</p>
                  </div>
                </div>

                <div className="propertyMetaGrid">
                  <div className="metaItem">
                    <span className="metaIcon"><PropertyMetaIcon type="location" /></span>
                    <div>
                      <label>Location</label>
                      <p>{post.city || "-"}</p>
                    </div>
                  </div>

                  <div className="metaItem">
                    <span className="metaIcon"><PropertyMetaIcon type="category" /></span>
                    <div>
                      <label>Category</label>
                      <p>{post.property || "-"}</p>
                    </div>
                  </div>

                  <div className="metaItem">
                    <span className="metaIcon"><PropertyMetaIcon type="beds" /></span>
                    <div>
                      <label>Beds</label>
                      <p>{post.bedroom ?? "-"}</p>
                    </div>
                  </div>

                  <div className="metaItem">
                    <span className="metaIcon"><PropertyMetaIcon type="baths" /></span>
                    <div>
                      <label>Baths</label>
                      <p>{post.bathroom ?? "-"}</p>
                    </div>
                  </div>

                  <div className="metaItem">
                    <span className="metaIcon"><PropertyMetaIcon type="date" /></span>
                    <div>
                      <label>Created</label>
                      <p>{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="metaChips">
                  <span className={`pill ${post.flagged ? "blocked" : "active"}`}>
                    {post.flagged ? "Flagged" : "Clean"}
                  </span>
                  <span className="pill user">{post.type || "-"}</span>
                </div>

                <div className="propertyFooter">
                  <strong>{formatPrice(post.price)}</strong>
                  <span>ID: {post.id?.slice(-6) || "-"}</span>
                </div>

                <div className="propertyActions">
                  <button
                    type="button"
                    className="publishBtn"
                    disabled={
                      post.status !== "PENDING" ||
                      busyKey.startsWith(`review-${post.id}`) ||
                      busyKey === `delete-${post.id}`
                    }
                    onClick={() => reviewPost(post.id, "accept")}
                  >
                    {post.status === "PENDING" ? "Publish Now" : "Published"}
                  </button>
                  <button
                    type="button"
                    className="removeBtn"
                    disabled={busyKey === `delete-${post.id}`}
                    onClick={() => removePropertyFromList(post.id)}
                  >
                    {busyKey === `delete-${post.id}` ? "Removing..." : "Remove Listing"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderReports = () => (
    <>
      <section className="statsGrid">
        <article className="statCard">
          <h3>Approval Rate</h3>
          <p>{approvalPercent}%</p>
          <span>Based on total properties</span>
        </article>
        <article className="statCard">
          <h3>Rejection Rate</h3>
          <p>{rejectionPercent}%</p>
          <span>Moderation outcomes</span>
        </article>
        <article className="statCard">
          <h3>Pending Risk</h3>
          <p>{pendingPercent}%</p>
          <span>Requires admin action</span>
        </article>
      </section>

      <section className="panel chartPanel">
        <div className="panelTitle">
          <h2>Analytics Insights</h2>
          <span>Trend snapshots</span>
        </div>
        <div className="insightCards">
          <article>
            <h4>User Growth</h4>
            <p>New user inflow appears stable with healthy account activity.</p>
          </article>
          <article>
            <h4>Content Quality</h4>
            <p>Pending queue remains controlled with balanced approval outcomes.</p>
          </article>
          <article>
            <h4>Risk Signals</h4>
            <p>Flagged and blocked entities remain within acceptable limits.</p>
          </article>
        </div>
      </section>
    </>
  );

  const renderContent = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>Content Management</h2>
        <span>Platform controls</span>
      </div>

      <div className="toggleGrid">
        <label>
          <span>Show Featured Properties</span>
          <input
            type="checkbox"
            checked={contentConfig.showFeatured}
            onChange={(e) =>
              setContentConfig((prev) => ({ ...prev, showFeatured: e.target.checked }))
            }
          />
        </label>

        <label>
          <span>Auto Approve Trusted Listings</span>
          <input
            type="checkbox"
            checked={contentConfig.autoApprove}
            onChange={(e) =>
              setContentConfig((prev) => ({ ...prev, autoApprove: e.target.checked }))
            }
          />
        </label>

        <label>
          <span>Enable Reported Content Queue</span>
          <input
            type="checkbox"
            checked={contentConfig.enableReports}
            onChange={(e) =>
              setContentConfig((prev) => ({ ...prev, enableReports: e.target.checked }))
            }
          />
        </label>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>Admin Settings</h2>
        <span>Operational preferences</span>
      </div>

      <div className="settingsForm">
        <label>
          Timezone
          <select
            value={settings.timezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </label>

        <label>
          Moderation Level
          <select
            value={settings.moderationLevel}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, moderationLevel: e.target.value }))
            }
          >
            <option value="strict">Strict</option>
            <option value="balanced">Balanced</option>
            <option value="lenient">Lenient</option>
          </select>
        </label>

        <label className="checkLine">
          <input
            type="checkbox"
            checked={settings.emailAlerts}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, emailAlerts: e.target.checked }))
            }
          />
          Email alerts for critical events
        </label>

        <label className="checkLine">
          <input
            type="checkbox"
            checked={settings.dailySummary}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, dailySummary: e.target.checked }))
            }
          />
          Daily moderation summary report
        </label>

        <button type="button" className="saveBtn">Save Settings</button>
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="panel">
      <div className="panelTitle">
        <h2>Admin Profile</h2>
      </div>

      <div className="adminProfileCard">
        <img src={currentUser?.avatar || "/noavatar.jpg"} alt="Admin avatar" />
        <div>
          <h3>{currentUser?.username || "Admin"}</h3>
          <p>{currentUser?.email || "-"}</p>
          <span>{currentUser?.isAdmin ? "Administrator" : "Moderator"}</span>
        </div>
      </div>
    </section>
  );

  const renderSectionContent = () => {
    if (activeSection === "dashboard") return renderDashboard();
    if (activeSection === "approvals") return renderApprovals();
    if (activeSection === "users") return renderUsers();
    if (activeSection === "properties") return renderProperties();
    if (activeSection === "reports") return renderReports();
    return renderProfile();
  };

  if (loading) {
    return (
      <div className="adminWorkspace loadingState">
        <p>Loading admin workspace...</p>
      </div>
    );
  }

  return (
    <div className="adminWorkspace">
      <button
        type="button"
        className="sidebarToggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        {sidebarOpen ? "Close" : "Menu"}
      </button>

      <aside className={sidebarOpen ? "adminSidebar active" : "adminSidebar"}>
        <div className="brand">
          <h2>Admin Console</h2>
          <p>Moderation and operations</p>
        </div>

        <div className="quickMeta">
          <article>
            <span>Pending</span>
            <strong>{stats.pendingPosts}</strong>
          </article>
          <article>
            <span>Users</span>
            <strong>{stats.totalUsers}</strong>
          </article>
        </div>

        <nav>
          {adminSections.map((section) => (
            <button
              type="button"
              key={section.key}
              className={activeSection === section.key ? "navItem active" : "navItem"}
              onClick={() => setActiveSection(section.key)}
            >
              <span className="iconBox"><AdminIcon type={section.icon} /></span>
              <span>{section.label}</span>
              {sectionBadges[section.key] ? (
                <em className="navBadge">
                  {sectionBadges[section.key] > 99 ? "99+" : sectionBadges[section.key]}
                </em>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <p>Theme</p>
          <strong>Premium Ocean</strong>
        </div>
      </aside>

      <main className="adminMain">
        <header className="pageHeader">
          <div>
            <h1>{adminSections.find((s) => s.key === activeSection)?.label}</h1>
            <p>Scalable, responsive and action-ready admin workspace.</p>
          </div>
          <button type="button" onClick={loadAdminData}>Refresh Data</button>
        </header>

        {error && <div className="errorBanner">{error}</div>}

        {renderSectionContent()}
      </main>

      {selectedUser && (
        <div className="modalBackdrop" onClick={() => setSelectedUser(null)}>
          <article className="userModal" onClick={(e) => e.stopPropagation()}>
            <h3>User Details</h3>
            <p><strong>Name:</strong> {selectedUser.username}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Role:</strong> {selectedUser.isAdmin ? "Admin" : "User"}</p>
            <p><strong>Status:</strong> {selectedUser.isBlocked ? "Blocked" : "Active"}</p>
            <p><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
            <p><strong>Total Properties:</strong> {selectedUser._count?.posts ?? 0}</p>
            <div className="modalActions">
              <button type="button" onClick={() => setSelectedUser(null)} className="ghost">Close</button>
              <button
                type="button"
                className={selectedUser.isBlocked ? "accept" : "reject"}
                disabled={busyKey === `block-${selectedUser.id}` || selectedUser.isAdmin}
                onClick={() => toggleBlock(selectedUser.id, !selectedUser.isBlocked)}
              >
                {selectedUser.isBlocked ? "Unblock User" : "Block User"}
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
