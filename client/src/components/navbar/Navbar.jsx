import { useContext, useEffect, useRef, useState } from "react";
import "./navbar.scss"
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useNotificationStore } from "../../lib/notificationStore";
import apiRequest from "../../lib/apiRequest";

const baseNavLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/list", label: "Explore" },
    // { to: "/list?type=buy", label: "Buy" },
    // { to: "/list?type=rent", label: "Rent" },
];

const adminHiddenLinks = new Set(["/list?type=buy", "/list?type=rent"]);

function Navbar() {
    const [open,setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [quickCity, setQuickCity] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const {currentUser, updateUser} = useContext(AuthContext)
    const location = useLocation();
    const navigate = useNavigate();
    const userMenuRef = useRef(null);

    const fetch = useNotificationStore(state=>state.fetch);
    const reset = useNotificationStore(state=>state.reset);
    const number = useNotificationStore(state=>state.number);

    useEffect(() => {
        setOpen(false);
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!userMenuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    useEffect(() => {
        const syncNotifications = async () => {
            if (!currentUser) {
                reset();
                return;
            }

            try {
                await fetch();
            } catch (error) {
                console.log(error);
            }
        };

        syncNotifications();
    }, [currentUser, fetch, reset]);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        const city = quickCity.trim();

        if (!city) {
            navigate("/list");
            return;
        }

        navigate(`/list?city=${encodeURIComponent(city)}`);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            await apiRequest.post("/auth/logout");
            updateUser(null);
            reset();
            navigate("/");
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoggingOut(false);
            setMenuOpen(false);
        }
    };

    const authLinks = currentUser
        ? [{ to: "/profile", label: "Dashboard" }]
        : [
            { to: "/login", label: "Sign in" },
            { to: "/register", label: "Sign up" },
        ];

    const navLinks = currentUser?.isAdmin
        ? [
            ...baseNavLinks.filter((item) => !adminHiddenLinks.has(item.to)),
            { to: "/admin", label: "Admin" },
        ]
        : baseNavLinks;

    const isLinkActive = (item) => {
        const { pathname, search } = location;

        if (item.to === "/") {
            return pathname === "/";
        }

        if (item.to === "/list") {
            return pathname === "/list" && !new URLSearchParams(search).get("type");
        }

        if (item.to === "/list?type=buy") {
            return pathname === "/list" && new URLSearchParams(search).get("type") === "buy";
        }

        if (item.to === "/list?type=rent") {
            return pathname === "/list" && new URLSearchParams(search).get("type") === "rent";
        }

        return pathname === item.to;
    };

    return (
        <nav className="mainNav">
            <div className="left">
                <Link to="/" className="logo">
                    <img src="/logo.png" alt="LamaEstate logo" />
                    <span>LamaEstate</span>
                </Link>
                {navLinks.map((item) => (
                    <Link
                        key={item.label}
                        to={item.to}
                        className={isLinkActive(item) ? "navLink active" : "navLink"}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            <div className="right">
                <form className="quickSearch" onSubmit={handleQuickSearch}>
                    <input
                        type="text"
                        placeholder="Search city"
                        value={quickCity}
                        onChange={(e) => setQuickCity(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>

                {currentUser ? (
                    <div className="user">
                        <button
                            type="button"
                            className="profileTrigger"
                            onClick={() => setMenuOpen((prev) => !prev)}
                        >
                            <img src={currentUser.avatar || "/noavatar.jpg"} alt={`${currentUser.username} avatar`} />
                            <span>{currentUser.username}</span>
                            {number > 0 && <div className="notification">{number > 99 ? "99+" : number}</div>}
                        </button>

                        <div ref={userMenuRef} className={menuOpen ? "userMenu active" : "userMenu"}>
                            <Link to="/profile">My Profile</Link>
                            {currentUser?.isAdmin && <Link to="/admin">Admin Panel</Link>}
                            <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
                                {isLoggingOut ? "Signing out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className={location.pathname === "/login" ? "navLink authLink active" : "navLink authLink"}>Sign in</Link>
                    </>
                )}

                <div className="menuIcon">
                    <img src="/menu.png" alt="Menu" onClick={()=>setOpen((prev) => !prev)}/>
                </div>

                <div className={open ? "menu active" : "menu"}>
                    <form className="mobileSearch" onSubmit={handleQuickSearch}>
                        <input
                            type="text"
                            placeholder="Search city"
                            value={quickCity}
                            onChange={(e) => setQuickCity(e.target.value)}
                        />
                        <button type="submit">Go</button>
                    </form>

                    {navLinks.map((item) => (
                        <Link key={`mobile-${item.label}`} to={item.to} className={isLinkActive(item) ? "active" : ""}>{item.label}</Link>
                    ))}

                    {authLinks.map((item) => (
                        <Link key={`mobile-auth-${item.label}`} to={item.to}>{item.label}</Link>
                    ))}

                    {currentUser && (
                        <button type="button" className="mobileLogout" onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? "Signing out..." : "Logout"}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar;