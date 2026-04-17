import { useContext, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import SearchBar from "../../components/searchBar/SearchBar"
import "./homePage.scss"
import { AuthContext } from "../../context/AuthContext"
import apiRequest from "../../lib/apiRequest"
import { formatINR } from "../../lib/currency"

function HomePage() {

    const {currentUser} = useContext(AuthContext)
    const [featuredPosts, setFeaturedPosts] = useState([])
    const [featuredLoading, setFeaturedLoading] = useState(true)
    const [featuredError, setFeaturedError] = useState("")

    const featureCards = [
        {
            title: "Verified Listings",
            copy: "Every property goes through approval workflow for better trust.",
        },
        {
            title: "Fast Discovery",
            copy: "Debounced smart search helps you filter faster without noise.",
        },
        {
            title: "Secure Experience",
            copy: "Role-based access and moderation keep the platform reliable.",
        },
    ]

    useEffect(() => {
        let active = true

        const loadFeatured = async () => {
            setFeaturedLoading(true)
            setFeaturedError("")

            try {
                const res = await apiRequest.get("/posts", {
                    params: {
                        minPrice: 0,
                        maxPrice: 10000000,
                    },
                })

                if (!active) return
                setFeaturedPosts((res.data || []).slice(0, 6))
            } catch (error) {
                if (!active) return
                setFeaturedError("Featured properties are not available right now.")
            } finally {
                if (active) setFeaturedLoading(false)
            }
        }

        loadFeatured()

        return () => {
            active = false
        }
    }, [])

    const renderFeaturedStrip = () => {
        if (featuredLoading) {
            return (
                <div className="featuredGrid skeleton">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="featuredCardSkeleton" />
                    ))}
                </div>
            )
        }

        if (featuredError) {
            return <div className="featuredEmpty">{featuredError}</div>
        }

        if (!featuredPosts.length) {
            return <div className="featuredEmpty">No approved featured properties available yet.</div>
        }

        return (
            <div className="featuredGrid">
                {featuredPosts.map((post) => (
                    <Link className="featuredCard" key={post.id} to={`/${post.id}`}>
                        <img src={post.images?.[0] || "/bg.png"} alt={post.title} />
                        <div className="overlay">
                            <p>{post.city}</p>
                            <h4>{post.title}</h4>
                            <span>{formatINR(post.price)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        )
    }

    return (
        <div className="homePage"> 
            <section className="heroSection">
                <div className="textContainer">
                    <div className="wrapper">
                        <span className="eyebrow">Next-gen real estate platform</span>
                        <h1 className="title">Discover, Review, and Own Better Properties With Confidence</h1>
                        <p className="subtitle">
                            Search across curated properties, experience intelligent filtering, and make
                            faster decisions with a platform designed for modern buyers and renters.
                        </p>

                        <SearchBar/>

                        <div className="heroCta">
                            <Link to="/list" className="exploreBtn">Explore Properties</Link>
                            <span className="welcome">{currentUser ? `Welcome back, ${currentUser.username}` : "Sign in to save searches and receive updates."}</span>
                        </div>

                        <div className="boxes">
                            <div className="box">
                                <h2>16+</h2>
                                <p>Years market expertise</p>
                            </div>
                            <div className="box">
                                <h2>2.4K</h2>
                                <p>Verified active properties</p>
                            </div>
                            <div className="box">
                                <h2>99%</h2>
                                <p>Customer satisfaction score</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="imgContainer">
                    <div className="shape one"></div>
                    <div className="shape two"></div>
                    <img src="/bg.png" alt="Luxury property" />
                    <div className="floatingCard top">Live demand: +18% this month</div>
                    <div className="floatingCard bottom">New approval queue managed by admin</div>
                </div>
            </section>

            <section className="featureSection">
                {featureCards.map((card) => (
                    <article className="featureCard" key={card.title}>
                        <h3>{card.title}</h3>
                        <p>{card.copy}</p>
                    </article>
                ))}
            </section>

            <section className="featuredSection">
                <div className="sectionHeading">
                    <h2>Featured Properties</h2>
                    <Link to="/list">See All</Link>
                </div>
                {renderFeaturedStrip()}
            </section>

            <section className="journeySection">
                <article className="journeyStep">
                    <span>01</span>
                    <h3>Search With Precision</h3>
                    <p>Use intelligent filters and live suggestions to discover matching properties quickly.</p>
                </article>
                <article className="journeyStep">
                    <span>02</span>
                    <h3>Review Trusted Listings</h3>
                    <p>Every listing is reviewed and approved through admin moderation for safer decisions.</p>
                </article>
                <article className="journeyStep">
                    <span>03</span>
                    <h3>Connect & Close Faster</h3>
                    <p>Shortlist, compare, and move forward with complete property detail transparency.</p>
                </article>
            </section>

            <section className="ctaSection">
                <h2>Ready to Find Your Next Place?</h2>
                <p>Explore curated listings and discover homes, apartments, and investment-ready properties.</p>
                <Link to="/list">Start Exploring</Link>
            </section>
        </div>
    )
}

export default HomePage