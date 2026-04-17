import { useEffect, useRef } from "react";
import Quill from "quill";

function Editor({ value, onChange }) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (quillRef.current || !wrapperRef.current) return;

    // Quill inserts toolbar as a sibling element. Clearing wrapper removes stale toolbars.
    wrapperRef.current.innerHTML = "";
    const editorHost = document.createElement("div");
    wrapperRef.current.appendChild(editorHost);

    const quill = new Quill(editorHost, {
      theme: "snow",
      placeholder: "Write a clear and attractive property description...",
    });

    const handleTextChange = () => {
      onChangeRef.current(quill.root.innerHTML);
    };

    quill.on("text-change", handleTextChange);

    quillRef.current = quill;

    return () => {
      quill.off("text-change", handleTextChange);
      quillRef.current = null;

      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const nextValue = value ?? "";

    if (quillRef.current.root.innerHTML !== nextValue) {
      quillRef.current.root.innerHTML = nextValue;
    }
  }, [value]);

  return <div ref={wrapperRef} />;
}

export default Editor;