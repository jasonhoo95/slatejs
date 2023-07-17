import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import isUrl from "is-url";

import isHotkey from "is-hotkey";

import { css } from "@emotion/css";
import { v4 } from "uuid";
import { Editable, withReact, useSlate, Slate, ReactEditor, useSelected, useFocused } from "slate-react";
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Text, Range, Node, Point } from "slate";
import { withHistory, HistoryEditor, History } from "slate-history";
import { useBearStore, useAuthStore } from "@/globals/authStorage";
import PlainTextExample from "./plainText";
import { useModalStore } from "@/globals/zustandGlobal";
import EditablePopup from "./editablePopup";
import _, { keyBy } from "lodash";
import next from "next";
import SlateReact from "./slateReact";
import { Transform } from "stream";
const HOTKEYS = {
	"mod+b": "bold",
	"mod+i": "italic",
	"mod+u": "underline",
	"mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list", "list-item", "check-list-item"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];
const FORMAT_TYPES = ["bold", "italic", "underline"];
const FORMAT_NONE = ["numbered-list", "paragraph"];
let backwardCheck = false;

let leftCheck = false;
let rightCheck = false;
let blurCheck = "false";
let anchorPoint;
let editorNow;
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

	{
		type: "paragraph",
		children: [
			{
				text: "aasd ad asd asd a da",
			},
		],
	},
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

		x = position.x;
		y = position.y + window.scrollY - 100;
		anchorPoint = y;
		if (y > 0) {
			window.scrollTo({ top: y, behavior: "smooth" });
		}
	}
	// return { x, y };
}
const SlateMobile = () => {
	let id = v4();
	let updateAmount = useModalStore((state) => state.updateModal);

	const [focus, setFocus] = useState(true);
	const ModalProps = useModalStore((state) => state.amount);
	const contentEditableRef = useRef(null);

	const renderElement = useCallback((props) => <Element {...props} />, []);
	const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
	const editor = useMemo(() => withInlines(withReact(withHistory(createEditor()))), []);
	const { deleteFragment, deleteBackward, onChange } = editor;

	const { insertBreak } = editor;
	const savedSelection = React.useRef(editor.selection);

	useEffect(() => {
		window.addEventListener("message", function (event) {
			if (event.data == "bold") {
				toggleMark(editor, "bold");
			} else if (event.data == "blur") {
				window.scrollTo(0, 0);
				ReactEditor.blur(editor);
				this.window.removeEventListener("message", this);
				window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur1");
			} else if (event.data == "katex") {
				insertKatex(editor, "kkasdl", updateAmount);
			} else if (event.data == "focus") {
				const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "katex" });
				if (parentCheck[0].type == "katex") {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}
				ReactEditor.focus(editor);
				window.removeEventListener("resize", getCaretCoordinates);
			}
		});
	}, [editor]);

	editor.insertBreak = () => {
		const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);

		const listItems = Editor.nodes(editor, {
			at: editor.selection.anchor,
			match: (n) => n.type == "list-item" || n.type == "banner-red-wrapper" || n.type == "katex" || n.type == "check-list-item",
		});
		let currentParent, currentDescendant, previousParent;
		for (const listItem of listItems) {
			currentParent = Editor.node(editor, listItem[1]);
			currentDescendant = Node.descendant(editor, listItem[1], { match: (n) => n.type == "paragraph" });
			previousParent = Editor.previous(editor, { at: listItem[1] });
		}
		const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "paragraph" });

		if (currentParent && ["list-item", "check-list-item"].includes(currentParent[0].type) && currentParent[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
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
		// alert("delete");
		let listItemParent;
		let previousParent;
		let nextParent;
		const [listItems] = Editor.nodes(editor, {
			at: editor.selection.anchor.path,
			match: (n) => ["paragraph", "list-item", "check-list-item"].includes(n.type),
		});

		if (listItems) {
			listItemParent = Editor.node(editor, listItems[1]);
			previousParent = Editor.previous(editor, {
				at: listItems[1],
			});
			nextParent = Editor.next(editor, { at: listItems[1] });
		}
		console.log(nextParent, listItems, "list items");

		const currentNodeParent = Editor.node(editor, {
			at: editor.selection.anchor.path,
		});

		if (nextParent && nextParent[0].type == "banner-red-wrapper" && previousParent && previousParent[0].type == "banner-red-wrapper") {
			deleteBackward(...args);
			if (!backwardCheck) {
				backwardCheck = true;
				console.log("banner red merged");
				const currentNode = Editor.node(editor, editor.selection.anchor.path);

				if (["katex", "inline-bug"].includes(currentNode[0].type)) {
					Transforms.move(editor, { distance: 1, unit: "offset" });
				}

				Transforms.mergeNodes(editor, {
					at: listItemParent[1],
					match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["banner-red-wrapper"].includes(n.type),
				});
				const [listItems] = Editor.nodes(editor, {
					at: editor.selection.anchor.path,
					match: (n) => ["numbered-list", "bulleted-list"].includes(n.type),
				});

				if (listItems) {
					let nextnode;
					nextnode = Editor.next(editor, {
						at: listItems[1],
						match: (n) => ["paragraph", "numbered-list", "bulleted-list"].includes(n.type),
					});

					console.log(nextnode, "node check");

					if (listItems[0].type == nextnode[0].type) {
						Transforms.mergeNodes(editor, {
							at: nextnode[1],
							match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
						});
					}
				}
			}
		} else if (listItemParent && listItemParent[0].type == "dropdown-content") {
			const [listItems] = Editor.nodes(editor, {
				at: editor.selection.anchor.path,
				match: (n) => ["dropdown-inner"].includes(n.type),
			});

			const start = Editor.node(editor, editor.selection.anchor.path);

			if (start[0].text.length == 0 && listItems[0].children.length == 1) {
				return;
			} else {
				deleteBackward(...args);
			}
		} else if (previousParent && previousParent[0].type == "dropdown-content" && editor.selection.anchor.offset == 0) {
			Transforms.removeNodes(editor, { at: previousParent[1] });
			Transforms.insertNodes(
				editor,
				{
					type: "paragraph",
					children: [
						{
							text: "",
						},
					],
				},
				{ at: previousParent[1] }
			);
			deleteBackward(...args);
		} else if (
			nextParent &&
			previousParent &&
			["numbered-list", "bulleted-list"].includes(previousParent[0].type) &&
			["numbered-list", "bulleted-list"].includes(nextParent[0].type) &&
			previousParent[0].type == nextParent[0].type
		) {
			deleteBackward(...args);

			if (!backwardCheck) {
				console.log("number list merged");

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
			(listItemParent[0].type == "list-item" || listItemParent[0].type == "check-list-item") &&
			listItemParent[1][listItemParent[1].length - 1] == 0 &&
			editor.selection.anchor.offset == 0 &&
			currentNodeParent[1].at[currentNodeParent[1].at.length - 1] == 0
		) {
			toggleBlock(editor, listItemParent[0].type);
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
						match: (n) => ["list-item", "katex", "inline-bug", "check-list-item"].includes(n.type),
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

		const listItems = Editor.nodes(editor, {
			match: (n) => n.type === "list-item" || n.type == "check-list-item",
		});
		deleteFragment(...args);

		const string = Node.leaf(editor, editor.selection.anchor.path);

		for (const listItem of listItems) {
			const parent = Editor.parent(editor, listItem[1]);

			if (parent && !["numbered-list", "bulleted-list", "check-list"].includes(parent[0].type)) {
				Transforms.setNodes(
					editor,
					{ type: "paragraph" },
					{
						at: listItem[1],
						match: (n) => n.type === "list-item" || n.type == "check-list-item",
					}
				);
			}
		}
	};
	const onFocus = useCallback(() => {
		setFocus(true);

		// Transforms.select(editor, savedSelection.current ?? Editor.end(editor, []));

		window.addEventListener("resize", getCaretCoordinates);
		window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focus123");
	}, []);

	const onBlur = useCallback(() => {
		setFocus(false);

		// savedSelection.current = editor.selection;
		window.removeEventListener("resize", getCaretCoordinates);

		window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur");
	}, []);

	return (
		<div>
			<Slate
				editor={editor}
				onChange={(value) => {
					const string = Node.leaf(editor, editor.selection.anchor.path);
					console.log(value, "value now");
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
				}}
				value={initialValue}>
				<BlockButton
					format="katex-link"
					icon="format_list_item"
				/>

				<BlockButton
					format="banner-red"
					icon="format_list_item"
				/>

				<BlockButton
					icon="format_list_item"
					format="bulleted-list"
				/>

				{/* <BlockButton
					format="url-link"
					icon="format_list_item"
				/>




				<MarkButton
					format="bold"
					icon="format_bold"
				/> */}

				<div
					onClick={(e) => {
						const block = {
							type: "editable-void",
							card: [],
							children: [],
						};
						const block1 = {
							type: "dropdown-content",
							children: [
								// {
								// 	type: "paragraph",
								// 	children: [
								// 		{
								// 			type: "heading-two",
								// 			children: [{ text: "oklah" }],
								// 		},
								// 	],
								// },

								{
									type: "dropdown-inner",
									children: [
										{
											type: "paragraph",
											children: [
												{
													text: "123oklsa",
												},
											],
										},
									],
								},
							],
						};

						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "paragraph" || n.type == "list-item" || n.type == "banner-red-wrapper",
						});
						if (Editor.isEmpty(editor, listItems[0])) {
							Transforms.insertNodes(editor, block1, { at: editor.selection.anchor.path });
							Transforms.unwrapNodes(editor, { mode: "highest" });
						} else {
							Transforms.insertNodes(editor, block1, { mode: "highest" });
							// Transforms.unwrapNodes(editor, { mode: "highest" });
						}
					}}>
					insert void123
				</div>

				<div
					onClick={(e) => {
						const typeCheckList = { text: "", type: "check-list-item" };
						const block = { type: "check-list", children: [] };

						Transforms.wrapNodes(editor, block);

						Transforms.setNodes(editor, typeCheckList);
						ReactEditor.focus(editor);
					}}>
					check list
				</div>

				<div
					onClick={(e) => {
						const text = { text: "", type: "heading-one" };
						// const block = { type: "editable-void", children: [text] };
						Transforms.unwrapNodes(editor, {
							match: (n) => {
								return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "numbered-list";
							},
							split: true,
						});
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
					onFocus={onFocus}
					onBlur={onBlur}
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
						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "list-item" || n.type == "inline-bug" || n.type == "check-list-item",
						});
						// setState({ text: selectedLeaf.text });
						if (event.key == "Enter" && event.shiftKey && listItems && (listItems[0].type == "list-item" || listItems[0].type == "check-list-item")) {
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

							// document.execCommand("undo");
						} else if (event.metaKey && event.shiftKey && event.key === "z") {
							event.preventDefault();
							HistoryEditor.redo(editor);
						}
					}}
				/>
			</Slate>
			<div
				onInput={(e) => {}}
				contentEditable="true">
				asd asdasd asd asd asd asd as
			</div>
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
				return !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type == "numbered-list" || n.type == "paragraph" || n.type == "bulleted-list" || n.type == "check-list");
			},
			split: true,
		});
	} else {
		Transforms.unwrapNodes(editor, {
			match: (n) => {
				return !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type == "numbered-list" || n.type == "check-list");
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
		// Transforms.setNodes(editor, { type: "paragraph" });
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
	let id = v4();
	const katex = {
		type: "katex",
		url,
		id,
		children: [{ text: "", type: "katex" }],
	};
	Transforms.insertNodes(editor, katex);

	Transforms.move(editor);

	Transforms.insertText(editor, "\u00a0".toString(), {
		at: editor.selection.anchor,
	});
	updateAmount("katex");

	ReactEditor.focus(editor);
};

const withInlines = (editor) => {
	const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

	editor.isInline = (element) => ["link", "button", "katex", "inline-bug", "inline-wrapper-bug"].includes(element.type) || isInline(element);

	editor.isVoid = (element) => ["katex", "inline-bug", "link", "editable-void"].includes(element.type) || isVoid(element);

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
					edit: true,
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
	const selected = useSelected();
	const focused = useFocused();

	return (
		<span
			onClick={(e) => {
				if (focused) {
					window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "katex");
				}
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
					event.preventDefault();
					const url = window.prompt("Enter the URL of the link:");
					if (!url) return;
					insertLink(editor, url);
				}}>
				URL LINK
			</div>
		);
	} else if (format == "focus") {
		return (
			<div
				onClick={(e) => {
					ReactEditor.focus(editor);
				}}>
				focus now
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
					event.preventDefault();
					ReactEditor.blur(editor);
					insertKatex(editor, "jjk", updateAmount);
					// getCaretCoordinates();
				}}>
				Katex Link
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
	let LIST_PARENT = ["numbered-list", "bulleted-list", "check-list", "banner-red-wrapper"];
	let formatCheck;

	if (format == "list-item" || format == "check-list-item") {
		formatCheck = ["numbered-list", "bulleted-list"];
	} else {
		formatCheck = format;
	}

	console.log(formatCheck, "format check");
	Transforms.unwrapNodes(editor, {
		match: (n) => {
			console.log(n.type, "types");
			return !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type);
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
	console.log(newProperties, "new properties");
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
const DropdownInner = ({ attributes, children, element }) => {
	const editor = useSlate();
	const selected = useSelected();
	const focused = useFocused();
	const path = ReactEditor.findPath(editor, element);
	if (!selected || !focused) {
	}

	return (
		<div
			{...attributes}
			style={{ background: "green" }}>
			{children}
		</div>
	);
};

const DropDownList = ({ attributes, children, element }) => {
	const editor = useSlate();

	const addMore = () => {
		const path = ReactEditor.findPath(editor, element);
		const [nodes] = Editor.nodes(editor, {
			at: path,
			match: (n) => n.type == "dropdown-content",
		});

		let object = {
			type: "dropdown-inner",
			children: [
				{
					type: "paragraph",
					children: [
						{
							text: "",
						},
					],
				},
			],
		};
		let arraynow = [...nodes[0].children];
		arraynow.push(object);

		const block1 = {
			type: "dropdown-content",
			children: arraynow,
		};

		Transforms.removeNodes(editor, { at: path });
		Transforms.insertNodes(editor, block1, { at: path });
		Transforms.select(editor, [path[0], arraynow.length - 1]);
	};
	return (
		<div
			{...attributes}
			style={{ border: "1px solid grey", borderRadius: "10px" }}>
			<button
				onClick={(e) => {
					addMore();
				}}>
				click me
			</button>
			{/* <div style={{ background: "red" }}>{children[0]}</div> */}
			<div className="flex justify-between">
				{children.map((o, key) => {
					return children[key];
				})}
			</div>
		</div>
	);
};

const EditableVoid = ({ attributes, children, element }) => {
	const editor = useSlate();
	const { card } = element;
	const selected = useSelected();
	const focused = useFocused();
	let cardnow;
	let clickKey;
	const [objCopy, setObj] = useState();
	const path = ReactEditor.findPath(editor, element);
	const addCard = () => {
		let cardObj = { card: "1", id: 0, check: false };
		cardObj.id = card.length;
		cardnow = [...card, cardObj];

		setObj(cardnow);
		Transforms.setNodes(editor, { card: cardnow }, { at: path });
	};

	const checkInput = (text, key) => {
		let cardnow = [...objCopy];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { card: text, id: key, check: true });

		Transforms.setNodes(editor, { card: cardnow }, { at: path });
	};

	const setModal = useCallback((key, card1, check) => {
		let cardnow = [...card1];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { ...cardnow[index], check: check });
		setObj(cardnow);
		// Transforms.setNodes(editor, { card: cardnow }, { at: path });
	}, []);

	const setCheckValidate = useCallback((key, card1) => {
		let cardnow = [...card1];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { ...cardnow[index], check: false });

		setObj(cardnow);
	}, []);

	return (
		// Need contentEditable=false or Firefox has issues with certain input types.
		<div
			style={{
				border: "1px solid grey",
				background: "green",
				height: "100px",
			}}
			{...attributes}
			contentEditable="false"
			// onBlur={(e) => {
			// 	let cardnow = [...card];
			// 	if (cardnow.length > 0) {
			// 		var result = cardnow.map((o, key) => {
			// 			if (key == clickKey) {
			// 				o.check = false;
			// 			}
			// 		});
			//
			// 		setObj(result);
			// 	}
			// }}
		>
			<button
				onClick={(e) => {
					addCard();
				}}>
				click here
			</button>
			;{/* <RenderPopup /> */}
			<div className="flex">
				{card?.map((o, key) => {
					return (
						<div
							className="mx-3"
							onClick={(e) => {
								setModal(key, card, true);
							}}
							style={{ height: "100%", width: "100%", background: "red" }}
							key={key}>
							{/* {objCopy[key].check ? "true" : "false"} */}
							{objCopy && objCopy[key].check ? (
								<>
									{o.card}
									<EditablePopup
										value={o}
										open={true}
										setModal={setModal}
										card={objCopy}
										id={key}
										path={path}
										editor={editor}
									/>
								</>
							) : (
								// <input
								// 	value={o.card}
								// 	onChange={(e) => {
								// 		checkInput(e.target.value, key);
								//
								// 	}}
								// 	type="text"
								// />
								o.card
							)}
						</div>
					);
				})}
			</div>
			;
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

const CheckList = ({ attributes, children, element }) => {
	const editor = useSlate();
	const { checked } = element;
	return (
		<li
			{...attributes}
			className="check-list">
			<span
				style={{ paddingLeft: "20px", cursor: "pointer", userSelect: "none" }}
				contentEditable={false}
				onClick={(e) => {
					e.preventDefault();
					const path = ReactEditor.findPath(editor, element);
					const newProperties = {
						checked: checked ? false : true,
					};
					Transforms.setNodes(editor, newProperties, { at: path });
				}}
				className="checkbox-ui">
				{/* <input
					type="checkbox"
					checked={checked}
					onChange={(event) => {
						const path = ReactEditor.findPath(editor, element);
						const newProperties = {
							checked: event.target.checked,
						};
						Transforms.setNodes(editor, newProperties, { at: path });
					}}
				/> */}
			</span>
			<span
				contentEditable={true}
				className={css`
					flex: 1;
					opacity: ${checked ? 0.666 : 1};
					text-decoration: ${!checked ? "none" : "line-through"};

					&:focus {
						outline: none;
					}
				`}>
				{children}
			</span>
		</li>
	);
};

const CheckListItemElement = ({ attributes, children, element }) => {
	const editor = useSlate();
	const { checked } = element;
	return (
		<div
			{...attributes}
			className={css`
				display: flex;
				flex-direction: row;
				align-items: center;

				& + & {
					margin-top: 0;
				}
			`}>
			<span
				contentEditable={false}
				className={css`
					margin-right: 0.75em;
					margin-bottom: auto;
				`}>
				<input
					type="checkbox"
					checked={checked}
					onChange={(event) => {
						const path = ReactEditor.findPath(editor, element);
						const newProperties = {
							checked: event.target.checked,
						};
						Transforms.setNodes(editor, newProperties, { at: path });
					}}
				/>
			</span>
			<span
				contentEditable={true}
				className={css`
					flex: 1;
					opacity: ${checked ? 0.666 : 1};
					text-decoration: ${!checked ? "none" : "line-through"};

					&:focus {
						outline: none;
					}
				`}>
				{children}
			</span>
		</div>
	);
};

const BannerRed = ({ attributes, children, element }) => {
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
		case "dropdown-inner":
			return <DropdownInner {...props} />;
		case "katex":
			return <KatexComponent {...props} />;
		case "inline-bug":
			return <InlineChromiumBugfix {...props} />;
		case "inline-wrapper-bug":
			return <InlineWrapperBug {...props} />;
		case "editable-void":
			return <EditableVoid {...props}></EditableVoid>;
		case "check-list-item":
			return <CheckList {...props} />;
		case "dropdown-content":
			return <DropDownList {...props} />;
		case "heading-one":
			return <Heading1Component {...props}></Heading1Component>;
		case "text-descrip":
			return (
				<div
					style={{ border: "1px solid black" }}
					{...attributes}>
					{children}
				</div>
			);
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
					className="list-item"
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

		case "check-list":
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
					{/* <ZeroWidthText /> */}
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

export default SlateMobile;
