import { createContext, useEffect, useRef, useState } from "react";

// Create a context to manage the script loading state
const CloudinaryScriptContext = createContext();

function UploadWidget({ uwConfig, setPublicId, setState, onUploadError, buttonLabel = "Upload" }) {
  const [loaded, setLoaded] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    // Check if the script is already loaded
    if (!loaded) {
      const uwScript = document.getElementById("uw");
      if (!uwScript) {
        // If not loaded, create and load the script
        const script = document.createElement("script");
        script.setAttribute("async", "");
        script.setAttribute("id", "uw");
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.addEventListener("load", () => setLoaded(true));
        document.body.appendChild(script);
      } else {
        // If already loaded, update the state
        setLoaded(true);
      }
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded || widgetRef.current || !window.cloudinary) return;

    widgetRef.current = window.cloudinary.createUploadWidget(
      uwConfig,
      (error, result) => {
        if (error) {
          if (onUploadError) {
            onUploadError("Image upload failed. Please try again.");
          }
          return;
        }

        if (result && result.event === "success") {
          if (setPublicId) {
            setPublicId(result.info.public_id);
          }

          if (setState) {
            const uploadedUrl = result.info?.secure_url || result.info?.url;

            if (!uploadedUrl) return;

            setState((prev) => {
              if (!Array.isArray(prev)) return [uploadedUrl];
              if (prev.includes(uploadedUrl)) return prev;
              return [...prev, uploadedUrl];
            });
          }
        }
      }
    );
  }, [loaded, onUploadError, setPublicId, setState, uwConfig]);

  const initializeCloudinaryWidget = () => {
    if (!loaded || !widgetRef.current) return;
    widgetRef.current.open();
  };

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      <button
        type="button"
        id="upload_widget"
        className="cloudinary-button"
        onClick={initializeCloudinaryWidget}
        disabled={!loaded}
      >
        {loaded ? buttonLabel : "Loading uploader..."}
      </button>
    </CloudinaryScriptContext.Provider>
  );
}

export default UploadWidget;
export { CloudinaryScriptContext };
