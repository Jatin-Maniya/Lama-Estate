import { useEffect, useMemo, useState } from "react"
import "./searchBar.scss"
import apiRequest from "../../lib/apiRequest"
import { useNavigate } from "react-router-dom"
import { formatINR } from "../../lib/currency"

const types = ["buy","rent"]

const buildSearchPath = (query) => {
    const params = new URLSearchParams({
        type: query.type,
        city: query.city?.trim() || "",
        minPrice: query.minPrice || "0",
        maxPrice: query.maxPrice || "10000000",
    })

    return `/list?${params.toString()}`
}

function SearchBar() {
    const [query,setQuery] = useState({
        type:"buy",
        city:"",
        minPrice:"",
        maxPrice:"",
    })
    const [debouncedQuery, setDebouncedQuery] = useState(query)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState("")
    const [previewItems, setPreviewItems] = useState([])

    const navigate = useNavigate()

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 450)

        return () => clearTimeout(timer)
    }, [query])

    const previewPath = useMemo(() => buildSearchPath(debouncedQuery), [debouncedQuery])
    const hasPreviewIntent = Boolean(
        debouncedQuery.city?.trim() || debouncedQuery.minPrice || debouncedQuery.maxPrice
    )

    useEffect(() => {
        let active = true

        const loadPreview = async () => {
            if (!hasPreviewIntent) {
                setPreviewItems([])
                setPreviewError("")
                setPreviewLoading(false)
                return
            }

            setPreviewLoading(true)
            setPreviewError("")

            try {
                const res = await apiRequest.get("/posts", {
                    params: {
                        type: debouncedQuery.type,
                        city: debouncedQuery.city?.trim() || undefined,
                        minPrice: debouncedQuery.minPrice || 0,
                        maxPrice: debouncedQuery.maxPrice || 10000000,
                    },
                })

                if (!active) return
                setPreviewItems((res.data || []).slice(0, 4))
            } catch (error) {
                if (!active) return
                setPreviewError("Unable to load preview right now.")
                setPreviewItems([])
            } finally {
                if (active) setPreviewLoading(false)
            }
        }

        loadPreview()

        return () => {
            active = false
        }
    }, [debouncedQuery, hasPreviewIntent])

    const switchType = (val) => {
        setQuery((prev) => ({...prev,type:val}));
    }

    const handleChange = (e) => {
        setQuery((prev) => ({...prev, [e.target.name]:e.target.value}));
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        navigate(buildSearchPath(query))
    }

    return(
        <div className="searchBar">
            <div className="type">

                {types.map((type) => (
                    <button type="button" key={type} onClick={()=>switchType(type)} className={query.type === type ? "active" : ""}>{type}</button>
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <input type="text" name="city" placeholder="City" onChange={handleChange} value={query.city}/>
                <input type="number" name="minPrice" min={0} max={10000000} placeholder="Min Price" onChange={handleChange} value={query.minPrice}/>
                <input type="number" name="maxPrice" min={0} max={10000000} placeholder="Max Price" onChange={handleChange} value={query.maxPrice}/>
                <button type="submit" aria-label="Search properties">
                    <img src="/search.png" alt="" />
                </button>
            </form>
            {/* <p className="searchHint">Smart search preview: {previewPath}</p> */}

            {hasPreviewIntent && (
                <div className="searchPreview">
                    <div className="previewHeader">Top Matches</div>

                    {previewLoading ? (
                        <div className="previewSkeletons">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div className="previewSkeleton" key={index}></div>
                            ))}
                        </div>
                    ) : previewError ? (
                        <p className="previewState">{previewError}</p>
                    ) : !previewItems.length ? (
                        <p className="previewState">No matching properties found. Try widening your filters.</p>
                    ) : (
                        <div className="previewList">
                            {previewItems.map((item) => (
                                <button
                                    type="button"
                                    className="previewItem"
                                    key={item.id}
                                    onClick={() => navigate(`/${item.id}`)}
                                >
                                    <img src={item.images?.[0] || "/bg.png"} alt={item.title} />
                                    <div>
                                        <strong>{item.title}</strong>
                                        <span>{item.city} · {formatINR(item.price)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchBar