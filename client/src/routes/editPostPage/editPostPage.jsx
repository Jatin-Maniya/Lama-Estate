import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import Editor from "../../components/editor/Editor";
import apiRequest from "../../lib/apiRequest";
import "quill/dist/quill.snow.css";
import "../newPostPage/newPostPage.scss";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dci28nvyx";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "estate";

const toInt = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    price: "",
    address: "",
    city: "",
    bedroom: "",
    bathroom: "",
    latitude: "",
    longitude: "",
    type: "rent",
    property: "apartment",
    utilities: "owner",
    pet: "allowed",
    income: "",
    size: "",
    school: "",
    bus: "",
    restaurant: "",
  });

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await apiRequest.get(`/posts/${id}`);
        const post = res.data;

        setImages(Array.isArray(post.images) ? post.images : []);
        setValue(post.postDetail?.desc || "");
        setFormState({
          title: post.title || "",
          price: post.price ?? "",
          address: post.address || "",
          city: post.city || "",
          bedroom: post.bedroom ?? "",
          bathroom: post.bathroom ?? "",
          latitude: post.latitude || "",
          longitude: post.longitude || "",
          type: post.type || "rent",
          property: post.property || "apartment",
          utilities: post.postDetail?.utilities || "owner",
          pet: post.postDetail?.pet || "allowed",
          income: post.postDetail?.income || "",
          size: post.postDetail?.size ?? "",
          school: post.postDetail?.school ?? "",
          bus: post.postDetail?.bus ?? "",
          restaurant: post.postDetail?.restaurant ?? "",
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleChange = (e) => {
    const { name, value: nextValue } = e.target;
    setFormState((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!value || value === "<p><br></p>") {
      setError("Please add a post description.");
      setSubmitting(false);
      return;
    }

    if (!images.length) {
      setError("Please upload at least one property image.");
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest.put(`/posts/${id}`, {
        postData: {
          title: formState.title,
          price: toInt(formState.price),
          address: formState.address,
          city: formState.city,
          bedroom: toInt(formState.bedroom),
          bathroom: toInt(formState.bathroom),
          type: formState.type,
          property: formState.property,
          latitude: formState.latitude,
          longitude: formState.longitude,
          images,
        },
        postDetail: {
          desc: value,
          utilities: formState.utilities,
          pet: formState.pet,
          income: formState.income,
          size: toInt(formState.size),
          school: toInt(formState.school),
          bus: toInt(formState.bus),
          restaurant: toInt(formState.restaurant),
        },
      });

      navigate(`/profile?updated=${Date.now()}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update post.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="newPostPage">
        <div className="formContainer">
          <div className="wrapper">
            <p>Loading property...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h2>Edit Property</h2>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input type="text" name="title" id="title" value={formState.title} onChange={handleChange} required />
            </div>

            <div className="item">
              <label htmlFor="price">Price</label>
              <input type="number" name="price" id="price" value={formState.price} onChange={handleChange} min={0} required />
            </div>

            <div className="item">
              <label htmlFor="address">Address</label>
              <input type="text" name="address" id="address" value={formState.address} onChange={handleChange} required />
            </div>

            <div className="item description">
              <label htmlFor="desc">Description</label>
              <Editor value={value} onChange={setValue} />
            </div>

            <div className="item">
              <label htmlFor="city">City</label>
              <input type="text" name="city" id="city" value={formState.city} onChange={handleChange} required />
            </div>

            <div className="item">
              <label htmlFor="bedroom">Bedroom Number</label>
              <input type="number" min={1} name="bedroom" id="bedroom" value={formState.bedroom} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="bathroom">Bathroom Number</label>
              <input type="number" min={1} name="bathroom" id="bathroom" value={formState.bathroom} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input type="text" name="latitude" id="latitude" value={formState.latitude} onChange={handleChange} required />
            </div>

            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input type="text" name="longitude" id="longitude" value={formState.longitude} onChange={handleChange} required />
            </div>

            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type" value={formState.type} onChange={handleChange}>
                <option value="rent">Rent</option>
                <option value="buy">Sell</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="property">Property</label>
              <select name="property" value={formState.property} onChange={handleChange}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities" value={formState.utilities} onChange={handleChange}>
                <option value="owner">Owner is Responsible</option>
                <option value="tenant">Tenant is Responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet" value={formState.pet} onChange={handleChange}>
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not Allowed</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input type="text" id="income" name="income" value={formState.income} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input type="number" min={0} id="size" name="size" value={formState.size} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="school">School</label>
              <input type="number" min={0} id="school" name="school" value={formState.school} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="bus">Bus</label>
              <input type="number" min={0} id="bus" name="bus" value={formState.bus} onChange={handleChange} />
            </div>

            <div className="item">
              <label htmlFor="restaurant">Restaurant</label>
              <input type="number" min={0} id="restaurant" name="restaurant" value={formState.restaurant} onChange={handleChange} />
            </div>

            <button className="sendButton" disabled={submitting}>
              {submitting ? "Saving..." : "Update Property"}
            </button>
            {error && <span className="errorMessage">{error}</span>}
          </form>
        </div>
      </div>

      <div className="sideContainer">
        <p className="uploadHint">Manage property images (minimum 1)</p>

        {images.map((image, index) => (
          <div key={`${image}-${index}`} className="uploadPreview">
            <img src={image} alt="" />
            <button type="button" className="removePreview" onClick={() => removeImage(index)}>
              Remove
            </button>
          </div>
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
          buttonLabel="Upload More Images"
        />

        {!!images.length && (
          <p className="uploadCount">{images.length} image{images.length > 1 ? "s" : ""} selected</p>
        )}
      </div>
    </div>
  );
}

export default EditPostPage;
