import Slider from "../../components/slider/Slider"
import "./singlePage.scss"
import Map from "../../components/map/Map";
import { Navigate, useLoaderData, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify"
import { useContext, useState } from "react";
import {AuthContext} from "../../context/AuthContext"
import apiRequest from "../../lib/apiRequest";
import { formatINR } from "../../lib/currency";

function SinglePage() {

    const post = useLoaderData(); 
    const ownerId = post?.user?.id || post?.userId;
    const [saved,setSaved] = useState(post.isSaved)
    const [startingChat, setStartingChat] = useState(false);
    const [chatError, setChatError] = useState("");
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState("");
    const [applySuccess, setApplySuccess] = useState("");
    const { currentUser } = useContext(AuthContext)

    const navigate = useNavigate();
    const [applicationForm, setApplicationForm] = useState({
        fullName: currentUser?.username || "",
        phone: "",
        email: currentUser?.email || "",
        governmentIdUrl: "",
        employmentDetails: "",
        rentalHistory: "",
        familyOccupantsInfo: "",
        reasonForRenting: "",
        stayDurationMonths: 12,
        expectedStartDate: "",
        additionalNotes: "",
    });

    const isOwner = currentUser?.id === ownerId;
    const canApplyForRent =
        post.type === "rent" &&
        !currentUser?.isAdmin &&
        !isOwner &&
        Boolean(post.canApplyForRent);

    // if(!currentUser) {
    //     return <Navigate to="/login" />
    // }

    const handleSave = async () => {

        setSaved((prev)=>!prev);

        try{
            await apiRequest.post("/user/save",{postId:post.id})
        }catch(err) {
            console.log(err)
            setSaved((prev)=>!prev);
        }
    }

    const handleStartChat = async () => {
        setChatError("");

        if (!ownerId) {
            setChatError("Owner is unavailable for chat right now.");
            return;
        }

        if (ownerId === currentUser.id) {
            setChatError("You cannot start chat with yourself.");
            return;
        }

        setStartingChat(true);

        try {
            const res = await apiRequest.post("/chats", {
                receiverId: ownerId,
            });

            const chatId = res?.data?.id;

            if (!chatId) {
                throw new Error("Unable to start chat.");
            }

            navigate(`/profile?chat=${chatId}`);
        } catch (err) {
            console.log(err);
            setChatError(err?.response?.data?.message || "Failed to open chat. Please try again.");
        } finally {
            setStartingChat(false);
        }
    }

    const handleApplicationChange = (e) => {
        const { name, value } = e.target;
        setApplicationForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleApplyForRent = async (e) => {
        e.preventDefault();
        setApplyError("");
        setApplySuccess("");
        setApplying(true);

        try {
            await apiRequest.post(`/rentals/apply/${post.id}`, applicationForm);
            setApplySuccess("Rental application submitted successfully.");
            setShowApplyModal(false);
        } catch (err) {
            console.log(err);
            setApplyError(err?.response?.data?.message || "Failed to submit rental application.");
        } finally {
            setApplying(false);
        }
    };

    return(
        <div className="singlePage">
            <div className="details">
                <div className="wrapper">
                    <Slider images={post.images}/>
                    <div className="info">
                        <div className="top">
                            <div className="post">
                                <h1>{post.title}</h1>
                                <div className="address">
                                    <img src="/pin.png" alt="" />
                                    <span>{post.address}</span>
                                </div>
                                <div className="price">{formatINR(post.price)}</div>
                            </div>
                            <div className="user">
                                <img src={post.user.avatar || "/noavatar.jpg"} alt="" />
                                <span>{post.user.username}</span>
                            </div>
                        </div>
                        <div className="bottom" dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(post.postDetail.desc)}}>
                        </div>
                    </div>
                </div>
            </div>
            <div className="features">
                 <div className="wrapper">
                    <p className="title">General</p>
                    <div className="listVertical">
                        <div className="feature">
                            <img src="/utility.png" alt="" />
                            <div className="featureText">
                                <span>Utilities</span>
                                {
                                    post.postDetail.utilities === "owner" ? (
                                        <p>Owner is Responsible</p>
                                    ):(
                                        <p>Tenant is Responsible</p>
                                    )
                                }

                                
                            </div>
                        </div>
                        <div className="feature">
                            <img src="/pet.png" alt="" />
                            <div className="featureText">
                                <span>Pet Policy</span>
                                {post.postDetail.pet === "allowed" ? <p>Pets Allowed</p> : <p>Pets Not Allowed</p> }
                            </div>
                        </div>
                        <div className="feature">
                            <img src="/fee.png" alt="" />
                            <div className="featureText">
                                <span>Income Policy</span>
                                <p>{post.postDetail.income}</p>
                            </div>
                        </div>
                    </div>
                    <p className="title">Sizes</p>
                    <div className="sizes">
                        <div className="size">
                            <img src="/size.png" alt="" />
                            <span>{post.postDetail.size} sqft</span>
                        </div>
                        <div className="size">
                            <img src="/bed.png" alt="" />
                            <span>{post.bedroom} beds</span>
                        </div>
                        <div className="size">
                            <img src="/bath.png" alt="" />
                            <span>{post.bathroom} bathroom</span>
                        </div>
                    </div>
                    <p className="title">Near By Places</p>
                    <div className="listHorizontal">
                        <div className="feature">
                            <img src="/school.png" alt="" />
                            <div className="featureText">
                                <span>School</span>
                                <p>{post.postDetail.school > 999 ? post.postDetail.school/1000 + "km" : post.postDetail.school + "m"} away</p>
                            </div>
                        </div>
                        <div className="feature">
                            <img src="/pet.png" alt="" />
                            <div className="featureText">
                                <span>Bus Stop</span>
                                <p>{post.postDetail.bus > 999 ? post.postDetail.bus/1000 + "km" : post.postDetail.bus + "m"} away</p>
                            </div>
                        </div>
                        <div className="feature">
                            <img src="/fee.png" alt="" />
                            <div className="featureText">
                                <span>Restaurant</span>
                                <p>{post.postDetail.restaurant > 999 ? post.postDetail.restaurant/1000 + "km" : post.postDetail.restaurant + "m"}  away</p>
                            </div>
                        </div>
                    </div>
                    <p className="title">Location</p>
                    <div className="mapContainer">
                        <Map items={[post]}/>
                    </div>

                    {/* {currentUser && currentUser.id !== ownerId && <div className="buttons">
                        <button type="button" onClick={handleStartChat} disabled={startingChat}>
                            <img src="/chat.png" alt="" />
                            {startingChat ? "Opening Chat..." : "Chat With Owner"}
                        </button>
                        {post.type === "rent" && (
                            <button
                                type="button"
                                onClick={() => setShowApplyModal(true)}
                                disabled={!canApplyForRent || applying}
                                className="rentApplyBtn"
                            >
                                <img src="/save.png" alt="" />
                                {!post.canApplyForRent
                                    ? "Currently Unavailable"
                                    : applying
                                    ? "Submitting..."
                                    : "Apply for Rent"}
                            </button>
                        )}
                        {!currentUser?.isAdmin && (
                            <button type="button" onClick={handleSave} style={{
                                backgroundColor : saved ? "#dbeeff" : "white"
                            }}>
                                <img src="/save.png" alt="" />
                                {saved ? "Place Saved" : "Save the Place"}
                            </button>
                        )}
                    </div>} */}
 
                        {currentUser ? (
                            currentUser.id !== ownerId && (
                                <div className="buttons">

                                    <button
                                        type="button"
                                        onClick={handleStartChat}
                                        disabled={startingChat}
                                    >
                                        <img src="/chat.png" alt="" />
                                        {startingChat ? "Opening Chat..." : "Chat With Owner"}
                                    </button>

                                    {post.type === "rent" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowApplyModal(true)}
                                            disabled={!canApplyForRent || applying}
                                            className="rentApplyBtn"
                                        >
                                            <img src="/save.png" alt="" />
                                            {!post.canApplyForRent
                                                ? "Currently Unavailable"
                                                : applying
                                                ? "Submitting..."
                                                : "Apply for Rent"}
                                        </button>
                                    )}

                                    {!currentUser?.isAdmin && (
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            style={{
                                                backgroundColor: saved ? "#dbeeff" : "white"
                                            }}
                                        >
                                            <img src="/save.png" alt="" />
                                            {saved ? "Place Saved" : "Save the Place"}
                                        </button>
                                    )}

                                </div>
                            )
                        ) : (
                            <div className="loginPrompt">
                                <a href="/login" className="loginToInteractBtn">
                                    Login to Interact with Owner
                                </a>
                            </div>
                        )}

                    {chatError && <p className="chatError">{chatError}</p>}
                    {applyError && <p className="chatError">{applyError}</p>}
                    {applySuccess && <p className="successMsg">{applySuccess}</p>}
                 </div>
            </div>

            {showApplyModal && (
                <div className="rentModalOverlay" onClick={() => setShowApplyModal(false)}>
                    <div className="rentModal" onClick={(e) => e.stopPropagation()}>
                        <div className="rentModalHeader">
                            <h3>Apply For This Rental</h3>
                            <button type="button" onClick={() => setShowApplyModal(false)}>Close</button>
                        </div>
                        <form className="rentForm" onSubmit={handleApplyForRent}>
                            <input name="fullName" value={applicationForm.fullName} onChange={handleApplicationChange} placeholder="Full name" required />
                            <input name="phone" value={applicationForm.phone} onChange={handleApplicationChange} placeholder="Phone number" required />
                            <input name="email" type="email" value={applicationForm.email} onChange={handleApplicationChange} placeholder="Email" required />
                            <input name="governmentIdUrl" value={applicationForm.governmentIdUrl} onChange={handleApplicationChange} placeholder="Government ID document URL" required />
                            <textarea name="employmentDetails" value={applicationForm.employmentDetails} onChange={handleApplicationChange} placeholder="Employment details" required />
                            <textarea name="rentalHistory" value={applicationForm.rentalHistory} onChange={handleApplicationChange} placeholder="Rental history (optional)" />
                            <textarea name="familyOccupantsInfo" value={applicationForm.familyOccupantsInfo} onChange={handleApplicationChange} placeholder="Family/occupants info" required />
                            <textarea name="reasonForRenting" value={applicationForm.reasonForRenting} onChange={handleApplicationChange} placeholder="Why do you want this property?" required />
                            <div className="rowFields">
                                <input
                                    name="stayDurationMonths"
                                    type="number"
                                    min="1"
                                    value={applicationForm.stayDurationMonths}
                                    onChange={handleApplicationChange}
                                    placeholder="Stay duration in months"
                                    required
                                />
                                <input
                                    name="expectedStartDate"
                                    type="date"
                                    value={applicationForm.expectedStartDate}
                                    onChange={handleApplicationChange}
                                />
                            </div>
                            <textarea name="additionalNotes" value={applicationForm.additionalNotes} onChange={handleApplicationChange} placeholder="Additional notes" />
                            <button type="submit" disabled={applying}>{applying ? "Submitting..." : "Submit Application"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SinglePage

