import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import KatexPop from "./katexPop";
import _ from "lodash";
import { useDispatch } from "react-redux";
import { QuillComponent } from "./quillCustom";
// let Quill: any;
// Quill = require('quill');

export default function Quilljs({
	id,
	type,
	classname,
	htmlContent,
	height,
	displayType,
}) {
	const [mainID, setID] = useState(`quill-${id}`);
	const [display, setDisplay] = useState(false);
	const [modalType, setType] = useState();
	const [open, setOpen] = useState(false);
	const [quillMain, setQuill] = useState();
	const [openModal, setModal] = useState(null);
	const [modalValue, setValue] = useState({
		edit: false,
	});
	const [katexTxt, setKatexValue] = useState({
		id: "",
		value: "",
		edit: false,
	});

	var quill;

	useEffect(() => {
		document.getElementById("__next").classList.add("scrollingContainer");
	}, [height]);

	useEffect(() => {
		QuillComponent();
	}, []);

	useEffect(() => {
		var container = document.getElementById(mainID);
		var icons = Quill.import("ui/icons");
		icons[
			"bold"
		] = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
	<title>clubs</title>
	<path d="M24.588 12.274c-1.845 0-3.503 0.769-4.683 2.022-0.5 0.531-1.368 1.16-2.306 1.713 0.441-1.683 1.834-3.803 2.801-4.733 1.239-1.193 2-2.87 2-4.734 0-3.59-2.859-6.503-6.4-6.541-3.541 0.038-6.4 2.951-6.4 6.541 0 1.865 0.761 3.542 2 4.734 0.967 0.93 2.36 3.050 2.801 4.733-0.939-0.553-1.806-1.182-2.306-1.713-1.18-1.253-2.838-2.022-4.683-2.022-3.575 0-6.471 2.927-6.471 6.541s2.897 6.542 6.471 6.542c1.845 0 3.503-0.792 4.683-2.045 0.525-0.558 1.451-1.254 2.447-1.832-0.094 4.615-2.298 8.005-4.541 9.341v1.179h12v-1.179c-2.244-1.335-4.448-4.726-4.541-9.341 0.995 0.578 1.922 1.274 2.447 1.832 1.18 1.253 2.838 2.045 4.683 2.045 3.575 0 6.471-2.928 6.471-6.542s-2.897-6.541-6.471-6.541z"></path>
	</svg>
	`;
		var toolBarID = document.getElementById(`toolbar-${id}`);

		if (toolBarID) {
			var config = {
				scrollingContainer: classname ? "." + classname : null,
				placeholder: "edit it",
				debug: false,

				theme: type,
				modules: {
					history: {
						delay: 250,
						maxStack: 500,
					},
					syntax: true,
					toolbar: `#toolbar-${id}`,
					keyboard: {
						bindings: {
							"list autofill": {
								prefix: /^\s{0,}(1){1,1}(\.|-|\*|\[ ?\]|\[x\])$/,
								handler: function (range, context) {
									if (!context.format.header2Block) {
										const length = context.prefix.length;

										quill.deleteText(range.index - length, length);
										quill.format("list", "ordered");
									} else {
										return true;
									}
								},
							},
							// slash: {
							// 	key: 191,
							// 	handler: function (range, context) {
							// 		alert("go");
							// 	},
							// },
							linebreak: {
								key: 13,
								shiftKey: true,
								handler: function (range, context) {
									if (context.format.list == "bullet") {
										quill.setSelection(range.index, "silent");
										quill.insertText(range.index, "\n", "user");
										quill.setSelection(range.index + 1, "silent");
										quill.format("bulletbreak", true, "user");
									} else if (
										context.format.redDiv ||
										context.format.redDivInline
									) {
										quill.insertText(range.index, "\n");

										quill.format("redDivInline", {
											color: context.format.redDiv
												? quill.getFormat().redDiv.color
												: quill.getFormat().redDivInline.color,
										});

										// quill.formatLine(range.index + 1, nextLeaf.text.length, "redDivInline", true);
									} else if (
										context.format.header ||
										context.format.header2Block
									) {
										// quill.insertText(range.index, "\n", "user");
										quill.insertEmbed(range.index, "breakspan", true);
										quill.setSelection(range.index + 1, "silent");
									} else if (
										context.format.list == "ordered" ||
										context.format.list == "checked" ||
										context.format.list == "unchecked"
									) {
										quill.insertText(range.index, "\n", "user");
										quill.setSelection(range.index + 1, "silent");
										quill.format("linebreak", "unordered", "user");
									} else if (context.format["code-block"]) {
										return true;
									} else {
										quill.insertText(range.index, "\n");
										quill.format("paragraphInline", true);

										// quill.formatLine(range.index + 1, nextLeaf.text.length, "paragraphInline", true);
									}
								},
							},

							backspace: {
								key: 8,
								collapsed: true,

								handler: function (range, context) {
									if (quill.getFormat(range.index).header2Block) {
										if (quill.getLeaf(range.index)[1] == 0) {
											quill.removeFormat(range.index, 0);
											quill.format("paragraphBlock", true);
										} else {
											return true;
										}
									} else if (
										quill.getFormat(range.index)["code-block"] &&
										context.offset == 0
									) {
										quill.deleteText(range);

										quill.removeFormat(range);
										// quill.format("paragraphBlock", true);
									} else if (
										quill.getFormat(range.index).blockquote &&
										context.offset == 0
									) {
										quill.removeFormat(range);
									} else {
										return true;
									}
								},
							},

							enter: {
								key: 13,

								handler: function (range, context) {
									let nextLeaf = quill.getLeaf(range.index + 1)[0];

									if (context.format.list == "ordered") {
										quill.insertText(range.index, "\n");
										quill.format("linebreak", "true", "user");

										return false;
									} else if (context.format.list == "bullet") {
										quill.insertText(range.index, "\n");
										quill.format("bulletbreak", false, "user");
										return false;
									} else if (
										context.format.divblock ||
										context.format.redDivInline ||
										context.format.redDiv
									) {
										// quill.format("divblock", false);
										quill.insertText(range.index, "\n");
										let currentLeaf = quill.getLeaf(range.index + 1)[0];
										// quill.format("linebreak", false, "user");

										if (currentLeaf.text) {
											quill.formatLine(
												range.index + 1,
												currentLeaf.text.length,
												"redDiv",
												{
													color: context.format.redDiv
														? quill.getFormat().redDiv.color
														: quill.getFormat().redDivInline.color,
												}
											);
										} else {
											quill.formatLine(
												range.index + 1,
												0,
												"paragraphBlock",
												true
											);
										}

										return false;
									} else if (
										context.format.header ||
										(context.format.header2Block &&
											context.format.header2Block.class == "headerBlack")
									) {
										quill.insertText(range.index, "\n");
									} else if (
										context.format.align &&
										(!nextLeaf || !nextLeaf.parent.attributes.attributes.align)
									) {
										quill.removeFormat(range.index + 1, 0);
										quill.setSelection(range.index + 1, "silent");
										return false;
									} else if (context.format.value) {
										// var table = document.getElementById(context.format.id);
										// if (table.className.match("ql-selected")) {
										// 	quill.setSelection(range.index + 1);
										// 	table.classList.remove("ql-selected");
										// }
										let blot = Quill.find(
											document.getElementById(context.format.id)
										);
										// document.getElementById(format.id).classList.add("ql-selected");
										let index = blot.offset(quill.scroll);
										quill.updateContents(
											new Delta()
												.retain(index)
												.delete(1)
												.insert({
													htmlblot: {
														id: context.format.id,
														value: context.format.value,
														class: "1234gg",
													},
												})
										);
										quill.setSelection(range.index + 1);
										return false;
									} else if (context.format["code-block"]) {
										return true;
									} else {
										quill.insertText(range.index, "\n");
										quill.format("linebreak", false, "user");
										// quill.format("linebreak", "fadein");
										quill.format("paragraphBlock", { type: "paragraph" });
										return false;
										// quill.setSelection(range.index + 1);
									}

									// quill.format("bold", false);
									//
								},
							},
						},
					},
				},
			};

			quill = new Quill(container, config);
			setQuill(quill);
			Quill.register("suppressWarning");
			quill.root.setAttribute("spellcheck", false);
			document.querySelector(`#${mainID} .ql-editor`).style.maxHeight = height;

			var Delta = Quill.import("delta");
		}
	}, []);

	const walk = (node) => {
		for (const k of Object.keys(node))
			if (k === "domNode") {
				if (node[k].nodeName == "A") {
					setValue((prevState) => ({
						text: node[k],
						editLink: true,
					}));
					break;
				}
			} else if (k == "parent") {
				walk(node[k]);
			}
	};

	useEffect(() => {
		console.log(modalValue, "modal value");
	}, [modalValue]);

	useEffect(() => {
		if (quillMain) {
			var timeout;
			quillMain.on("text-change", function (range) {
				// setButton({ bold: false });
				// clearTimeout(timeout);
				// timeout = setInterval(function () {
				// 	var html = quillMain.root.innerHTML;
				// 	if (html) {
				// 		const maindata = globalStore.get("data");
				// 		var index = _.findIndex(maindata, { id: id });
				// 		if (index >= 0) {
				// 			maindata.splice(index, 1, { id: id, content: quillMain.root.innerHTML });
				// 		} else {
				// 			maindata.push({ id: id, content: quillMain.root.innerHTML });
				// 		}
				// 		globalStore.set("data", maindata);
				// 		clearTimeout(timeout);
				// 	}
				// }, 1000);
			});

			quillMain.off("selection-change");
			quillMain.on("selection-change", function (range, oldRange, source) {
				if (range) {
					var selection = quillMain.getSelection(true);

					setDisplay(true);

					if (
						quillMain.getFormat(selection).link ||
						quillMain.getFormat(selection).hreflink
					) {
						if (
							quillMain.getLeaf(selection.index)[0].next &&
							quillMain.getLeaf(selection.index)[0].next.domNode.nodeName == "A"
						) {
							setValue((prevState) => ({
								text: quillMain.getLeaf(selection.index)[0].next.domNode,
								editLink: true,
							}));
						} else {
							var obj = quillMain.getLeaf(selection.index)[0].parent;
							walk(obj);
						}
					} else {
						setValue({ editLink: false, edit: false });
						setType("");
					}
				} else {
					setDisplay(false);
				}
			});
		}
	}, [quillMain, modalValue]);

	useEffect(() => {
		if (quillMain) {
			$(quillMain.root).unbind();

			$(quillMain.root).click(function (e) {
				if (e.target.closest(".ql-formula")) {
					quillMain.blur();
					console.log(e.target.closest(".ql-formula"), "ql formular");
					var value = {
						id: e.target.closest(".ql-formula"),
						value: e.target.closest(".ql-formula").getAttribute("data-value"),
						edit: true,
					};
					setOpen(true);
					setValue(value);

					setDisplay(false);
				} else if (e.target.closest(".quill-mention")) {
					setValue({
						editMention: true,
						id: e.target.closest(".quill-mention"),
						text: e.target.closest(".quill-mention").getAttribute("data-name"),
					});
					setOpen(true);
					setDisplay(false);
				} else if (e.target.closest(".linebreak-unchecked")) {
					e.target.classList.remove("linebreak-unchecked");
					e.target.classList.add("linebreak-checked");
				}
			});

			// $(quillMain.root).on("keypress", function (e) {
			// 	if (e.key == "/") {
			// 		quillMain.blur();
			// 		setValue({ edit: false });

			// 		setModal(!openModal);
			// 		// $(quillMain.root).unbind();
			// 	}
			// });
		}
	}, [quillMain]);

	const setHeader = () => {
		quillMain.focus();
		const selection = quillMain.getSelection(true);
		const line = quillMain.getLeaf(selection.index);
		let [line1, offset] = quillMain.getLine(selection.index);
		let indexline = quillMain.getIndex(line1);
		if (line[0].parent.domNode.id) {
			quillMain.removeFormat(indexline, line[0].parent.cache.length);
			quillMain.format("header2Block", { class: "headerBig" });
		} else if (line[0].parent.parent.domNode.id) {
			quillMain.removeFormat(indexline, line[0].parent.parent.cache.length);
			quillMain.format("header2Block", { class: "headerBig" });
		} else {
			quillMain.format("header2Block", { class: "headerBig" });
		}
	};

	const insertImage = () => {
		var range = quillMain.getSelection(true);
		quillMain.insertEmbed(
			range.index,
			"image",
			"https://s3-ap-southeast-1.amazonaws.com/popmach/images/listing/9e9b2f79d6c5ce9e8938140df3a81201.jpg"
		);
	};

	const renderFixedToolBar = useMemo(() => {
		return (
			<div
				id={`toolbar-${id}`}
				style={{ display: display ? "block" : "none" }}
				className={`ql-toolbar`}>
				<span className="ql-formats">
					<button className="ql-bold"></button>
					<button className="ql-italic"></button>
					<button className="ql-underline"></button>
					<button className="ql-formula"></button>

					<button
						onClick={(e) => {
							setHeader();
						}}>
						H2
					</button>
					<button className="ql-blockquote"></button>
					<button className="ql-code-block"></button>

					<button
						className="ql-list"
						value="ordered"></button>
					<button
						className="ql-list"
						value="bullet"></button>
					<button
						onClick={(e) => {
							quillMain.format("color", "rgb(187, 0, 0)");
						}}>
						Color
					</button>
					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							setValue({ edit: false });
							setOpen(true);
							quillMain.blur();
						}}
						className="dropdown cursor-pointer">
						Katex
					</div>

					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							// quillMain.blur();
							// setModal(!openModal);
							const selection = quillMain.getSelection(true);
							// quillMain.formatText(selection, "size", "20px"); // bolds 'hello'
							quillMain.format("font", "Corinthia"); // bolds 'hello'

							// quillMain.format("align", "center"); // bolds 'hello'
						}}
						className="dropdown cursor-pointer">
						FontFamily
					</div>

					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							setOpen(true);
							if (modalValue.editLink) {
								quillMain.blur();

								setValue((prevState) => ({ ...prevState, editLink: true }));
							} else {
								const selection = quillMain.getSelection(true);
								quillMain.blur();
								setValue({
									text: quillMain.getText(selection),
									editLink: false,
								});
							}
						}}
						className="dropdown">
						{modalValue.editLink ? "Edit Link" : "Link"}
					</div>

					<div
						className="dropdown"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("list", true);
							quillMain.format("linebreak", "unchecked", "user");
						}}>
						CheckBox
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("code-block", true);
						}}>
						CodeBlock
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							const range = quillMain.getSelection(true);
							quillMain.insertEmbed(range.index, "videoFrame", "asdasd");
						}}>
						Image
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("ShadowInline", { color: "green" });
						}}>
						ShadowInline
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("redDivInline", { color: "green" });
						}}>
						Banner
					</div>
				</span>
			</div>
		);
	}, [display, modalValue, katexTxt, quillMain]);

	const renderNormalToolBar = useMemo(() => {
		return (
			<div
				id={`toolbar-${id}`}
				className={`ql-toolbar`}>
				<span className="ql-formats">
					<button className="ql-bold"></button>
					<button className="ql-italic"></button>
					<button className="ql-underline"></button>
					<button className="ql-formula"></button>

					<button
						onClick={(e) => {
							setHeader();
						}}>
						H2
					</button>
					<button className="ql-blockquote"></button>
					<button className="ql-code-block"></button>

					<button
						className="ql-list"
						value="ordered"></button>
					<button
						className="ql-list"
						value="bullet"></button>
					<button
						onClick={(e) => {
							quillMain.format("color", "rgb(187, 0, 0)");
						}}>
						Color
					</button>
					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							// setLinkTxt({ text: quillMain.getText(selection), edit: false });
							setValue({ edit: false });
							setOpen(true);
							quillMain.blur();
						}}
						className="dropdown cursor-pointer">
						Katex
					</div>

					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							setValue({ editMention: false });
							setOpen(true);
							quillMain.blur();
						}}
						className="dropdown cursor-pointer">
						set Mention
					</div>

					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							// quillMain.blur();
							// setModal(!openModal);
							const selection = quillMain.getSelection(true);
							// quillMain.formatText(selection, "size", "20px"); // bolds 'hello'
							quillMain.format("font", "Corinthia"); // bolds 'hello'

							// quillMain.format("align", "center"); // bolds 'hello'
						}}
						className="dropdown cursor-pointer">
						FontFamily
					</div>

					<div
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							const selection = quillMain.getSelection(true);
							setType("link");
							quillMain.blur();
							if (selection.length > 0) {
								setOpen(true);
							} else if (modalValue.editLink) {
								setOpen(true);
								setValue((prevState) => ({ ...prevState, editLink: true }));
							}
						}}
						className="dropdown cursor-pointer">
						{modalValue.editLink ? "Edit Link" : "Link"}
					</div>

					<div
						className="dropdown"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("list", true);
							quillMain.format("linebreak", "unchecked", "user");
						}}>
						CheckBox
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("code-block", true);
						}}>
						CodeBlock
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							const range = quillMain.getSelection(true);
							quillMain.insertEmbed(range.index, "videoFrame", "asdasd");
						}}>
						Image
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("ShadowInline", { color: "green" });
						}}>
						ShadowInline
					</div>

					<div
						className="dropdown cursor-pointer"
						style={{ whiteSpace: "nowrap" }}
						onClick={(e) => {
							quillMain.format("redDivInline", { color: "green" });
						}}>
						Banner
					</div>
				</span>
			</div>
		);
	}, [display, modalValue, katexTxt, quillMain]);

	const renderElement = () => {
		if (displayType == "modal-component") {
			return renderModalToolBar;
		} else if (displayType == "fixed-component") {
			return renderFixedToolBar;
		} else if (displayType == "normal-component") {
			return renderNormalToolBar;
		}
	};

	return (
		<>
			{quillMain ? (
				<KatexPop
					dataValue={modalValue}
					type={modalType}
					quill={quillMain}
					open={open}
					setOpen={setOpen}
				/>
			) : null}
			<div
				className={`quill-wrap`}
				id={`main${id}`}
				style={{ visibility: quillMain ? "visible" : "hidden" }}>
				{renderElement()}
				{/* <FixedToolBar /> */}

				<div
					style={{ maxHeight: height }}
					className="ql-margin"
					id={mainID}>
					<div className="ql-editor">
						<div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
					</div>
				</div>
			</div>
		</>
	);
}
