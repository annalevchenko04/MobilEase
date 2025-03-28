import { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";

const EditorComponent = ({ onChange, initialContent }) => {
    const editorInstance = useRef(null);
    const editorRef = useRef(null);

   useEffect(() => {
    if (!editorRef.current || editorInstance.current) return;

    editorInstance.current = new EditorJS({
        holder: editorRef.current,
        placeholder: "Start typing here...",
        tools: {
            header: {
                class: Header,
                config: { levels: [3], defaultLevel: 3 }
            },
            list: { class: List, inlineToolbar: true },
            table: { class: Table, inlineToolbar: true },
        },
        data: initialContent ? JSON.parse(initialContent) : {}, // Load existing content
        async onChange() {
            const outputData = await editorInstance.current.save();
            onChange(JSON.stringify(outputData));
        },
    });

    return () => {
        if (editorInstance.current && typeof editorInstance.current.destroy === "function") {
            editorInstance.current.destroy();
            editorInstance.current = null;
        }
    };
}, [initialContent]);


    return <div ref={editorRef} style={{ minHeight: "200px", border: "1px solid #00d1b2", padding: "10px", overflow: "auto" }}></div>;

};

export default EditorComponent;
