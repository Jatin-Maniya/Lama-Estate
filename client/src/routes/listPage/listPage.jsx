import "./listPage.scss"
import Filter from "../../components/filter/Filter";
import Card from "../../components/card/Card";
import Map from "../../components/map/Map";
import { Await, useLoaderData, useLocation } from "react-router-dom";
import { Suspense } from "react";

function ListPage() {

    const data = useLoaderData();

    const renderPostList = (postResponse) => {
        const posts = postResponse?.data || []

        if (!posts.length) {
            return <p className="listState">No properties found for this filter. Try adjusting your search.</p>
        }

        return posts.map(post=>(
            <Card key={post.id} item={post}/>
        ))
    }

    return (
        <div className="listPage">
            <div className="listContainer">
                <div className="wrapper">
                    <div className="intro">
                        <h1>Explore Verified Properties</h1>
                        <p>Curated listings with consistent details, quality visuals, and trusted moderation.</p>
                    </div>

                    <Filter/>
                    <Suspense fallback={<p className="listState">Loading properties...</p>}>
                        <Await
                            resolve={data.postResponse}
                            errorElement={
                                <p className="listState">Error loading properties.</p>
                            }
                            >
                            {(postResponse) => renderPostList(postResponse)}
                        </Await>
            
                    </Suspense>
                </div>
            </div>
            <div className="mapContainer">
                <Suspense fallback={<p className="mapState">Loading map...</p>}>
                        <Await
                            resolve={data.postResponse}
                            errorElement={
                                <p className="mapState">Error loading map data.</p>
                            }
                            >
                            {(postResponse) => <Map items={postResponse.data}/>}
                        </Await>
            
                    </Suspense>
            </div>
        </div>
    )
}

export default ListPage