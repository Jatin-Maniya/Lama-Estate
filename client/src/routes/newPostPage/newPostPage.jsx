import { useState } from "react";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import "./newPostPage.scss"
import apiRequest from "../../lib/apiRequest"
import "quill/dist/quill.snow.css"
import { useNavigate } from "react-router-dom";
import Editor from "../../components/editor/Editor";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dci28nvyx";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "estate";

const toInt = (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

function NewPostPage() {

    const [value,setValue] = useState("")
    const [error,setError] = useState("")
    const [images,setImages] = useState([])
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        e.preventDefault()
        setSubmitting(true)
        setError("")

        const formData = new FormData(e.target)

        const inputs = Object.fromEntries(formData)

        if (!value || value === "<p><br></p>") {
            setError("Please add a post description.")
            setSubmitting(false)
            return
        }

        if (!images.length) {
            setError("Please upload at least one property image.")
            setSubmitting(false)
            return
        }
        
        try{
            const res = await apiRequest.post("/posts",{
                postData:{
                    title:inputs.title,
                    price:toInt(inputs.price),
                    address:inputs.address,
                    city:inputs.city,
                    bedroom:toInt(inputs.bedroom),
                    bathroom:toInt(inputs.bathroom),
                    type:inputs.type,
                    property:inputs.property,
                    latitude:inputs.latitude,
                    longitude:inputs.longitude,
                    images:images,
                },
                postDetail:{
                    desc:value,
                    utilities:inputs.utilities,
                    pet:inputs.pet,
                    income:inputs.income,
                    size:toInt(inputs.size),
                    school:toInt(inputs.school),
                    bus:toInt(inputs.bus),
                    restaurant:toInt(inputs.restaurant),
                },
            })

            navigate("/"+res.data.id)
        }catch(err) {
            console.log(err)
            setError(err?.response?.data?.message || "Failed to create post. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return(
        <div className="newPostPage">
            <div className="formContainer">
                <h2>Add New Post</h2>
                <div className="wrapper">
                    <form onSubmit={handleSubmit}>
                        <div className="item">
                            <label htmlFor="title">Title</label>
                            <input type="text" name="title" id="title" required />
                        </div>

                        <div className="item">
                            <label htmlFor="price">Price</label>
                            <input type="number" name="price" id="price" min={0} required />
                        </div>

                        <div className="item">
                            <label htmlFor="address">Address</label>
                            <input type="text" name="address" id="address" required />
                        </div>
         
                        <div className="item description">
                            <label htmlFor="desc">Description</label>
                            <Editor value={value} onChange={setValue}/>
                        </div>

                        <div className="item">
                            <label htmlFor="city">City</label>
                            <input type="text" name="city" id="city" required />
                        </div>

                        <div className="item">
                            <label htmlFor="bedroom">Bedroom Number</label>
                            <input type="number" min={1} name="bedroom" id="bedroom" />
                        </div>

                        <div className="item">
                            <label htmlFor="bathroom">Bathroom Number</label>
                            <input type="number" min={1} name="bathroom" id="bathroom" />
                        </div>
                        

                        <div className="item">
                            <label htmlFor="latitude">Latitude</label>
                            <input type="text" name="latitude" id="latitude" required />
                        </div>

                        <div className="item">
                            <label htmlFor="longitude">Longitude</label>
                            <input type="text" name="longitude" id="longitude" required />
                        </div>

                        <div className="item">
                            <label htmlFor="type">Type</label>
                            <select name="type">
                                <option value="rent" defaultChecked> Rent </option>
                                <option value="buy"> Sell </option>
                            </select>
                        </div>

                        <div className="item">
                            <label htmlFor="property">Property</label>
                            <select name="property">
                                <option value="apartment"> Apartment </option>
                                <option value="house"> House </option>
                                <option value="condo"> Condo </option>
                                <option value="land"> Land </option>
                            </select>
                        </div>

                        <div className="item">
                            <label htmlFor="utilities">Utilities Policy</label>
                            <select name="utilities">
                                <option value="owner"> Owner is Responsible </option>
                                <option value="tenant"> Tenant is Responsible </option>
                                <option value="shared"> Shared </option>
                            </select>
                        </div>

                        <div className="item">
                            <label htmlFor="pet">Pet Policy</label>
                            <select name="pet">
                                <option value="allowed"> Allowed </option>
                                <option value="not-allowed"> Not Allowed </option>
                            </select>
                        </div>

                        <div className="item">
                            <label htmlFor="income">Income Policy</label>
                            <input type="text" id="income" name="income" placeholder="Income Policy" />
                        </div>

                        <div className="item">
                            <label htmlFor="size">Total Size (sqft)</label>
                            <input type="number" min={0} id="size" name="size" />
                        </div>

                        <div className="item">
                            <label htmlFor="school">School</label>
                            <input type="number" min={0} id="school" name="school" />
                        </div>

                        <div className="item">
                            <label htmlFor="bus">Bus</label>
                            <input type="number" min={0} id="bus" name="bus" />
                        </div>

                        <div className="item">
                            <label htmlFor="restaurant">Restaurant</label>
                            <input type="number" min={0} id="restaurant" name="restaurant" />
                        </div>

                        <button className="sendButton" disabled={submitting}>
                            {submitting ? "Creating..." : "Add"}
                        </button>
                        {error && <span className="errorMessage">{error}</span>}
                    </form>
                </div>
            </div>

            <div className="sideContainer">
                <p className="uploadHint">Upload property images (minimum 1)</p>
                {images.map((image,index)=>(
                    <img src={image} key={index} alt="" />
                ))}

                <UploadWidget
                    uwConfig={{
                        cloudName: CLOUDINARY_CLOUD_NAME,
                        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                        multiple: true,
                        folder: "posts",
                    }}
                    setState={setImages}
                    onUploadError={setError}
                    buttonLabel="Upload Images"
                />

                {!!images.length && (
                    <p className="uploadCount">{images.length} image{images.length > 1 ? "s" : ""} uploaded</p>
                )}

            </div>
        </div>
    )
}

export default NewPostPage;  