import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import isUrl from "is-url";

import isHotkey from "is-hotkey";

import { css } from "@emotion/css";
import { v4 } from "uuid";
import ComponentEditModal from "./quillProduct/componentEditModal";
import { Editable, withReact, useSlate, Slate, ReactEditor, useSelected, useFocused } from "slate-react";
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Text, Range, Node } from "slate";
import { withHistory, HistoryEditor } from "slate-history";
import { useBearStore, useAuthStore } from "@/globals/authStorage";

import { useModalStore } from "@/globals/zustandGlobal";

import _ from "lodash";
import next from "next";
const HOTKEYS = {
	"mod+b": "bold",
	"mod+i": "italic",
	"mod+u": "underline",
	"mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list", "list-item"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];
const FORMAT_TYPES = ["bold", "italic", "underline"];
const FORMAT_NONE = ["numbered-list", "paragraph"];
let backwardCheck = false;
let leftCheck = false;
let rightCheck = false;
let blurCheck = "false";
// let focusCheck = false;
const initialValue = [
	{
		type: "paragraph",
		children: [
			{
				text: "a",
			},
		],
	},
	// {
	// 	type: "editable-void",
	// 	children: [{ text: "" }],
	// },
];

function getCaretCoordinates() {
	let x = 0,
		y = 0;
	const isSupported = typeof window.getSelection !== "undefined";
	if (isSupported) {
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) {
			return;
		}
		const range = sel.getRangeAt(0);
		// we can still workaround the default behavior too
		const rects = range.getClientRects();
		if (!rects.length) {
			if (range.startContainer && range.collapsed) {
				range.selectNodeContents(range.startContainer);
			}
		}

		let position = range.getBoundingClientRect();
		const char_before = range.startContainer.textContent;

		// if we are on a \n
		//
		if (range.collapsed && !char_before) {
			// create a clone of our Range so we don't mess with the visible one
			const clone = range.cloneRange();
			sel.removeAllRanges();
			sel.addRange(clone);

			position = clone.getBoundingClientRect();

			// check if we are experiencing a bug
			// clone.setStart(range.startContainer, range.startOffset - 1);
			// if (clone.getBoundingClientRect().top === position.top) {
			// 	// make it select the next character
			// 	clone.setStart(range.startContainer, range.startOffset + 1);
			// 	position = clone.getBoundingClientRect();
			// }
		}

		x = position.x;
		y = position.y + window.scrollY - 100;
		window.scrollTo({ top: y, behavior: "smooth" });
	}
	// return { x, y };
}

const SlateReact = () => {
	let id = v4();
	let updateAmount = useModalStore((state) => state.updateModal);

	useEffect(() => {
		window.addEventListener("message", function (event) {
			if (event.data == "bold") {
				ReactEditor.blur(editor);
				// toggleMark(editor, "bold");
				// const url = window.prompt("Enter the URL of the link:");
				// if (!url) return;
				// insertLink(editor, url);

				insertKatex(editor, "jjk", updateAmount);
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
			getCaretCoordinates();
		});

		window.flutter_inappwebview?.callHandler("handlerFoo").then(function (result) {
			// print to the console the data coming
			// from the Flutter side.
			window.flutter_inappwebview.callHandler("handlerFooWithArgs", 1, true, ["bar", 5], { foo: "baz" }, result);
		});
	}, []);
	const [state, setState] = useState({
		text: "",
		numbering: false,
		backward: false,
	});
	const [focus, setFocus] = useState(true);
	const ModalProps = useModalStore((state) => state.amount);
	const contentEditableRef = useRef(null);

	const [open, setOpen] = useState(false);
	const renderElement = useCallback((props) => <Element {...props} />, []);
	const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
	const editor = useMemo(() => withInlines(withHistory(withReact(createEditor()))), []);
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
			match: (n) => n.type == "list-item" || n.type == "banner-red-wrapper" || n.type == "katex",
		});
		let currentParent, currentDescendant;
		for (const listItem of listItems) {
			currentParent = Editor.node(editor, listItem[1]);
			currentDescendant = Node.descendant(editor, listItem[1], { match: (n) => n.type == "paragraph" });
		}
		const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "paragraph" });

		if (currentParent && ["list-item"].includes(currentParent[0].type) && currentParent[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
			toggleBlock(editor, currentParent[0].type);
		} else if (currentParent && ["banner-red-wrapper"].includes(currentParent[0].type) && parentCheck[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
			toggleBlock(editor, currentParent[0].type);
		} else {
			insertBreak();
			const selectedLeaf1 = Node.leaf(editor, editor.selection.anchor.path);

			if (selectedLeaf1.text.length == 0) {
				const isActive = isBlockActive(editor, "heading-one", TEXT_ALIGN_TYPES.includes("heading-one") ? "align" : "type");
				if (isActive) {
					Transforms.setNodes(editor, { type: "paragraph" });
				}
				FORMAT_TYPES.map((o) => {
					Editor.removeMark(editor, o);
				});
			}
		}
	};

	editor.deleteBackward = (...args) => {
		let listItemParent;
		let previousParent;
		let nextParent;
		const [listItems] = Editor.nodes(editor, {
			at: editor.selection.anchor.path,
			match: (n) => ["banner-red-wrapper", "paragraph", "list-item"].includes(n.type),
		});

		if (listItems) {
			listItemParent = Editor.node(editor, listItems[1]);
			previousParent = Editor.previous(editor, {
				at: listItems[1],
			});
			nextParent = Editor.next(editor, { at: listItems[1] });
		}

		const currentNodeParent = Editor.node(editor, {
			at: editor.selection.anchor.path,
		});
		if (nextParent && nextParent[0].type == "banner-red-wrapper" && previousParent && previousParent[0].type == "banner-red-wrapper") {
			deleteBackward(...args);
			if (!backwardCheck) {
				backwardCheck = true;

				const currentNode = Editor.node(editor, editor.selection.anchor.path);

				if (["katex", "inline-bug"].includes(currentNode[0].type)) {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}

				Transforms.mergeNodes(editor, {
					at: listItemParent[1],
					match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "banner-red-wrapper",
				});
				const listItems = Editor.nodes(editor, {
					at: editor.selection.anchor.path,
					match: (n) => ["list-item", "paragraph", "banner-red-wrapper"].includes(n.type),
				});
				let listCheck;
				let nextnode;
				for (const listItem of listItems) {
					listCheck = Editor.node(editor, listItem[1]);
					nextnode = Editor.next(editor, {
						at: listItem[1],
						match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list", "paragraph"].includes(n.type),
					});
				}

				//
				if (nextnode && ["numbered-list", "bulleted-list"].includes(nextnode[0].type) && listCheck && listCheck[0].type == "list-item") {
					Transforms.mergeNodes(editor, {
						at: nextnode[1],
						match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
					});
				}
			}
		} else if (
			nextParent &&
			previousParent &&
			["numbered-list", "bulleted-list"].includes(previousParent[0].type) &&
			["numbered-list", "bulleted-list"].includes(nextParent[0].type) &&
			previousParent[0].type == nextParent[0].type
		) {
			deleteBackward(...args);

			if (!backwardCheck) {
				backwardCheck = true;
				const currentNode = Editor.node(editor, editor.selection.anchor);

				if (["katex", "inline-bug"].includes(currentNode[0].type)) {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}

				Transforms.mergeNodes(editor, {
					at: listItemParent[1],
					match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
				});
			}
		} else if (
			listItemParent &&
			listItemParent[0].type == "list-item" &&
			listItemParent[1][listItemParent[1].length - 1] == 0 &&
			editor.selection.anchor.offset == 0 &&
			currentNodeParent[1].at[currentNodeParent[1].at.length - 1] == 0
		) {
			toggleBlock(editor, "list-item");
		} else {
			// Editor.deleteBackward(editor, { unit: "word" });
			const string = Node.leaf(editor, editor.selection.anchor.path);

			//
			if (string.text.length == 0) {
				deleteBackward(...args);

				if (!backwardCheck) {
					backwardCheck = true;
					const string = Node.leaf(editor, editor.selection.anchor.path);
					const [listItems] = Editor.nodes(editor, {
						at: editor.selection.anchor.path,
						match: (n) => ["list-item", "katex", "inline-bug"].includes(n.type),
					});

					const currentNode = Editor.node(editor, editor.selection.anchor);

					if (currentNode && (currentNode[0].type == "katex" || currentNode[0].type == "inline-bug")) {
						Transforms.move(editor, { distance: 1, unit: "offset" });
					}

					if (string.text.length == 0 && !listItems) {
						Transforms.setNodes(editor, { type: "paragraph" });
						FORMAT_TYPES.map((o) => {
							Editor.removeMark(editor, o);
						});
					}
				}
			} else {
				deleteBackward(...args);

				if (!backwardCheck) {
					backwardCheck = true;
					const currentNode = Editor.node(editor, editor.selection.anchor.path);
					const previousNode = Editor.previous(editor, { at: editor.selection.anchor.path });
					const nextNode = Editor.next(editor, { at: editor.selection.anchor.path });

					if (currentNode[0].type == "katex" || currentNode[0].type == "inline-bug") {
						Transforms.move(editor, { distance: 1, unit: "offset" });
					} else if (previousNode && nextNode && previousNode[0].type == "link" && nextNode[0].type == "link") {
						Transforms.delete(editor, { at: editor.selection.anchor.path });
					}
				}
			}
		}
	};

	editor.deleteFragment = (...args) => {
		const firstNode = Editor.fragment(editor, editor.selection.anchor);
		const lastNode = Editor.fragment(editor, editor.selection.focus);

		deleteFragment(...args);

		const listItems = Editor.nodes(editor, {
			match: (n) => n.type === "list-item",
		});

		const string = Node.leaf(editor, editor.selection.anchor.path);

		for (const listItem of listItems) {
			const parent = Editor.parent(editor, listItem[1]);

			if (parent && !["numbered-list", "bulleted-list"].includes(parent[0].type)) {
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
				onChange={(e) => {
					const string = Node.leaf(editor, editor.selection.anchor.path);

					const isActive = isMarkActive(editor, "bold");
					if (string.text.startsWith("1. ")) {
						toggleBlock(editor, "numbered-list", "number");
						Transforms.delete(editor, {
							at: editor.selection.anchor,
							unit: "word",
							reverse: true,
						});

						// checklist(editor);
					}
					backwardCheck = false;

					// window.flutter_inappwebview?.callHandler("handlerFooWithArgs", { type: "bold", active: isActive });
				}}
				value={initialValue}>
				{/* <div
					style={{
						position: "fixed",
						background: "red",
						overflowX: "auto",
						left: 0,
						top: 0,
						width: "100%",
						display: "flex",
						height: "50px",
						zIndex: 30,
						padding: "10px",
					}}>
					<BlockButton
						format="katex-link"
						icon="format_list_item"
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
						format="banner-red"
						icon="format_list_item"
					/>
				

					<div
						onClick={(e) => {
							e.preventDefault();

							const block = { type: "heading-one", children: [{ type: "header-one" }] };
							Transforms.setNodes(editor, block);

							getCaretCoordinates();
							ReactEditor.focus(editor);
						}}>
						Heading (1-1)
					</div>
				</div> */}

				{/* <MarkButton
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
					format="katex-link"
					icon="format_list_item"
				/>
 */}

				<BlockButton
					format="url-link"
					icon="format_list_item"
				/>

				<BlockButton
					format="katex-link"
					icon="format_list_item"
				/>

				<BlockButton
					format="banner-red"
					icon="format_list_item"
				/>

				<MarkButton
					format="bold"
					icon="format_bold"
				/>

				<div
					onClick={(e) => {
						const text = { text: "", type: "heading-one" };
						const block = { type: "editable-void", children: [text] };

						Transforms.setNodes(editor, block);
						ReactEditor.focus(editor);
					}}>
					insert void
				</div>

				<div
					onClick={(e) => {
						const text = { text: "", type: "heading-one" };
						// const block = { type: "editable-void", children: [text] };

						Transforms.setNodes(editor, text);
						ReactEditor.focus(editor);
					}}>
					heading one
				</div>

				<Editable
					renderElement={renderElement}
					style={{ padding: "10px" }}
					ref={contentEditableRef}
					autoCapitalize="off"
					spellCheck={false}
					onFocus={(event) => {
						window.addEventListener("resize", getCaretCoordinates);

						window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focus");
					}}
					onBlur={(e) => {
						// if (ModalProps && ModalProps.open) {
						// 	ReactEditor.focus(editor);
						// }

						window.removeEventListener("resize", getCaretCoordinates);

						window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur");
					}}
					autoFocus={false}
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

						leftCheck = false;
						rightCheck = false;
						const nodeNow = Editor.node(editor, editor.selection.anchor);

						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "list-item" || n.type == "inline-bug",
						});

						// setState({ text: selectedLeaf.text });

						if (event.key == "Enter" && event.shiftKey && listItems && listItems[0].type == "list-item") {
							event.preventDefault();

							const nextNode = Editor.next(editor, {
								at: editor.selection.anchor.path,
							});

							Transforms.insertNodes(editor, {
								children: [{ text: "", type: "inline-bug" }],
								type: "inline-bug",
							});
							// const block = { type: "inline-bug", children: [] };

							// Transforms.wrapNodes(editor, block);

							Transforms.move(editor, { unit: "offset", distance: 1 });
						} else if (event.key == "ArrowLeft") {
							leftCheck = true;
						} else if (event.key == "ArrowRight") {
							rightCheck = true;
						} else if (event.metaKey && event.key === "z" && !event.shiftKey) {
							event.preventDefault();
							HistoryEditor.undo(editor);
						} else if (event.metaKey && event.shiftKey && event.key === "z") {
							event.preventDefault();
							HistoryEditor.redo(editor);
						}
					}}
				/>
			</Slate>
		</div>
	);
};

const wrapperCheck = (editor) => {
	const block = { type: "banner-red-wrapper", children: [] };
	const isActive = isBlockActive(editor, "banner-red-wrapper", TEXT_ALIGN_TYPES.includes("banner-red-wrapper") ? "align" : "type");

	const firstNode1 = Editor.parent(editor, editor.selection.anchor.path);
	const lastNode1 = Editor.parent(editor, editor.selection.focus.path);

	let anchorPath, focusPath;
	if (_.sum(firstNode1) <= _.sum(lastNode1)) {
		let lastnode = Editor.last(editor, lastNode1[1]);
		let firstnode = Editor.first(editor, firstNode1[1]);
		anchorPath = firstnode;
		focusPath = lastnode;
	} else {
		let lastnode = Editor.last(editor, firstNode1[1]);
		let firstnode = Editor.first(editor, lastNode1[1]);
		anchorPath = firstnode;
		focusPath = lastnode;
	}

	if (!isActive) {
		Transforms.wrapNodes(editor, block, {
			at: {
				anchor: { path: anchorPath[1], offset: 0 },
				focus: {
					path: focusPath[1],
					offset: focusPath[0].text.length,
				},
			},
			match: (n) => {
				return !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type == "numbered-list" || n.type == "paragraph" || n.type == "bulleted-list");
			},
			split: true,
		});
	} else {
		Transforms.unwrapNodes(editor, {
			match: (n) => {
				return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "numbered-list";
			},
			split: true,
		});

		Transforms.setNodes(editor, { type: "paragraph" });

		Transforms.unwrapNodes(editor, {
			match: (n) => {
				return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "banner-red-wrapper";
			},
			split: true,
		});
	}

	// ReactEditor.focus(editor);
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
		children: isCollapsed ? [{ text: url, type: "link" }] : [],
	};

	if (isCollapsed) {
		Transforms.insertNodes(editor, link);
	} else {
		Transforms.wrapNodes(editor, link, { split: true });
		ReactEditor.focus(editor);
	}
};

const insertLink = (editor, url) => {
	if (editor.selection) {
		wrapLink(editor, url);
	}
};

const insertKatex = (editor, url, updateAmount) => {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0;
	let data = {
		url: url,
		editor: editor,
		path: editor.selection.anchor,
		open: true,
	};
	updateAmount(data);
	// ReactEditor.blur(editor);
	// wrapKatex(editor, url, editor.selection);
};

const withInlines = (editor) => {
	const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

	editor.isInline = (element) => ["link", "button", "katex", "inline-bug", "inline-wrapper-bug"].includes(element.type) || isInline(element);

	editor.isVoid = (element) => ["katex", "editable-void", "inline-bug", "link"].includes(element.type) || isVoid(element);

	editor.markableVoid = (element) => {
		return element.type === "katex" ? true : markableVoid(element);
	};

	return editor;
};

const LinkComponent = ({ attributes, children, element }) => {
	const selected = useSelected();
	const editor = useSlate();

	let updateModal = useModalStore((state) => state.updateModal);
	const focused = useFocused();
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
			href={element.url}
			onClick={(e) => {
				e.preventDefault();
				let data = {
					element: element,
					editor: editor,
					click: true,
					type: "link",
					open: true,
					path: ReactEditor.findPath(editor, element),
				};
				updateModal(data);
			}}>
			<span>{element.children[0].text}</span>
			{children}
		</a>
	);
};

const InlineWrapperBug = ({ attributes, children }) => {
	return (
		<span
			contentEditable="false"
			{...attributes}>
			<span
				contentEditable="false"
				className="slite-line-break"></span>
			{children}
		</span>
	);
};

const InlineChromiumBugfix = ({ attributes, children, element }) => {
	const selected = useSelected();
	const editor = useSlate();
	const focused = useFocused();

	if (focused && selected && leftCheck) {
		Transforms.move(editor, { unit: "offset", distance: 1, reverse: true });
		leftCheck = false;
	} else if (focused && selected && rightCheck) {
		Transforms.move(editor, { unit: "offset", distance: 1 });
		rightCheck = false;
	}
	return (
		<span
			contentEditable="false"
			{...attributes}>
			<span contentEditable="false">
				<span
					contentEditable="false"
					className="slite-line-break"></span>
			</span>
			{children}
		</span>
	);
};

const KatexComponent = ({ attributes, children, element }) => {
	const katextext = katex.renderToString(String.raw`${element.url}`);
	const editor = useSlate();
	const selected = useSelected();
	const focused = useFocused();
	let updateModal = useModalStore((state) => state.updateModal);

	return (
		<span
			onClick={(e) => {
				ReactEditor.blur(editor);
				let data = {
					element: element,
					editor: editor,
					click: true,
					type: "katex",
					open: true,
					path: ReactEditor.findPath(editor, element),
				};
				updateModal(data);
				// updateClick(element.id);
				// window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "modal");
			}}
			//
			style={{
				// userSelect: "none",
				background: selected ? "red" : "",
			}}
			contentEditable="false"
			className="span-katex"
			{...attributes}>
			<span
				contentEditable="false"
				dangerouslySetInnerHTML={{ __html: katextext }}></span>
			{children}
			{/* <RenderModal /> */}
		</span>
	);
};

const isLinkActive = (editor) => {
	const [link] = Editor.nodes(editor, {
		match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
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
				getCaretCoordinates();
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
					getCaretCoordinates();
				}}>
				number list
			</div>
		);
	} else if (format == "url-link") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					getCaretCoordinates();

					event.preventDefault();
					const url = window.prompt("Enter the URL of the link:");
					if (!url) return;
					insertLink(editor, url);
				}}>
				URL LINK
			</div>
		);
	} else if (format == "banner-red") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					event.preventDefault();
					wrapperCheck(editor);
					getCaretCoordinates();
				}}>
				Banner red
			</div>
		);
	} else if (format == "katex-link") {
		return (
			<div
				style={{ padding: "10px" }}
				onMouseDown={(event) => {
					// getCaretCoordinates();

					// let data = {
					// 	url: "jkl",
					// 	editor: editor,
					// 	path: editor.selection.anchor,
					// 	open: true,
					// };
					// updateAmount(data);
					insertKatex(editor, "jjk", updateAmount);
				}}>
				Katex Link123
			</div>
		);
	} else {
		return (
			<div
				onMouseDown={(event) => {
					getCaretCoordinates();

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
	ReactEditor.focus(editor);
};

const toggleBlock = (editor, format, type) => {
	const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? "align" : "type");
	const isList = LIST_TYPES.includes(format) || format == "banner-red-wrapper";
	let LIST_PARENT = ["numbered-list", "bulleted-list"];
	let formatCheck;

	if (format == "list-item") {
		formatCheck = ["numbered-list", "bulleted-list"];
	} else {
		formatCheck = format;
	}

	Transforms.unwrapNodes(editor, {
		match: (n) => {
			return !Editor.isEditor(n) && SlateElement.isElement(n) && formatCheck.includes(n.type);
		},
		split: true,
	});

	let newProperties;
	if (TEXT_ALIGN_TYPES.includes(format)) {
		newProperties = {
			align: isActive ? undefined : format,
		};
	} else {
		newProperties = {
			type: isActive ? "paragraph" : isList ? "list-item" : formatCheck,
		};
	}
	Transforms.setNodes(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}

	const listItems = Editor.nodes(editor, {
		at: editor.selection.anchor.path,
		match: (n) => LIST_PARENT.includes(n.type),
	});
	let previousParent, nextParent, currentParent;
	for (const listItem of listItems) {
		previousParent = Editor.previous(editor, {
			at: listItem[1],
		});
		nextParent = Editor.next(editor, {
			at: listItem[1],
		});

		currentParent = Editor.node(editor, listItem[1]);
	}

	if (nextParent && previousParent && LIST_PARENT.includes(nextParent[0].type) && LIST_PARENT.includes(previousParent[0].type) && currentParent[0].type == previousParent[0].type) {
		Transforms.mergeNodes(editor, {
			at: nextParent[1],
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type),
		});
		Transforms.mergeNodes(editor, {
			at: editor.selection.anchor.path,
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type),
		});
	} else if (currentParent && nextParent && currentParent[0].type == nextParent[0].type && nextParent && LIST_PARENT.includes(nextParent[0].type)) {
		Transforms.mergeNodes(editor, {
			at: nextParent[1],
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type),
		});
	} else if (currentParent && previousParent && currentParent[0].type == previousParent[0].type && LIST_PARENT.includes(previousParent[0].type)) {
		Transforms.mergeNodes(editor, {
			at: editor.selection.anchor.path,
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type),
		});
	}
};

const isBlockActive = (editor, format, blockType = "type") => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		Editor.nodes(editor, {
			at: Editor.unhangRange(editor, selection),
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
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

const removeFormats = (editor, format) => {
	Editor.removeMark(editor, format);
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

const BannerRed = ({ attributes, children, element }) => {
	// const editor = useSlate();
	// const [listItems] = Editor.nodes(editor, {
	// 	at: editor.selection.anchor,
	// 	match: (n) => n.type == "banner-red-wrapper",
	// });
	// const previousNode = Editor.previous(editor, { at: listItems[1] });
	// const nextNode = Editor.previous(editor, { at: listItems[1] });
	// const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);
	//

	return (
		<div
			className="banner-red"
			{...attributes}>
			{children}
		</div>
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
		case "inline-wrapper-bug":
			return <InlineWrapperBug {...props} />;
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
			return <BannerRed {...props} />;
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
