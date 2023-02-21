import React, { useCallback, useMemo, useState, useEffect } from "react";
import isUrl from "is-url";

import isHotkey from "is-hotkey";

import { css } from "@emotion/css";
import { v4 } from "uuid";
import ComponentEditModal from "./quillProduct/componentEditModal";
import {
	Editable,
	withReact,
	useSlate,
	Slate,
	ReactEditor,
	useSelected,
	useFocused,
} from "slate-react";
import {
	Editor,
	Transforms,
	createEditor,
	Path,
	Descendant,
	Element as SlateElement,
	Text,
	Range,
	Node,
} from "slate";
import { withHistory, HistoryEditor } from "slate-history";

import { useModalStore } from "@/globals/zustandGlobal";
const HOTKEYS = {
	"mod+b": "bold",
	"mod+i": "italic",
	"mod+u": "underline",
	"mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];
const FORMAT_TYPES = ["bold", "italic", "underline"];
const FORMAT_NONE = ["numbered-list", "paragraph"];
const initialValue = [
	{
		type: "paragraph",
		children: [{ text: "" }],
	},
	// {
	// 	type: "editable-void",
	// 	children: [{ text: "" }],
	// },
];

const SlateReact = () => {
	let id = v4();

	useEffect(() => {
		window.addEventListener(
			"message",
			function (event) {
				if (event.data == "bold") {
					toggleMark(editor, "bold");

					if (event.ports[0] != null) {
						// the port is ready for communication,
						// so you can use port.postMessage(message); wherever you want
						var port = event.ports[0];
						// To listen to messages coming from the Dart side, set the onmessage event listener
						port.onmessage = function (event) {
							// event.data contains the message data coming from the Dart side
						};
					}
					// capture port2 coming from the Dart side
				}
			},
			false
		);
	}, []);
	const [state, setState] = useState({
		text: "",
		numbering: false,
		backward: false,
	});
	const ModalProps = useModalStore((state) => state.amount);

	const [open, setOpen] = useState(false);
	const renderElement = useCallback((props) => <Element {...props} />, []);
	const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
	const editor = useMemo(
		() => withInlines(withHistory(withReact(createEditor()))),
		[]
	);
	const { deleteFragment, deleteBackward, onChange } = editor;

	useEffect(() => {
		if (ModalProps?.open) {
			setOpen(true);
		} else {
			setOpen(false);
		}
	}, [ModalProps]);
	const { insertBreak } = editor;

	editor.insertBreak = () => {
		const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);

		const listItems = Editor.nodes(editor, {
			at: editor.selection.anchor,
			match: (n) =>
				n.type == "list-item" ||
				n.type == "banner-red-wrapper" ||
				n.type == "katex",
		});
		let currentParent;
		for (const listItem of listItems) {
			currentParent = Editor.node(editor, listItem[1]);
		}
		const previousKatex = Editor.previous(editor, {
			at: editor.selection.anchor,
		});

		if (
			currentParent &&
			["list-item", "banner-red-wrapper"].includes(currentParent[0].type) &&
			!previousKatex[0].type &&
			selectedLeaf.text.length == 0
		) {
			toggleBlock(editor, currentParent[0].type);
		} else if (
			currentParent &&
			["list-item"].includes(currentParent[0].type) &&
			(previousKatex[0].type == "katex" || selectedLeaf.text.length > 0)
		) {
			insertBreak();
		} else {
			Transforms.insertNodes(editor, {
				children: [{ text: "" }],
				type: "paragraph",
			});
			return;
		}
	};

	editor.deleteBackward = (...args) => {
		let listItemParent;
		let previousParent;
		let nextParent;

		const listItems = Editor.nodes(editor, {
			at: editor.selection.anchor.path,
			match: (n) =>
				n.type === "paragraph" ||
				n.type == "list-item" ||
				n.type == "banner-red-wrapper" ||
				n.type == "katex",
		});

		for (const listItem of listItems) {
			listItemParent = Editor.node(editor, listItem[1]);
			previousParent = Editor.previous(editor, {
				at: listItem[1],
			});
			nextParent = Editor.next(editor, { at: listItem[1] });
		}

		if (
			previousParent &&
			previousParent[0].type == "editable-void" &&
			editor.selection.anchor.offset == 0
		) {
			Transforms.move(editor, { distance: 2, unit: "offset", reverse: true });
		} else {
			//

			const previousKatex = Editor.previous(editor, {
				at: editor.selection.anchor.path,
				match: (n) =>
					!Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "katex",
			});

			console.log(previousKatex, "previous katex");

			if (
				nextParent &&
				nextParent[0].type == "banner-red-wrapper" &&
				previousParent &&
				previousParent[0].type == "banner-red-wrapper"
			) {
				deleteBackward(...args);
				const previousKatex = Editor.node(editor, editor.selection.anchor.path);
				if (previousKatex[0].type == "katex") {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}

				const nextNode1 = Editor.next(editor, {
					at: editor.selection.anchor.path,
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						n.type == "banner-red-wrapper",
				});

				console.log(nextNode1, "banner red wrapper next node");

				Transforms.mergeNodes(editor, {
					at: nextNode1[1],
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						n.type == "banner-red-wrapper",
				});

				const nextNode2 = Editor.next(editor, {
					at: editor.selection.anchor.path,
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						n.type == "numbered-list",
				});

				if (nextNode2 && nextNode2[0].type == "numbered-list") {
					Transforms.mergeNodes(editor, {
						at: nextNode2[1],
						match: (n) =>
							!Editor.isEditor(n) &&
							SlateElement.isElement(n) &&
							n.type == "numbered-list",
					});
				}
			} else if (
				nextParent &&
				previousParent &&
				(previousParent[0].type == "numbered-list" ||
					nextParent[0].type == "numbered-list")
			) {
				console.log(
					"merge numbering",
					previousParent,
					nextParent,
					listItemParent[1]
				);
				deleteBackward(...args);

				const previousKatex = Editor.node(editor, editor.selection.anchor.path);
				if (previousKatex[0].type == "katex") {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}
				const nextNode = Editor.next(editor, {
					at: editor.selection.anchor.path,
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						n.type == "numbered-list",
				});

				Transforms.mergeNodes(editor, {
					at: nextNode[1],
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						n.type == "numbered-list",
				});
			} else if (
				listItemParent &&
				listItemParent[0].type == "list-item" &&
				listItemParent[1].includes(0) &&
				editor.selection.anchor.offset == 0 &&
				!previousKatex
			) {
				console.log("numbering match", listItemParent);
				Transforms.unwrapNodes(editor, {
					match: (n) =>
						!Editor.isEditor(n) &&
						SlateElement.isElement(n) &&
						LIST_TYPES.includes(n.type),
					split: true,
				});

				Transforms.setNodes(editor, { type: "paragraph" });
			} else {
				deleteBackward(...args);

				// Editor.deleteBackward(editor, { unit: "word" });
				const previousKatex = Editor.node(editor, editor.selection.anchor.path);

				if (previousKatex[0].type == "katex") {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}
			}
		}
	};

	editor.deleteFragment = (...args) => {
		deleteFragment(...args);

		const listItems = Editor.nodes(editor, {
			match: (n) => n.type === "list-item",
		});

		for (const listItem of listItems) {
			const parent = Editor.parent(editor, listItem[1]);

			if (
				parent &&
				!["numbered-list", "bulleted-list"].includes(parent[0].type)
			) {
				Transforms.setNodes(
					editor,
					{ type: "paragraph" },
					{
						at: listItem[1],
						match: (n) => n.type === "list-item",
					}
				);
			}
		}
	};

	return (
		<div>
			<ComponentEditModal
				open={open}
				setOpen={setOpen}
				editor={ModalProps?.editor}
				element={ModalProps?.element}
				path={ModalProps?.path}
			/>
			{state.text}
			<Slate
				editor={editor}
				value={initialValue}>
				<div
					style={{
						position: "fixed",
						background: "red",
						overflowX: "auto",
						left: 0,
						top: 0,
						width: "100%",
						display: "flex",
						zIndex: 30,
						padding: "10px",
					}}>
					<MarkButton
						format="bold"
						icon="format_bold"
					/>
					<BlockButton
						format="bulleted-list"
						icon="format_list_numbered"
					/>
					<BlockButton
						format="numbered-list"
						icon="format_list_item"
					/>

					<BlockButton
						format="url-link"
						icon="format_list_item"
					/>

					<BlockButton
						format="katex-link"
						icon="format_list_item"
					/>

					<div
						onClick={(e) => {
							const block = { type: "banner-red-wrapper", children: [] };
							Transforms.wrapNodes(editor, block);
						}}>
						Banner red
					</div>

					<div
						onClick={(e) => {
							const text = { text: "", type: "heading-one" };
							// const block = { type: "editable-void", children: [text] };
							const block = { type: "heading-one", children: [text] };

							Transforms.setNodes(editor, block);
							ReactEditor.focus(editor);
						}}>
						insert void
					</div>
				</div>

				<Editable
					renderElement={renderElement}
					autoCapitalize="off"
					autoFocus
					className="editable-slate"
					id={id}
					renderLeaf={renderLeaf}
					onKeyDown={(event) => {
						for (const hotkey in HOTKEYS) {
							if (isHotkey(hotkey, event)) {
								event.preventDefault();
								const mark = HOTKEYS[hotkey];
								toggleMark(editor, mark);
							}
						}

						const curretNode = Node.parent(
							editor,
							editor.selection.anchor.path
						);
						const selectedLeaf = Node.leaf(
							editor,
							editor.selection.anchor.path
						);
						// setState({ text: selectedLeaf.text });

						if (
							event.key == "Enter" &&
							event.shiftKey &&
							curretNode.type == "list-item"
						) {
							event.preventDefault();

							const nextNode = Editor.next(editor, {
								at: editor.selection.anchor.path,
							});

							console.log(nextNode, "shift next node");

							Transforms.insertText(editor, "\n");
							// if (nextNode && nextNode[0].type == "katex") {
							// 	Transforms.select(editor, nextNode[1]);
							// 	Transforms.move(editor);
							// }
						} else if (event.metaKey && event.key === "z" && !event.shiftKey) {
							event.preventDefault();
							HistoryEditor.undo(editor);
						} else if (event.metaKey && event.shiftKey && event.key === "z") {
							event.preventDefault();
							HistoryEditor.redo(editor);
						} else if (selectedLeaf.text.startsWith("1.")) {
							event.preventDefault();
							toggleBlock(editor, "numbered-list", "number");
							Transforms.delete(editor, {
								at: editor.selection.anchor,
								unit: "word",
								reverse: true,
							});

							// checklist(editor);
						}
					}}
				/>
			</Slate>
		</div>
	);
};

const wrapLink = (editor, url) => {
	if (isLinkActive(editor)) {
		unwrapLink(editor);
	}

	const { selection } = editor;
	const isCollapsed = selection && Range.isCollapsed(selection);
	const link = {
		type: "link",
		url,
		children: isCollapsed ? [{ text: url }] : [],
	};

	if (isCollapsed) {
		Transforms.insertNodes(editor, link);
	} else {
		Transforms.wrapNodes(editor, link, { split: true });
		Transforms.collapse(editor, { edge: "end" });
	}
};

const insertLink = (editor, url) => {
	if (editor.selection) {
		wrapLink(editor, url);
	}
};

const insertKatex = (editor, url) => {
	if (editor.selection) {
		let data = {
			url: url,
			editor: editor,
			path: editor.selection.anchor,
			open: true,
		};
		updateAmount(data);
		// ReactEditor.blur(editor);
		// wrapKatex(editor, url, editor.selection);
	}
};

const withInlines = (editor) => {
	const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

	editor.isInline = (element) =>
		["link", "button", "katex", "inline-bug"].includes(element.type) ||
		isInline(element);

	editor.isVoid = (element) =>
		["katex", "editable-void"].includes(element.type) || isVoid(element);

	editor.markableVoid = (element) => {
		return element.type === "katex" ? true : markableVoid(element);
	};

	return editor;
};

const LinkComponent = ({ attributes, children, element }) => {
	const selected = useSelected();
	return (
		<a
			{...attributes}
			className={
				selected
					? css`
							box-shadow: 0 0 0 3px #ddd;
					  `
					: ""
			}
			href={element.url}>
			<InlineChromiumBugfix />
			{children}
			<InlineChromiumBugfix />
		</a>
	);
};

const InlineChromiumBugfix = ({ attributes, children, element }) => {
	return (
		<span
			contentEditable={false}
			className={css`
				font-size: 0;
			`}>
			${String.fromCodePoint(160) /* Non-breaking space */}
		</span>
	);
};

const KatexComponent = ({ attributes, children, element }) => {
	const katextext = katex.renderToString(String.raw`${element.url}`);
	const editor = useSlate();
	const selected = useSelected();
	const focused = useFocused();
	let updateAmount = useModalStore((state) => state.updateModal);
	let updateClick = useModalStore((state) => state.updateClick);

	const clickProps = useModalStore((state) => state.click);

	return (
		<span
			onClick={(e) => {
				if (focused) {
					let data = {
						element: element,
						editor: editor,
						click: true,
						open: true,
						path: ReactEditor.findPath(editor, element),
					};
					updateAmount(data);
					updateClick(element.id);
				}
			}}
			style={{
				// userSelect: "none",
				background:
					(selected && focused) || element.id == clickProps ? "red" : "",
			}}
			contentEditable="false"
			className="span-katex"
			{...attributes}>
			<span dangerouslySetInnerHTML={{ __html: katextext }}></span>
			<InlineChromiumBugfix />
			{children}
			<InlineChromiumBugfix />
			{/* <RenderModal /> */}
		</span>
	);
};

const isLinkActive = (editor) => {
	const [link] = Editor.nodes(editor, {
		match: (n) =>
			!Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
	});
	return !!link;
};

const MarkButton = ({ format, icon }) => {
	const editor = useSlate();
	return (
		<div
			style={{ padding: "10px" }}
			onMouseDown={(event) => {
				event.preventDefault();
				toggleMark(editor, format);
			}}>
			{format}
		</div>
	);
};

const BlockButton = ({ format, icon }) => {
	const editor = useSlate();
	let updateAmount = useModalStore((state) => state.updateModal);
	if (format == "numbered-list") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					event.preventDefault();
					toggleBlock(editor, "numbered-list", "number");
				}}>
				number list
			</div>
		);
	} else if (format == "url-link") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					event.preventDefault();
					const url = window.prompt("Enter the URL of the link:");
					if (!url) return;
					insertLink(editor, url);
				}}>
				URL LINK
			</div>
		);
	} else if (format == "katex-link") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					event.preventDefault();
					let data = {
						url: "jkl",
						editor: editor,
						path: editor.selection.anchor,
						open: true,
					};
					updateAmount(data);
					// insertKatex(editor, "jjk");
				}}>
				Katex Link
			</div>
		);
	} else {
		return (
			<div
				onMouseDown={(event) => {
					event.preventDefault();
					toggleBlock(editor, format);
				}}>
				bullet list
			</div>
		);
	}
};

const toggleMark = (editor, format) => {
	const isActive = isMarkActive(editor, format);

	if (isActive) {
		Editor.removeMark(editor, format);
	} else {
		Editor.addMark(editor, format, true);
	}
};

const toggleBlock = (editor, format, type) => {
	const isActive = isBlockActive(
		editor,
		format,
		TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
	);
	const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);
	const isList = LIST_TYPES.includes(format) || format == "banner-red-wrapper";
	const currentParent = Editor.parent(editor, editor.selection.anchor.path, {
		depth: 2,
	});

	if (type != "number") {
		Transforms.unwrapNodes(editor, {
			match: (n) =>
				!Editor.isEditor(n) &&
				SlateElement.isElement(n) &&
				(LIST_TYPES.includes(n.type) || n.type == "banner-red-wrapper"),
			split: true,
		});
	} else {
		Transforms.unwrapNodes(editor, {
			match: (n) =>
				!Editor.isEditor(n) &&
				SlateElement.isElement(n) &&
				LIST_TYPES.includes(n.type),
			split: true,
		});
	}

	let newProperties;
	if (TEXT_ALIGN_TYPES.includes(format)) {
		newProperties = {
			align: isActive ? undefined : format,
		};
	} else {
		newProperties = {
			type: isActive ? "paragraph" : isList ? "list-item" : format,
		};
	}
	Transforms.setNodes(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}
};

const isBlockActive = (editor, format, blockType = "type") => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		Editor.nodes(editor, {
			at: Editor.unhangRange(editor, selection),
			match: (n) =>
				!Editor.isEditor(n) &&
				SlateElement.isElement(n) &&
				n[blockType] === format,
		})
	);

	return !!match;
};

const EditableVoid = ({ attributes, children, element }) => {
	const editor = useSlate();
	const selected = useSelected();
	const focused = useFocused();

	return (
		// Need contentEditable=false or Firefox has issues with certain input types.
		<div
			style={{
				border: "1px solid grey",
				background: selected && focused ? "green" : "",
			}}
			{...attributes}
			contentEditable="false">
			<div>
				<div
					style={{ background: "red" }}
					onClick={(e) => {
						const path = ReactEditor.findPath(editor, element);
						Transforms.removeNodes(editor, { at: path });
						if (editor.children.length == 0) {
							Transforms.insertNodes(editor, {
								type: "paragraph",
								children: [{ text: "" }],
							});
						}
					}}>
					DELETE
				</div>
				<h4>Name:</h4>
				<div>{/* <SlateReact /> */}</div>
				<h4>Left or right handed:</h4>
				<input
					type="radio"
					name="handedness"
					value="left"
				/>{" "}
				Left
				<br />
				<input
					type="radio"
					name="handedness"
					value="right"
				/>{" "}
				Right
				<h4>Tell us about yourself:</h4>
				<div></div>
			</div>
			{children}
		</div>
	);
};

const isMarkActive = (editor, format) => {
	const marks = Editor.marks(editor);
	return marks ? marks[format] === true : false;
};

const Heading1Component = ({ attributes, children, element }) => {
	return (
		<h1
			style={{ fontSize: "30px", fontWeight: "bold", color: "red" }}
			{...attributes}>
			{children}
		</h1>
	);
};

const Element = (props) => {
	const { attributes, children, element } = props;

	const style = { textAlign: element.align };
	switch (element.type) {
		case "block-quote":
			return (
				<blockquote
					style={style}
					{...attributes}>
					{children}
				</blockquote>
			);
		case "bulleted-list":
			return (
				<ul
					style={style}
					{...attributes}>
					{children}
				</ul>
			);
		case "link":
			return <LinkComponent {...props} />;
		case "katex":
			return <KatexComponent {...props} />;
		case "inline-bug":
			return <InlineChromiumBugfix {...props} />;
		case "editable-void":
			return <EditableVoid {...props}></EditableVoid>;
		case "heading-one":
			return <Heading1Component {...props}></Heading1Component>;
		case "heading-two":
			return (
				<h2
					style={style}
					{...attributes}>
					{children}
				</h2>
			);
		case "list-item":
			return (
				<li
					style={style}
					{...attributes}>
					{children}
				</li>
			);
		case "numbered-list":
			return (
				<ol
					style={style}
					{...attributes}>
					{children}
				</ol>
			);
		case "banner-red":
			return (
				<p
					className="banner-red"
					style={{ marginTop: "10px" }}
					{...attributes}>
					{children}
				</p>
			);
		case "banner-red-inline":
			return (
				<p
					className="banner-red"
					{...attributes}>
					{children}
				</p>
			);

		case "banner-red-wrapper":
			return (
				<div
					className="banner-red"
					{...attributes}>
					{children}
				</div>
			);
		case "paragraph-inline":
			return <p {...attributes}>{children}</p>;
		case "paragraph":
			return (
				<p
					style={{ marginTop: "5px" }}
					{...attributes}>
					{children}
				</p>
			);
		default:
			return <p {...attributes}>{children}</p>;
	}
};

const Leaf = ({ attributes, children, leaf }) => {
	if (leaf.bold) {
		children = <strong>{children}</strong>;
	}

	if (leaf.code) {
		children = <code>{children}</code>;
	}

	if (leaf.inline) {
		children = <span style={{ color: "red" }}>{children}</span>;
	}

	if (leaf.italic) {
		children = <em>{children}</em>;
	}

	if (leaf.underline) {
		children = <u>{children}</u>;
	}

	return (
		<span
			className={
				leaf.text === ""
					? css`
							padding-left: 0.1px;
					  `
					: null
			}
			{...attributes}>
			{children}
		</span>
	);
};

export default SlateReact;
