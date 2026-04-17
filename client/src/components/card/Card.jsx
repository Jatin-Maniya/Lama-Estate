import "./card.scss"
import { Link } from "react-router-dom"
import { formatINR } from "../../lib/currency"

function Card({ item, showActions = false, onEdit, onDelete, isDeleting = false }) {
    const firstImage = item?.images?.[0] || "/noavatar.jpg";
    const rentalBadgeLabel =
        item?.type === "rent"
            ? item?.rentalStatus === "OUT_OF_RENT"
                ? "Out of Rent"
                : item?.rentalLocked
                ? "Locked"
                : "Available for Rent"
            : null;

    return(
        <div className="card">
            <Link to={`/${item.id}`} className="imageContainer">
                <img src={firstImage} alt="" />
            </Link>
            <div className="textContainer">
                <h2 className="title">
                    <Link to={`/${item.id}`}>{item.title}</Link>
                </h2>
                <p className="city">
                    <img src="/pin.png" alt="" />
                    <span>{item.city}</span>
                </p>
                {rentalBadgeLabel && (
                    <p className={`rentalBadge ${item?.rentalStatus === "OUT_OF_RENT" ? "soldOut" : "open"}`}>
                        {rentalBadgeLabel}
                    </p>
                )}
                <p className="price">{formatINR(item.price)}</p>
                <div className="bottom">
                    <div className="features">
                        <div className="feature">
                            <img src="/bed.png" alt="" />
                            <span>{item.bedroom} bedroom</span>
                        </div>
                        <div className="feature">
                            <img src="/bath.png" alt="" />
                            <span>{item.bathroom} bathroom</span>
                        </div>
                    </div>

                    {showActions && (
                        <div className="listingActions">
                            <button type="button" className="editBtn" onClick={() => onEdit?.(item.id)}>
                                <span className="btnIcon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M4 17.2V20h2.8l8.3-8.3-2.8-2.8L4 17.2zm13.7-8.9a.8.8 0 000-1.1l-1.9-1.9a.8.8 0 00-1.1 0l-1.5 1.5 2.8 2.8 1.7-1.4z" />
                                    </svg>
                                </span>
                                <span>Edit Property</span>
                            </button>
                            <button
                                type="button"
                                className="deleteBtn"
                                onClick={() => onDelete?.(item.id)}
                                disabled={isDeleting}
                            >
                                <span className="btnIcon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M7 21c-.6 0-1-.4-1-1V7h12v13c0 .6-.4 1-1 1H7zm3-3h2V10h-2v8zm4 0h2V10h-2v8zM8 4h3l1-1h4v2H8V4z" />
                                    </svg>
                                </span>
                                <span>{isDeleting ? "Deleting..." : "Delete Property"}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Card