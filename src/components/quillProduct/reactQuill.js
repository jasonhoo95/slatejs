import React, { useEffect, useState } from "react";
import ReactQuill, { Quill, editor } from "react-quill";
// import ImageResize  from 'quill-image-resize-module';

// Quill.register('modules/ImageResize',ImageResize);
const Editor = () => {
	const [text, setText] = useState("");

	const handleChange = (html) => {
		setText(html);
	};
	const modules = {
		toolbar: {
			container: "#toolbar",
		},
	};
	const formats = [
		"font",
		"size",
		"bold",
		"italic",
		"underline",
		"strike",
		"color",
		"background",
		"script",
		"header",
		"blockquote",
		"code-block",
		"indent",
		"list",
		"direction",
		"align",
		"link",
		"image",
		"video",
		"formula",
	];

	return (
		<>
			<ReactQuill
				value={text}
				theme="snow"
				onChange={handleChange}
				formats={formats}
			/>
		</>
	);
};

export default Editor;
