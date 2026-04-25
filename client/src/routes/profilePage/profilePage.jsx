import { Await, Link, useLoaderData, useNavigate, useSearchParams } from "react-router-dom"
import Chat from "../../components/chat/Chat"
import List from "../../components/list/List"
import apiRequest from "../../lib/apiRequest"
import "./profilePage.scss"
import { Suspense, useContext, useEffect, useState } from "react"
import {AuthContext} from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js"

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }

        const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(true), { once: true })
            existingScript.addEventListener("error", () => resolve(false), { once: true })
            return
        }

        const script = document.createElement("script")
        script.src = RAZORPAY_SCRIPT_URL
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })

const openRazorpayCheckout = (options) =>
    new Promise((resolve, reject) => {
        if (!window.Razorpay) {
            reject(new Error("Razorpay SDK not loaded."))
            return
        }

        const userHandler = options?.handler

        const checkout = new window.Razorpay({
            ...options,
            handler: async (response) => {
                try {
                    if (typeof userHandler === "function") {
                        await userHandler(response)
                    }
                    resolve(response)
                } catch (error) {
                    reject(error)
                }
            },
            modal: {
                ondismiss: () => reject(new Error("Payment was cancelled.")),
            },
        })

        checkout.on("payment.failed", (response) => {
            const failureMessage = response?.error?.description || "Payment failed."
            reject(new Error(failureMessage))
        })

        checkout.open()
    })

function ProfilePage() {
    const data = useLoaderData();
    const [searchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat") || "";

    const{updateUser,currentUser} = useContext(AuthContext)
    const [deletingId, setDeletingId] = useState("")
    const [rentalState, setRentalState] = useState({
        ownerApplications: [],
        myApplications: [],
        ownerAgreements: [],
        renterAgreements: [],
        myPayments: [],
        notifications: [],
    })
    const [rentalLoading, setRentalLoading] = useState(false)
    const [rentalActionLoading, setRentalActionLoading] = useState("")
    const [rentalError, setRentalError] = useState("")
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [showApplicationModal, setShowApplicationModal] = useState(false)
    const isAdmin = Boolean(currentUser?.isAdmin)

    const navigate = useNavigate();

    const handleLogout = async ()=>{
        try
        {
            await apiRequest.post("/auth/logout")
            updateUser(null)
            navigate("/")
        }
        catch(err) {
            console.log(err)
        }
    }

    const handleEditListing = (postId) => {
        navigate(`/property/${postId}/edit`)
    }

    const handleDeleteListing = async (postId) => {
        const confirmed = window.confirm("Delete this listing permanently?")
        if (!confirmed) return

        setDeletingId(postId)

        try {
            await apiRequest.delete(`/posts/${postId}`)
            navigate(0)
        } catch (err) {
            console.log(err)
            alert(err?.response?.data?.message || "Failed to delete listing.")
        } finally {
            setDeletingId("")
        }
    }

    const loadRentalData = async () => {
        if (isAdmin) return;

        setRentalLoading(true)
        setRentalError("")
        try {
            const [ownerApplicationsRes, myApplicationsRes, ownerAgreementsRes, renterAgreementsRes, myPaymentsRes, notificationsRes] = await Promise.all([
                apiRequest.get("/rentals/applications/owner"),
                apiRequest.get("/rentals/applications/me"),
                apiRequest.get("/rentals/agreements/owner"),
                apiRequest.get("/rentals/agreements/renter"),
                apiRequest.get("/rentals/payments/me"),
                apiRequest.get("/rentals/notifications/me"),
            ])

            setRentalState({
                ownerApplications: ownerApplicationsRes.data || [],
                myApplications: myApplicationsRes.data || [],
                ownerAgreements: ownerAgreementsRes.data || [],
                renterAgreements: renterAgreementsRes.data || [],
                myPayments: myPaymentsRes.data || [],
                notifications: notificationsRes.data || [],
            })
        } catch (err) {
            console.log(err)
            setRentalError(err?.response?.data?.message || "Unable to load rental workflow data.")
        } finally {
            setRentalLoading(false)
        }
    }

    useEffect(() => {
        loadRentalData()
    }, [isAdmin])

    const handleAcceptApplication = async (applicationId) => {
        setRentalActionLoading(applicationId)
        try {
            await apiRequest.patch(`/rentals/applications/accept/${applicationId}`)
            await loadRentalData()
        } catch (err) {
            console.log(err)
            alert(err?.response?.data?.message || "Failed to accept application.")
        } finally {
            setRentalActionLoading("")
        }
    }

    const handleRejectApplication = async (applicationId) => {
        setRentalActionLoading(applicationId)
        try {
            await apiRequest.patch(`/rentals/applications/reject/${applicationId}`)
            await loadRentalData()
        } catch (err) {
            console.log(err)
            alert(err?.response?.data?.message || "Failed to update application.")
        } finally {
            setRentalActionLoading("")
        }
    }

    const handlePayDeposit = async (agreementId) => {
        setRentalActionLoading(agreementId)
        setRentalError("")

        try {
            const orderRes = await apiRequest.post("/rentals/payments/deposit/order", { agreementId })

            const { payment, order, key } = orderRes.data
            const isMock = order?.isMock || order?.id?.startsWith("mock_order_") || key === "mock_key"

            if (isMock) {
                throw new Error("Backend is in demo payment mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in api/.env and restart backend to open real Razorpay checkout.")
            } else {
                const isSdkLoaded = await loadRazorpayScript()

                if (!isSdkLoaded) {
                    throw new Error("Unable to load Razorpay SDK. Check your internet connection and retry.")
                }

                await openRazorpayCheckout({
                    key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency || "INR",
                    name: "LamaEstate Rentals",
                    description: "Rental Deposit Payment",
                    order_id: order.id,
                    prefill: {
                        name: currentUser?.username || "",
                        email: currentUser?.email || "",
                    },
                    notes: {
                        agreementId,
                        paymentType: "DEPOSIT",
                    },
                    handler: async (response) => {
                        await apiRequest.post("/rentals/payments/deposit/verify", {
                            paymentId: payment.id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        })
                        await loadRentalData()
                    },
                    theme: {
                        color: "#0f766e",
                    },
                })
            }

            await loadRentalData()
        } catch (err) {
            console.log(err)
            const message = err?.response?.data?.message || err?.message || "Failed to complete deposit payment."
            setRentalError(message)
            alert(message)
        } finally {
            setRentalActionLoading("")
        }
    }

    const handlePayMonthlyRent = async (agreementId) => {
        setRentalActionLoading(agreementId)
        setRentalError("")

        try {
            const orderRes = await apiRequest.post("/rentals/payments/rent/order", { agreementId })

            const { payment, order, key } = orderRes.data
            const isMock = order?.isMock || order?.id?.startsWith("mock_order_") || key === "mock_key"

            if (isMock) {
                throw new Error("Backend is in demo payment mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in api/.env and restart backend to open real Razorpay checkout.")
            } else {
                const isSdkLoaded = await loadRazorpayScript()

                if (!isSdkLoaded) {
                    throw new Error("Unable to load Razorpay SDK. Check your internet connection and retry.")
                }

                await openRazorpayCheckout({
                    key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency || "INR",
                    name: "LamaEstate Rentals",
                    description: "Monthly Rent Payment",
                    order_id: order.id,
                    prefill: {
                        name: currentUser?.username || "",
                        email: currentUser?.email || "",
                    },
                    notes: {
                        agreementId,
                        paymentType: "RENT",
                    },
                    handler: async (response) => {
                        await apiRequest.post("/rentals/payments/rent/verify", {
                            paymentId: payment.id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        })
                        await loadRentalData()
                    },
                    theme: {
                        color: "#0f766e",
                    },
                })
            }

            await loadRentalData()
        } catch (err) {
            console.log(err)
            const message = err?.response?.data?.message || err?.message || "Failed to complete monthly rent payment."
            setRentalError(message)
            alert(message)
        } finally {
            setRentalActionLoading("")
        }
    }

    return(
        <div className="profilePage">
            <div className="details">
                <div className="wrapper">
                    <div className="profileHero">
                        <div className="identity">
                            <img src={currentUser.avatar || "/noavatar.jpg"} alt="Profile avatar" />
                            <div>
                                <p className="eyebrow">Account Overview</p>
                                <h1>{currentUser?.username}</h1>
                                <p className="subtext">{currentUser?.email}</p>
                            </div>
                        </div>

                        <div className="heroActions">
                            <Link to="/profile/update" className="actionBtn primary">Update Profile</Link>
                            <button type="button" className="actionBtn ghost" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>

                    <Suspense fallback={<div className="statsGrid"><article className="statCard"><h3>Loading...</h3><p>...</p></article></div>}>
                        <Await
                            resolve={data.postResponse}
                            errorElement={<div className="statsGrid"><article className="statCard"><h3>Stats</h3><p>Unavailable</p></article></div>}
                        >
                            {(postResponse) => {
                                const usersPosts = postResponse?.data?.usersPosts || [];
                                const savedPosts = postResponse?.data?.savedPosts || [];

                                return (
                                    <div className="statsGrid">
                                        {!isAdmin && (
                                            <>
                                                <article className="statCard">
                                                    <h3>My Listings</h3>
                                                    <p>{usersPosts.length}</p>
                                                </article>
                                                <article className="statCard">
                                                    <h3>Saved Homes</h3>
                                                    <p>{savedPosts.length}</p>
                                                </article>
                                            </>
                                        )}
                                        <article className="statCard">
                                            <h3>Account Type</h3>
                                            <p>{currentUser?.isAdmin ? "Admin" : "Standard"}</p>
                                        </article>
                                    </div>
                                )
                            }}
                        </Await>
                    </Suspense>

                    {isAdmin ? (
                        <section className="adminEssentials">
                            <div className="sectionHeader">
                                <h2>Admin Essentials</h2>
                            </div>
                            <div className="adminCards">
                                <article className="adminCard">
                                    <h3>Moderation Workspace</h3>
                                    <p>Review approvals, users, and properties from the admin console.</p>
                                    <Link to="/admin" className="actionBtn primary">Open Admin Panel</Link>
                                </article>
                                <article className="adminCard">
                                    <h3>Profile Management</h3>
                                    <p>Keep your account details updated for secure admin access.</p>
                                    <Link to="/profile/update" className="actionBtn ghost">Update Profile</Link>
                                </article>
                            </div>
                        </section>
                    ) : (
                        <>
                            <div className="sectionHeader">
                                <h2>My Listings</h2>
                                <Link to="/add" className="actionBtn primary">Create New Post</Link>
                            </div>

                            <Suspense fallback={<p className="stateText">Loading your listings...</p>}>
                                <Await
                                    resolve={data.postResponse}
                                    errorElement={
                                        <p className="stateText error">Error loading your listings.</p>
                                    }
                                    >
                                    {(postResponse) => {
                                        const usersPosts = postResponse?.data?.usersPosts || [];

                                        if (!usersPosts.length) {
                                            return <p className="stateText">You have not created any listing yet.</p>
                                        }

                                        return (
                                            <List
                                                posts={usersPosts}
                                                showActions
                                                onEdit={handleEditListing}
                                                onDelete={handleDeleteListing}
                                                deletingId={deletingId}
                                            />
                                        )
                                    }}
                                </Await>
                            </Suspense>

                            <div className="sectionHeader">
                                <h2>Saved Listings</h2>
                            </div>

                            <Suspense fallback={<p className="stateText">Loading saved listings...</p>}>
                                <Await
                                    resolve={data.postResponse}
                                    errorElement={
                                        <p className="stateText error">Error loading saved listings.</p>
                                    }
                                    >
                                    {(postResponse) => {
                                        const savedPosts = postResponse?.data?.savedPosts || [];

                                        if (!savedPosts.length) {
                                            return <p className="stateText">No saved listing found yet.</p>
                                        }

                                        return <List posts={savedPosts}/>
                                    }}
                                </Await>
                    
                            </Suspense>

                            <section className="rentalHub">
                                <div className="sectionHeader">
                                    <h2>Rental Workflow Hub</h2>
                                    <button type="button" className="actionBtn ghost" onClick={loadRentalData} disabled={rentalLoading}>
                                        {rentalLoading ? "Refreshing..." : "Refresh"}
                                    </button>
                                </div>

                                {rentalError && <p className="stateText error">{rentalError}</p>}

                                <div className="rentalGrid">
                                    <article className="rentalCard">
                                        <h3>Incoming Applications</h3>
                                        {!rentalState.ownerApplications.length ? (
                                            <p>No incoming rental applications.</p>
                                        ) : (
                                            <div className="rentalList">
                                                {rentalState.ownerApplications.slice(0, 6).map((application) => (
                                                    <div key={application.id} className="rentalItem">
                                                        <strong>{application.post?.title}</strong>
                                                        <span>{application.fullName} · {application.status}</span>
                                                        <button 
                                                            type="button" 
                                                            className="viewDetailsBtn"
                                                            onClick={() => {
                                                                setSelectedApplication(application)
                                                                setShowApplicationModal(true)
                                                            }}
                                                        >
                                                            View Details
                                                        </button>
                                                        {application.status === "PENDING" && (
                                                            <div className="rentalActions">
                                                                <button type="button" onClick={() => handleAcceptApplication(application.id)} disabled={rentalActionLoading === application.id}>Accept</button>
                                                                <button type="button" onClick={() => handleRejectApplication(application.id)} disabled={rentalActionLoading === application.id}>Reject</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rentalCard">
                                        <h3>My Rental Applications</h3>
                                        {!rentalState.myApplications.length ? (
                                            <p>You have not applied for any rental yet.</p>
                                        ) : (
                                            <div className="rentalList">
                                                {rentalState.myApplications.slice(0, 6).map((application) => (
                                                    <div key={application.id} className="rentalItem">
                                                        <strong>{application.post?.title}</strong>
                                                        <span>Status: {application.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rentalCard">
                                        <h3>My Agreements</h3>
                                        {!rentalState.renterAgreements.length ? (
                                            <p>No active renter agreements yet.</p>
                                        ) : (
                                            <div className="rentalList">
                                                {rentalState.renterAgreements.slice(0, 6).map((agreement) => (
                                                    <div key={agreement.id} className="rentalItem">
                                                        <strong>{agreement.post?.title}</strong>
                                                        <span>Agreement: {agreement.status}</span>
                                                        {agreement.status === "PENDING_DEPOSIT" && (
                                                            <button type="button" onClick={() => handlePayDeposit(agreement.id)} disabled={rentalActionLoading === agreement.id}>
                                                                {rentalActionLoading === agreement.id ? "Processing..." : "Pay Deposit"}
                                                            </button>
                                                        )}
                                                        {agreement.status === "ACTIVE" && (
                                                            <button type="button" onClick={() => handlePayMonthlyRent(agreement.id)} disabled={rentalActionLoading === agreement.id}>
                                                                {rentalActionLoading === agreement.id ? "Processing..." : "Pay Monthly Rent"}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rentalCard">
                                        <h3>Rental Notifications</h3>
                                        {!rentalState.notifications.length ? (
                                            <p>No rental notifications yet.</p>
                                        ) : (
                                            <div className="rentalList">
                                                {rentalState.notifications.slice(0, 8).map((notification) => (
                                                    <div key={notification.id} className="rentalItem">
                                                        <strong>{notification.title}</strong>
                                                        <span>{notification.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                </div>

                                <article className="rentalCard fullWidth">
                                    <h3>Payment Timeline</h3>
                                    {!rentalState.myPayments.length ? (
                                        <p>No rental payments yet.</p>
                                    ) : (
                                        <div className="rentalList">
                                            {rentalState.myPayments.slice(0, 12).map((payment) => (
                                                <div key={payment.id} className="rentalItem">
                                                    <strong>{payment.agreement?.post?.title || "Property"}</strong>
                                                    <span>
                                                        {payment.purpose} · {payment.status} · {formatINR(payment.amount)}
                                                        {payment.billingMonth ? ` · ${payment.billingMonth}` : ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            </section>
                        </>
                    )}
                </div>
            </div>
            <div className="chatContainer">
                <div className="wrapper">
                    <div className="chatHead">
                        <h2>Messages</h2>
                        <p>Stay connected with buyers and sellers.</p>
                    </div>

                    <Suspense fallback={<p className="stateText">Loading chats...</p>}>
                        <Await
                            resolve={data.chatResponse}
                            errorElement={
                                <p className="stateText error">Error loading chats.</p>
                            }
                            >
                            {(chatResponse) => 
                                <Chat chats={chatResponse.data} initialChatId={activeChatId}/>     
                            }
                        </Await>
                    </Suspense>

                </div>
            </div>

            {/* Application Details Modal */}
            {showApplicationModal && selectedApplication && (
                <div className="rentModalOverlay" onClick={() => setShowApplicationModal(false)}>
                    <div className="rentModal applicationDetailsModal" onClick={(e) => e.stopPropagation()}>
                        <div className="rentModalHeader">
                            <h3>Rental Application Details</h3>
                            <button type="button" className="closeBtn" onClick={() => setShowApplicationModal(false)}>×</button>
                        </div>
                        <div className="rentModalBody">
                            <div className="detailSection">
                                <h4>Property Information</h4>
                                <div className="detailRow">
                                    <span className="label">Property Title:</span>
                                    <span className="value">{selectedApplication.post?.title}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Property Type:</span>
                                    <span className="value">{selectedApplication.post?.type}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Monthly Rent:</span>
                                    <span className="value">{formatINR(selectedApplication.post?.monthlyRentAmount || selectedApplication.post?.price)}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Deposit:</span>
                                    <span className="value">{formatINR(selectedApplication.post?.depositAmount || Math.round((selectedApplication.post?.monthlyRentAmount || selectedApplication.post?.price) * 0.2))}</span>
                                </div>
                            </div>

                            <div className="detailSection">
                                <h4>Applicant Information</h4>
                                <div className="detailRow">
                                    <span className="label">Full Name:</span>
                                    <span className="value">{selectedApplication.fullName}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Email:</span>
                                    <span className="value">{selectedApplication.email}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Phone:</span>
                                    <span className="value">{selectedApplication.phone}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Government ID:</span>
                                    <span className="value">
                                        {selectedApplication.governmentIdUrl}
                                    </span>
                                </div>
                            </div>

                            <div className="detailSection">
                                <h4>Employment & Background</h4>
                                <div className="detailRow">
                                    <span className="label">Employment Details:</span>
                                    <span className="value">{selectedApplication.employmentDetails}</span>
                                </div>
                                {selectedApplication.rentalHistory && (
                                    <div className="detailRow">
                                        <span className="label">Rental History:</span>
                                        <span className="value">{selectedApplication.rentalHistory}</span>
                                    </div>
                                )}
                                <div className="detailRow">
                                    <span className="label">Family/Occupants:</span>
                                    <span className="value">{selectedApplication.familyOccupantsInfo}</span>
                                </div>
                            </div>

                            <div className="detailSection">
                                <h4>Rental Plan</h4>
                                <div className="detailRow">
                                    <span className="label">Reason for Renting:</span>
                                    <span className="value">{selectedApplication.reasonForRenting}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Stay Duration:</span>
                                    <span className="value">{selectedApplication.stayDurationMonths} months</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Expected Start Date:</span>
                                    <span className="value">{selectedApplication.expectedStartDate ? new Date(selectedApplication.expectedStartDate).toLocaleDateString() : "Not specified"}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Expected End Date:</span>
                                    <span className="value">{selectedApplication.expectedEndDate ? new Date(selectedApplication.expectedEndDate).toLocaleDateString() : "Not specified"}</span>
                                </div>
                                {selectedApplication.additionalNotes && (
                                    <div className="detailRow">
                                        <span className="label">Additional Notes:</span>
                                        <span className="value">{selectedApplication.additionalNotes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="detailSection">
                                <h4>Application Status</h4>
                                <div className="detailRow">
                                    <span className="label">Status:</span>
                                    <span className={`value statusBadge ${selectedApplication.status.toLowerCase()}`}>{selectedApplication.status}</span>
                                </div>
                                <div className="detailRow">
                                    <span className="label">Submitted On:</span>
                                    <span className="value">{new Date(selectedApplication.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {selectedApplication.status === "PENDING" && (
                                <div className="modalActions">
                                    <button 
                                        type="button" 
                                        className="acceptBtn"
                                        onClick={() => {
                                            handleAcceptApplication(selectedApplication.id)
                                            setShowApplicationModal(false)
                                        }}
                                        disabled={rentalActionLoading === selectedApplication.id}
                                    >
                                        {rentalActionLoading === selectedApplication.id ? "Processing..." : "Accept Application"}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="rejectBtn"
                                        onClick={() => {
                                            handleRejectApplication(selectedApplication.id)
                                            setShowApplicationModal(false)
                                        }}
                                        disabled={rentalActionLoading === selectedApplication.id}
                                    >
                                        {rentalActionLoading === selectedApplication.id ? "Processing..." : "Reject Application"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePage