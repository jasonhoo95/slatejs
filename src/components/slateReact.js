import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import isUrl from "is-url";

import isHotkey, { isKeyHotkey } from "is-hotkey";

import { css } from "@emotion/css";
import { v4 } from "uuid";
import { Editable, withReact, useSlate, useSlateStatic, Slate, ReactEditor, useSelected, useFocused, useReadOnly } from "slate-react";
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Text, Range, Node, Point, setPoint } from "slate";
import { withHistory, HistoryEditor, History } from "slate-history";
import { useModalStore } from "@/globals/zustandGlobal";
import EditablePopup from "./editablePopup";
import HoveringMenuExample from "./hovering-toolbar";
import { at } from "lodash";
import { ifError } from "assert";

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
let undo = false;
let focusCheck = false;


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
		type: 'check-list',
		children: [{ type: 'check-list-item', checked: true, children: [{ text: 'asdasd' }] }, { type: 'check-list-item', children: [{ text: 'asdasd' }] }],
	},
	{
		type: 'numbered-list',
		checked: true,
		children: [{ type: 'list-item', children: [{ text: 'asdasd asdasd' }] }, { type: 'list-item', children: [{ text: 'asdasd asdasd' }] }, { type: 'list-item', children: [{ text: '213 jason' }] }],
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
function getCaretCoordinates(height) {
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




		// }


		if (y > 0) {
			window.scrollTo({ top: y, behavior: "smooth" });

		}
	}
	// return { x, y };
}
const SlateReact = () => {
	let id = v4();
	let ModalProps = useModalStore((state) => state.display);
	let updateAmount = useModalStore((state) => state.updateModal);

	const [focus, setFocus] = useState(true);
	const contentEditableRef = useRef(null);

	const renderElement = useCallback((props) => <Element {...props} />, []);
	const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
	const editor = useMemo(() => withInlines(withReact(withHistory(createEditor()))), []);
	const { deleteFragment, deleteBackward, onChange } = editor;

	const { insertBreak } = editor;


	useEffect(() => {
		window.addEventListener("message", function (event) {
			if (event.data == "bold") {
				toggleMark(editor, "bold");
			} else if (event.data == "blur") {

				ReactEditor.blur(editor);
				// this.window.scrollTo(0, 0);
				window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur1");
			} else if (event.data == "katexinsert") {
				Transforms.insertText(editor, "\u200B".toString(), {
					at: editor.selection.anchor,
				});

			}
			else if (event.data == "katex") {
				ReactEditor.focus(editor);


				insertKatex(editor, "flutter123");


			} else if (event.data == "focus") {
				window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focusnow");
				ReactEditor.focus(editor);
				// const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "katex" });
				// if (parentCheck[0].type == "katex") {
				// 	Transforms.move(editor, { distance: 1, unit: "offset" });
				// }
			}
		});
	}, [editor]);

	editor.insertBreak = () => {
		const selectedLeaf = Node.leaf(editor, editor.selection.anchor.path);
		// timeset = setTimeout(() => {
		// 	window.scrollTo({ top: window.scrollY + 200, behavior: "smooth" })
		// 	
		// }, 900)


		const listItems = Editor.nodes(editor, {
			at: editor.selection.anchor,
			match: (n) => n.type == "list-item" || n.type == "banner-red-wrapper" || n.type == "table-list" || n.type == "katex" || n.type == "check-list-item" || n.type == "dropdown-inner" || n.type == "editable-void",
		});
		let currentParent, currentDescendant, previousParent, voidCheck;

		for (const listItem of listItems) {
			currentParent = Editor.node(editor, listItem[1]);
			voidCheck = Editor.node(editor, listItem[1], { match: (n) => n.type == "dropdown-content" })
			currentDescendant = Node.descendant(editor, listItem[1], { match: (n) => n.type == "paragraph" });
			previousParent = Editor.previous(editor, { at: listItem[1] });
		}


		const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "paragraph" });

		if (currentParent && ["list-item", "check-list-item"].includes(currentParent[0].type) && currentParent[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
			toggleBlock(editor, currentParent[0].type);

		} else if (currentParent && ["banner-red-wrapper"].includes(currentParent[0].type) && parentCheck[0].children.length == 1 && !/\S/.test(selectedLeaf.text)) {
			toggleBlock(editor, currentParent[0].type);
		}

		// else if (currentParent && currentParent[0].type == "dropdown-inner" && parentCheck) {


		// 	// let block1 =
		// 	// {
		// 	// 	type: "paragraph",
		// 	// 	children: [
		// 	// 		{
		// 	// 			id: currentParent[0].children.length + 1,
		// 	// 			text: "",
		// 	// 		},
		// 	// 	],
		// 	// }


		// 	// Transforms.insertNodes(editor, block1);



		// }
		else if (currentParent && ["check-list-item"].includes(currentParent[0].type)) {

			insertBreak();
			const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => n.type == "check-list-item" });

			const newProperties = {
				checked: false,
				type: 'check-list-item',
				children: [{ text: parentCheck[0].children[0].text }]
			};
			Transforms.setNodes(editor, newProperties, { at: parentCheck[1] });



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
		Editor.withoutNormalizing(editor, () => {
			let listItemParent;
			let previousParent;
			let previousVoid;
			let nextParent;
			const [listItems] = Editor.nodes(editor, {
				at: editor.selection.anchor.path,
				match: (n) => ["paragraph", "table-list", "dropdown-content", "list-item", "editable-void", "dropdown-content", "check-list-item", "table-list", "katex"].includes(n.type),
			});
			const ua = navigator.userAgent

			const previousKatex = Editor.previous(editor, {
				at: editor.selection.anchor.path,
				match: (n) => n.type == "katex"
			});

			if (listItems) {
				listItemParent = Editor.node(editor, listItems[1]);

				previousParent = Editor.previous(editor, {
					at: listItems[1],
					// match: (n) => ["paragraph", "numbered-list", "bulleted-list", "check-list-item", "editable-void", "dropdown-content"].includes(n.type),

				});
				previousVoid = Editor.previous(editor, {
					at: listItems[1],
					match: (n) => ["editable-void", "span-txt"].includes(n.type),

				});
				nextParent = Editor.next(editor, { at: listItems[1] });


			}



			if (!/android/i.test(ua)) {
				if (nextParent && nextParent[0].type == "banner-red-wrapper" && previousParent && previousParent[0].type == "banner-red-wrapper") {
					deleteBackward(...args);

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



						if (listItems[0].type == nextnode[0].type) {
							Transforms.mergeNodes(editor, {
								at: nextnode[1],
								match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
							});
						}

					}
				} else if (previousParent && previousParent[0].type == "check-list-item" && editor.selection.anchor.offset == 0) {
					deleteBackward(...args);
					if (previousParent[0].children[0].text.length == 0) {
						Transforms.setNodes(editor, { type: 'check-list-item', checked: previousParent[0].checked })

					}
				}
				else if (
					nextParent &&
					previousParent &&
					["numbered-list", "bulleted-list"].includes(previousParent[0].type) &&
					["numbered-list", "bulleted-list"].includes(nextParent[0].type) &&
					previousParent[0].type == nextParent[0].type
				) {

					deleteBackward(...args);


					const currentNode = Editor.node(editor, editor.selection.anchor);

					// if (["katex", "inline-bug"].includes(currentNode[0].type)) {
					// 	Transforms.move(editor, { distance: 1, unit: "offset" });
					// }

					Transforms.mergeNodes(editor, {
						at: listItemParent[1],
						match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
					});

				} else if (
					listItemParent &&
					(listItemParent[0].type == "list-item" || listItemParent[0].type == "check-list-item") &&
					!previousKatex &&
					listItemParent[1][listItemParent[1].length - 1] == 0 &&
					editor.selection.anchor.offset == 0
				) {
					toggleBlock(editor, listItemParent[0].type);
				} else if (previousParent && previousVoid && previousVoid[0].type == "span-txt" && editor.selection.anchor.offset == 0 && ["dropdown-content", "table-list", 'editable-void'].includes(previousParent[0].type) && !["dropdown-content", "table-list", 'editable-void'].includes(listItemParent[0].type)) {


					Transforms.setNodes(editor, { checked: true, selectNode: true }, { at: previousParent[1] });

					// Transforms.move(editor, { distance: 2, reverse: true, });
					Transforms.select(editor, previousVoid[1]);


				}


				else if (listItemParent && ["dropdown-content", "table-list", "editable-void"].includes(listItemParent[0].type)) {




					const listItems = Editor.above(editor, {
						match: n => ['span-txt', 'table-cell1'].includes(n.type),
					});
					const parent = Editor.parent(editor, editor.selection.anchor.path);
					const previous = Editor.previous(editor, { at: editor.selection.anchor.path, match: (n) => n.type == 'katex' })




					if (listItems && listItems[0].type == "span-txt") {
						Transforms.removeNodes(editor, { at: listItemParent[1] });
					} else if (parent[1][parent[1].length - 1] == 0 && editor.selection.anchor.offset == 0 && parent[0].children.length == 1) {


						if (/android/i.test(ua)) {
							Transforms.insertText(editor, "\u200B".toString(), {
								at: editor.selection.anchor,
							});
						} else {

							return;

						}

					}
					else {

						// backwardCheck = true;
						deleteBackward(...args);
						const node = Editor.node(editor, editor.selection.anchor.path);

						if (/\u200B/.test(node[0].text)) {

							Editor.deleteBackward(editor, { distance: 1, unit: 'character' })



						}
					}

				}


				// else if (previousParent && previousParent[0].type == "editable-void" && editor.selection.anchor.offset == 0) {

				// 	Transforms.setNodes(editor, { checked: true }, { at: previousVoid[1] });
				// 	Transforms.select(editor, previousVoid[1]);

				// }

				else {

					deleteBackward(...args);



					const currentNode = Editor.parent(editor, editor.selection.anchor.path);
					const previousNode = Editor.previous(editor, { at: editor.selection.anchor.path });
					const nextNode = Editor.next(editor, { at: editor.selection.anchor.path });

					if (previousNode && nextNode && previousNode[0].type == "link" && nextNode[0].type == "link") {
						Transforms.delete(editor, { at: editor.selection.anchor.path });
					}
					else if (/\u200B/.test(currentNode[0].children[0].text)) {


						Editor.deleteBackward(editor, { distance: 1, unit: 'character' })
						// Transforms.move(editor, { distance: 1, unit: "offset" });
					}

				}

			} else {
				if (nextParent && nextParent[0].type == "banner-red-wrapper" && previousParent && previousParent[0].type == "banner-red-wrapper") {
					deleteBackward(...args);

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



						if (listItems[0].type == nextnode[0].type) {
							Transforms.mergeNodes(editor, {
								at: nextnode[1],
								match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
							});
						}

					}
				} if (previousParent && previousParent[0].type == "check-list-item" && editor.selection.anchor.offset == 0) {
					deleteBackward(...args);
					if (previousParent[0].children[0].text.length == 0) {
						Transforms.setNodes(editor, { type: 'check-list-item', checked: previousParent[0].checked })

					}
				}
				if (
					nextParent &&
					previousParent &&
					["numbered-list", "bulleted-list"].includes(previousParent[0].type) &&
					["numbered-list", "bulleted-list"].includes(nextParent[0].type) &&
					previousParent[0].type == nextParent[0].type
				) {

					deleteBackward(...args);


					const currentNode = Editor.node(editor, editor.selection.anchor);

					// if (["katex", "inline-bug"].includes(currentNode[0].type)) {
					// 	Transforms.move(editor, { distance: 1, unit: "offset" });
					// }

					Transforms.mergeNodes(editor, {
						at: listItemParent[1],
						match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ["numbered-list", "bulleted-list"].includes(n.type),
					});

				} if (
					listItemParent &&
					(listItemParent[0].type == "list-item" || listItemParent[0].type == "check-list-item") &&
					!previousKatex &&
					listItemParent[1][listItemParent[1].length - 1] == 0 &&
					editor.selection.anchor.offset == 0
				) {
					toggleBlock(editor, listItemParent[0].type);
				} if (previousParent && previousVoid && previousVoid[0].type == "span-txt" && editor.selection.anchor.offset == 0 && ["dropdown-content", "table-list", 'editable-void'].includes(previousParent[0].type) && !["dropdown-content", "table-list", 'editable-void'].includes(listItemParent[0].type)) {


					Transforms.setNodes(editor, { checked: true, selectNode: true }, { at: previousParent[1] });

					// Transforms.move(editor, { distance: 2, reverse: true, });
					Transforms.select(editor, previousVoid[1]);


				}


				if (listItemParent && ["dropdown-content", "table-list", "editable-void"].includes(listItemParent[0].type)) {




					const listItems = Editor.above(editor, {
						match: n => ['span-txt', 'table-cell1'].includes(n.type),
					});
					const parent = Editor.parent(editor, editor.selection.anchor.path);
					const previous = Editor.previous(editor, { at: editor.selection.anchor.path, match: (n) => n.type == 'katex' })




					if (listItems && listItems[0].type == "span-txt") {
						Transforms.removeNodes(editor, { at: listItemParent[1] });
					} else if (parent[1][parent[1].length - 1] == 0 && editor.selection.anchor.offset == 0 && parent[0].children.length == 1) {


						if (/android/i.test(ua)) {
							Transforms.insertText(editor, "\u200B".toString(), {
								at: editor.selection.anchor,
							});
						} else {

							return;

						}

					}
					else {

						// backwardCheck = true;
						deleteBackward(...args);
						const node = Editor.node(editor, editor.selection.anchor.path);

						if (/\u200B/.test(node[0].text)) {

							Editor.deleteBackward(editor, { distance: 1, unit: 'character' })



						}
					}

				}


			}
		}

		)
	};

	editor.deleteFragment = (...args) => {

		const [listItems] = Editor.nodes(editor, {
			match: (n) => n.type === "list-item" || n.type == "check-list-item" || n.type == "paragraph" || n.type == "dropdown-content",
		});
		const string = Node.leaf(editor, editor.selection.anchor.path);

		const checked = listItems;
		deleteFragment(...args);




		const [checkListItem] = Editor.nodes(editor, {
			at: listItems[1],
			match: (n) => n.type == "list-item",
		});




		if (checkListItem && !["list-item", "check-list-item"].includes(checkListItem[0].type)) {
			Transforms.setNodes(
				editor,
				{ type: "paragraph" },
				{
					at: checkListItem[1],
					match: (n) => n.type === "list-item" || n.type == "check-list-item",
				}
			);
		}
		else if (checked[0].type == "check-list-item" && string.text.length > 0) {
			Transforms.setNodes(
				editor,
				{ type: "check-list-item", checked: checked[0].checked ? true : false },
				{
					at: checked[1],
				}
			);

		}

	}
	const onFocus = useCallback((e) => {


		setFocus(true);
		window.addEventListener("resize", getCaretCoordinates);

		window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "focus123");



	}, []);



	const onBlur = useCallback((e) => {
		setFocus(false);


		// savedSelection.current = editor.selection;
		window.removeEventListener("resize", getCaretCoordinates);

		window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur");
	}, []);



	return (
		<div>


			<EditablePopup editor={editor} ModalProps={ModalProps} />
			<Slate
				editor={editor}

				onChange={(value) => {
					const ua = navigator.userAgent
					if (editor.selection) {

						const string = Node.leaf(editor, editor.selection.anchor.path);
						const parent = Editor.parent(editor, editor.selection.anchor.path);


						if (string.text.startsWith("1. ") && parent[0].type != "list-item" && !/android/i.test(ua)) {
							Editor.withoutNormalizing(editor, () => {
								toggleBlock(editor, "numbered-list", "number");
								Transforms.delete(editor, {
									at: editor.selection.anchor,
									unit: "word",
									reverse: true,
								});

							})
							return false;
						} else if (parent[0].type == "link" && parent[0].children[0].text.length <= 0) {


							Transforms.removeNodes(editor, {
								at: parent[1]
							})

						}
					}





				}}
				initialValue={initialValue}>


				<div
					onClick={(e) => {

						ReactEditor.focus(editor);



						const block1 = {
							type: "dropdown-content",
							checked: true,

							children: [
								{
									type: "span-txt",
									children: [
										{
											text: "",
										},
									],
								},

								{
									type: "dropdown-inner",
									children: [
										{
											type: "paragraph",
											children: [
												{
													id: 1,
													text: "",
												},
											],
										},
									],
								},
							],
						};
						// Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });

						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "paragraph" || n.type == "list-item" || n.type == "banner-red-wrapper",
						});

						if (Editor.isEmpty(editor, listItems[0])) {
							Transforms.insertNodes(editor, block1, { at: editor.selection.anchor.path });
							Transforms.unwrapNodes(editor, { mode: "highest" });
							Transforms.move(editor, { reverse: true, distance: 1, unit: 'offset' })
						} else {
							const nextNode = Editor.next(editor, {
								at: listItems[1],
							});

							if (!nextNode) {
								Editor.insertBreak(editor);

								Transforms.insertNodes(editor, block1, { at: editor.selection.anchor.path });
							} else {
								Transforms.insertNodes(editor, block1, { at: nextNode[1] });

							}
							const parentCheck = Editor.node(editor, editor.selection.anchor.path, { match: (n) => n.type == "dropdown-content" });



							// Transforms.select(editor, [editor.selection.anchor.path, 0])

						}
					}}>
					insert voidnow
				</div>
				{/* <div
					onClick={(e) => {
						const block = {
							type: "editable-void",
							card: [],
							children: [{ text: '' }],
						};
						const block1 = {
							type: "dropdown-content",
							children: [

								{
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
								},
							],
						};
						// Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });

						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "paragraph" || n.type == "list-item" || n.type == "banner-red-wrapper",
						});
						if (Editor.isEmpty(editor, listItems[0])) {
							Transforms.insertNodes(editor, block1, { at: editor.selection.anchor.path });
							Transforms.unwrapNodes(editor, { mode: "highest" });
						} else {
							const nextNode = Editor.next(editor, {
								at: listItems[1],
							});




							if (!nextNode) {
								Editor.insertBreak(editor);

								Transforms.insertNodes(editor, block1, { at: editor.selection.anchor.path });
							} else {
								Transforms.insertNodes(editor, block1, { at: nextNode[1] });

							}
							undo = true;

						}
					}}>
					insert voidnow
				</div>

				<div onClick={e => { ReactEditor.blur(editor) }}>
					click now123
				</div>

				<div onClick={e => {
					const { selection } = editor;
					ReactEditor.focus(editor);

					// if (selection && Range.isCollapsed(selection)) {
					// 	ReactEditor.focus(editor);

					// 	const [start] = Editor.edges(editor, selection);
					// 	const path = start.path;

					// 	// Remove nodes at the current path
					// 	Transforms.removeNodes(editor, { at: path });

					// 	Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: 'asd' }] }, { at: path });
					// 	const newPath = [...path, 0]; // Assuming you want to set the cursor at the start of the inserted node
					// 	Transforms.select(editor, Editor.range(editor, newPath));
					// 	Transforms.move(editor, { unit: "offset", distance: 1 });

					// 	// Insert new nodes at the current path

					// }


				}}>
					click focus
				</div>

				<div
					style={{ padding: "10px" }}
					onClick={(event) => {
						// updateAmount(true);
						// event.preventDefault();
						// Transforms.insertText(editor, "\u200b".toString(), {
						// 	at: editor.selection.anchor,
						// });
						ReactEditor.focus(editor);

						insertKatex(editor, "jjk", updateAmount);
						// getCaretCoordinates();
					}}>
					Katex Link
				</div> */}

				<div
					onClick={(e) => {
						ReactEditor.focus(editor);

						const block = {
							type: "editable-void",
							checked: true,
							card: [],
							children: [{ type: 'span-txt', children: [{ text: '' }] }],
						};

						Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });
						Transforms.unwrapNodes(editor, { mode: "highest" });
						getCaretCoordinates();





					}}>
					insert banner void
				</div>

				<div
					onClick={(e) => {
						ReactEditor.focus(editor);
						toggleBlock(editor, "numbered-list", "number");


					}}>
					insert numbered list
				</div>

				<div onClick={(e) => {
					ReactEditor.focus(editor);

					wrapperCheck(editor);

				}}>
					insert banner red
				</div>

				<div onClick={(e) => {
					ReactEditor.focus(editor);
					// Transforms.insertText(editor, "\u200B".toString(), {
					// 	at: editor.selection.anchor,
					// });
					insertKatex(editor, "flutter");

				}}>
					insert katex
				</div>

				<div onClick={(e) => {
					ReactEditor.focus(editor);

					const block = {
						type: 'input-component',
						inputTxt: 'ok',
						children: [{ text: '' }]
					}

					Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });
					Transforms.unwrapNodes(editor, { mode: "highest" });


				}}>
					insert input
				</div>


				<div onClick={(e) => {
					const ua = navigator.userAgent

					const block = {
						type: "table-list",
						insert: true,
						checked: true,
						children: [
							{ type: 'span-txt', id: 'span-txt', children: [{ text: '' }] },
							{
								type: 'table-cell1', id: 1, selected: true, children: [{ type: 'paragraph', children: [{ text: '' }] }]
							}, {
								type: 'table-cell1', id: 2, selected: false, children: [{ type: 'paragraph', children: [{ text: '' }] }]
							},
							{
								type: 'table-cell1', id: 3, selected: false, children: [{ type: 'paragraph', children: [{ text: '' }] }]
							},
							{
								type: 'table-cell1', id: 4, selected: false, children: [{ type: 'paragraph', children: [{ text: '' }] }]
							}
						]
					};
					ReactEditor.focus(editor);

					Transforms.insertNodes(editor, block, { at: editor.selection.anchor.path });
					Transforms.unwrapNodes(editor, { mode: "highest" });
					Transforms.select(editor, [editor.selection.anchor.path[0], 1]);



					getCaretCoordinates();

					undo = false;
				}}>
					insert table
				</div>

				<BlockButton
					format="url-link"
					icon="format_list_item"
				/>



				{/*

			
				<BlockButton
					icon="format_list_item"
					format="bulleted-list"
				/>



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
				</div> */}

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

					id={'asd'}
					renderLeaf={renderLeaf}


					onKeyDown={(event) => {
						const ua = navigator.userAgent
						for (const hotkey in HOTKEYS) {
							if (isHotkey(hotkey, event)) {
								event.preventDefault();
								const mark = HOTKEYS[hotkey];
								toggleMark(editor, mark);
							}
						}
						leftCheck = false;
						rightCheck = false;
						let timeset;
						const [listItems] = Editor.nodes(editor, {
							match: (n) => n.type === "list-item" || n.type == 'editable-void' || n.type == "span-txt" || n.type == "inline-bug" || n.type == "check-list-item" || n.type == "paragraph" || n.type == "table-list" || n.type == "dropdown-content"
						});
						const parentCheck = Editor.above(editor, { match: (n) => n.type == "table-cell1" || n.type == "dropdown-inner" || n.type == "numbered-list" });
						const stringText = Editor.node(editor, editor.selection.anchor.path);



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
						}
						else if (event.metaKey && event.key === "z" && !event.shiftKey) {
							event.preventDefault();
							HistoryEditor.undo(editor);
							undo = true;

						} else if (event.metaKey && event.shiftKey && event.key === "z") {
							event.preventDefault();
							HistoryEditor.redo(editor);
							undo = true;


						}

						else if ((event.key == 'Enter') && listItems && ["dropdown-content", "table-list", "editable-void"].includes(listItems[0].type) && !parentCheck) {
							event.preventDefault();

							Transforms.setNodes(editor, { checked: false, selectNode: true }, { at: listItems[1] });
							Transforms.select(editor, [editor.selection.anchor.path[0] + 1, 0])
							getCaretCoordinates();



						}
						// else if (stringText[0].text.startsWith("1.") && /android/i.test(ua)) {
						// 	setTimeout(() => {
						// 		Editor.withoutNormalizing(editor, () => {

						// 			toggleBlock(editor, "numbered-list", "number");
						// 			Transforms.delete(editor, { at: editor.selection.anchor, distance: 2, reverse: true, unit: 'word' })
						// 		})
						// 	}, 0)


						// }



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

	// Transforms.wrapNodes(editor, block, { split: true });

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
				return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "numbered-list";
			},
			split: true,
		});


		Transforms.unwrapNodes(editor, {
			match: (n) => {
				return !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == "banner-red-wrapper";
			},
			split: true,
		});
		Transforms.setNodes(editor, { type: "list-item" });
		const block = { type: "numbered-list", children: [] };

		Transforms.wrapNodes(editor, block);


		// toggleBlock(editor, "numbered-list", "number");
	}

	ReactEditor.focus(editor);
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
		Transforms.move(editor, { unit: "offset", distance: 1 });


	} else {
		Transforms.wrapNodes(editor, link, { split: true });
		Transforms.move(editor, { unit: "offset", distance: 1 });

		ReactEditor.focus(editor);
	}



};

const insertLink = (editor, url) => {
	if (editor.selection) {
		ReactEditor.focus(editor);
		wrapLink(editor, url);
	}
};

const insertKatex = (editor, url, updateAmount) => {
	const ua = navigator.userAgent

	if (/android/i.test(ua)) {
		Transforms.insertText(editor, "\u200B".toString(), {
			at: editor.selection.anchor,
		});
	}


	let id = v4();
	const katex = {
		type: "katex",
		url,
		id,
		children: [{ text: "", type: "katex", checked: true }],
	};


	Transforms.insertNodes(editor, katex);

	Transforms.move(editor);


};

const withInlines = (editor) => {
	const { insertData, insertText, isInline, markableVoid, isVoid } = editor;

	editor.isInline = (element) => ["button", "link", "katex", "inline-bug", "inline-wrapper-bug", "inline-wrapper"].includes(element.type) || isInline(element);

	editor.isVoid = (element) => ["katex", "inline-bug", "span-txt", "input-component"].includes(element.type) || isVoid(element);

	editor.markableVoid = (element) => {
		return element.type === "katex" || markableVoid(element);
	};

	return editor;
};

const ChromiumBugfix = () => (
	<span
		contentEditable={false}
		className={css`
		font-size: 0;
	  `}
	>
		{String.fromCodePoint(160) /* Non-breaking space */}
	</span>
)

const LinkComponent = ({ attributes, children, element }) => {
	const selected = useSelected();
	const editor = useSlate();

	const focused = useFocused();
	let updateAmount = useModalStore((state) => state.updateModal);


	return (
		<a

			className={
				selected
					? css`
							box-shadow: 0 0 0 3px #ddd;
					  `
					: ""
			}
			href={element.url}
			onClick={(e) => {
				window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "blur");

				let data = {
					element: element,
					editor: editor,
					click: true,
					type: "link",
					edit: true,
					open: true,
					path: ReactEditor.findPath(editor, element),
				};
				updateAmount(data);

			}}>

			<ChromiumBugfix />
			{children}
			<ChromiumBugfix />


		</a>

	);

}


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

const SpanTxt = ({ attributes, children, element }) => {
	const selected = useSelected();
	const focused = useFocused();
	const ua = navigator.userAgent

	return (
		<div contentEditable={/android/i.test(ua) ? true : false} {...attributes}>
			{children}
		</div>

	)

}

const KatexComponent = ({ attributes, children, element }) => {
	const editor = useSlate();
	const katextext = katex.renderToString(String.raw`${element.url}`);
	const selected = useSelected();
	const focused = useFocused();
	const path = ReactEditor.findPath(editor, element);




	return (
		<span

			onClick={(e) => {
				window.flutter_inappwebview?.callHandler("handlerFooWithArgs", "katex");

			}}
			style={{
				background: selected ? "red" : "",
			}}
			className="span-katex"
			{...attributes}>

			<span
				contentEditable="false"

				dangerouslySetInnerHTML={{ __html: katextext }}></span>

			{children}
			&nbsp;

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
	let ModalProps = useModalStore((state) => state.display);

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
				onClick={(event) => {

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
	} else {
		return (
			<div
				onClick={(event) => {


					HistoryEditor.undo(editor);
					undo = true;
					ReactEditor.focus(editor);


				}}>
				undo
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
	const parentCheck = Editor.parent(editor, editor.selection.anchor.path, { match: (n) => LIST_PARENT.includes(n.type) });

	if (format == "list-item" || format == "check-list-item") {
		formatCheck = ["numbered-list", "bulleted-list", "check-list"];
	} else {
		formatCheck = [format];
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
			children: [{ text: '' }]
		};
	}

	Transforms.setNodes(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}

	const [currentNode] = Editor.nodes(editor, {
		match: (n) => LIST_PARENT.includes(n.type),
	});

	let prevParent, nextParent;
	if (currentNode) {
		prevParent = Editor.previous(editor, { at: currentNode[1], match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (LIST_PARENT.includes(n.type) || n.type == "paragraph") })
		nextParent = Editor.next(editor, { at: currentNode[1], match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_PARENT.includes(n.type) })


	}



	if (currentNode && prevParent && currentNode[0].type == prevParent[0].type) {
		const [parent, parentPath] = currentNode;


		// Merge current node with the one above
		Transforms.mergeNodes(editor, { at: parentPath, match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type });

		// Merge the newly merged node with the one below
		Transforms.mergeNodes(editor, { at: parentPath, match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type });

		// // Wrap the merged content into a new numbered list
		// const newList = { type: 'numbered-list', children: [] };
		// Transforms.wrapNodes(editor, newList, { at: parentPath });
	} else if (nextParent && currentNode) {
		Transforms.mergeNodes(editor, { at: nextParent[1], match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type == currentNode[0].type });

	}

	focusCheck = false;
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
	const { checked, selectNode } = element;




	return (
		<div
			{...attributes}
			className="dropdown-content  mx-3"
		>
			{children}
		</div>
	);
};

const DropDownList = ({ attributes, children, element }) => {
	const selected = useSelected();
	const focused = useFocused();

	const editor = useSlate();
	const { checked, selectNode } = element;
	const path = ReactEditor.findPath(editor, element);

	const [nodes] = Editor.nodes(editor, {
		at: path,
		match: (n) => n.type == "dropdown-content",
	});






	const addMore = () => {

		ReactEditor.focus(editor);
		const path = ReactEditor.findPath(editor, element);



		let arraynow = [...nodes[0].children.filter((o) => {
			return o.type == "dropdown-inner"

		})];
		let object = {
			type: "dropdown-inner",
			children: [
				{
					type: "paragraph",
					id: arraynow.length + 1,
					children: [
						{
							text: "",
						},
					],
				},
			],
		};
		arraynow.push(object);

		const block1 = {
			type: "dropdown-content",
			children: [{
				type: "span-txt",
				children: [
					{
						text: "",
					},
				],
			}, ...arraynow],
		};

		Transforms.removeNodes(editor, { at: path });
		Transforms.insertNodes(editor, block1, { at: path });
		// Transforms.select(editor, [path[0], arraynow.length - 1]);
	};
	return (
		<div
			{...attributes}
			className="p-[10px] w-full"
			style={{ background: (selected) ? 'green' : '', border: '1px solid grey', borderRadius: "10px" }}>
			<div>
				{children[0]}

			</div>
			<button
				onClick={(e) => {
					addMore();
				}}>
				click me
			</button>
			<div
				// onClick={e => { Transforms.setNodes(editor, { checked: false }, { at: path }) }}
				className="grid-container">
				{nodes[0].children.map((o, key) => {

					if (o.type == "dropdown-inner") {
						return (
							children[key]
						)
					}


				})}


			</div>






		</div>
	);
};


const TableList = ({ attributes, children, element }) => {
	const selected = useSelected();
	const focused = useFocused();
	const editor = useSlate();
	const { card, checked, insert } = element;
	const path = ReactEditor.findPath(editor, element);

	// const pathCheck = Editor.next(editor, { at: [editor.selection.anchor.path[0] + 1, 0] })






	// if (!selected && pathCheck && pathCheck[0].type == "table-cell1" && undo) {
	// 	Transforms.select(editor, [editor.selection.anchor.path[0] + 1, 1, 0]);
	// 	undo = false;
	// }

	// if (checked && undo) {

	// 	Transforms.select(editor, [path[0], 0]);
	// 	// Transforms.move(editor, { distance: 1, unit: 'offset', reverse: true })
	// 	undo = false;
	// }
	// else if (!checked && selected && undo) {

	// 	Transforms.select(editor, [editor.selection.anchor.path[0] + 1, 0]);

	// 	undo = false;
	// }




	return (
		<>

			<table style={{ background: selected ? 'green' : '' }} className="relative"  {...attributes}>
				{children[0]}
				<tr>

					{children.map((o, key) => {
						if (1 <= key && key <= 2) {

							return children[key]

						}

					})}
					{/* {card.map((o, key) => {
						return (
							<CellElement setCallback={arrayCheck} select={selectArray[key]} path={path} card={card} data={o} key={key} />

						)


					})} */}



				</tr>

				<tr>
					{children.map((o, key) => {
						if (3 <= key && key <= 4) {

							return children[key]

						}

					})}
				</tr>


			</table>

		</>

	)


}


const InputComponent = ({ attributes, children, element }) => {
	const editor = useSlate();
	const [inputValue, setInputValue] = useState(null);
	const path = ReactEditor.findPath(editor, element);

	const { inputTxt } = element;

	const checkInput = (val) => {

		Transforms.setNodes(editor, { inputTxt: val }, { at: path })



	}

	return (
		<div style={{ width: '100%', height: '100px', background: 'green' }} {...attributes}>

			<input contentEditable="false" className="w-full h-[30px]" value={inputValue ? inputValue.txt : inputTxt}
				onChange={(e) => {
					e.preventDefault();
					setInputValue({ txt: e.target.value });
					checkInput(e.target.value);

				}}
				onFocus={e => {
					setInputValue({ txt: e.target.value });

				}}
				onBlur={e => {
					setInputValue(null);


				}}
				type="text"></input>
			<div>
				{children}

			</div>

		</div>


	)


}

const EditableVoid = ({ attributes, children, element }) => {
	const editor = useSlate();
	const { card, checked } = element;
	const selected = useSelected();
	const focused = useFocused();
	let cardnow;
	let focusCheck;
	const [objCopy, setObj] = useState();
	const [open, setOpen] = useState(false);
	const path = ReactEditor.findPath(editor, element);

	const [inputValue, setInputValue] = useState('');
	const ua = navigator.userAgent


	// if (checked && undo) {
	// 	Transforms.select(editor, path);
	// 	undo = false;
	// } else if (!checked && selected && undo) {
	// 	Transforms.move(editor, { distance: 1, unit: 'offset' });
	// 	undo = false;
	// }




	const addCard = () => {
		let cardObj = { card: card.length + 1, id: 0, check: false };
		cardObj.id = card.length;
		cardnow = [...card, cardObj];


		setObj(cardnow);
		Transforms.setNodes(editor, { card: cardnow }, { at: path });
	};

	const checkInput = (text, key, card) => {
		let cardnow = [...card];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { card: text, id: key, check: true });

		setObj(cardnow);
		Transforms.setNodes(editor, { card: cardnow }, { at: path });

	};

	const setModal = useCallback((key, card1, check) => {
		let cardnow = [...card1];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { ...cardnow[index], check: check });

		setObj(cardnow);
		setOpen(true);
		// Transforms.setNodes(editor, { card: cardnow }, { at: path });
	}, []);




	useEffect(() => {


		window.addEventListener("message", function (event) {
			if (typeof event.data == "string") {
				let value = JSON.parse(event.data);

				if (value && value.id == "katex") {
					ReactEditor.focus(editor);
					var index = _.findIndex(cardnow, { id: value.key });
					Transforms.setNodes(editor, { card: [{ card: value.card, id: value.cardId, check: false }] }, { at: path });

					// if (cardnow[index].card != 'hello world') {
					// 	cardnow.splice(index, 1, { ...cardnow[index], card: 'hello world', check: false });

					// }

				}
			}



		})


	}, [])

	const setCheckValidate = useCallback((key, card1, check) => {
		let cardnow = [...card1];
		var index = _.findIndex(cardnow, { id: key });
		cardnow.splice(index, 1, { ...cardnow[index], check: check });

		setObj(cardnow);
	}, []);

	return (
		// Need contentEditable=false or Firefox has issues with certain input types.
		<div
			// onClick={e => { Transforms.setNodes(editor, { checked: true }, { at: path }); }}
			style={{
				border: selected ? "1px solid red" : "1px solid grey",
				background: selected ? 'green' : '',
				position: 'relative',
				overflow: 'hidden',
				height: "100px",
				width: "100%"
			}}
			{...attributes}

		>





			{/* <button
				style={{ cursor: 'pointer' }}
				onClick={(e) => {
					addCard();
				}}>
				click here123

			</button> */}


			<div>



				{/* <EditablePopup
					open={open}
					card={objCopy}
					setOpenCallback={setOpen}
					path={path}
					editor={editor}
				/> */}
				<div className="flex" contentEditable="false">
					{card?.map((o, key) => {
						return (
							<div
								className="m-3"
								onClick={(e) => {
									// setModal(key, card, true);
									// setCheckValidate(key, card, false)

								}}
								style={{ height: "100%", width: "50%", background: "red" }}
								key={key}>

								<div
									contentEditable="false"
									// onClick={(e) => {
									// 	setModal(key, card, true);
									// }}
									style={{ height: "100%", width: "100%", background: "red" }}
									key={key}>
									{o.card}
								</div>








							</div>
						);
					})}
				</div>
			</div>


			<div>
				{children}


			</div>

			<div>
				&#x200B;
			</div>




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



const TableCell1 = ({ attributes, children, element }) => {

	const editor = useSlate();
	const path = ReactEditor.findPath(editor, element);
	const parent = Editor.node(editor, path);

	// if (element.selected && undo && parent[0].children[0].children[0].text.length <= 0) {

	// 	Transforms.select(editor, path);
	// 	undo = false
	// } else if (element.selected && !selected && !undo) {
	// 	Transforms.setNodes(editor, { selected: false }, { at: path })

	// }


	return (
		<td   {...attributes}>
			{children}
		</td>
	)
}

const CheckListItemElement = ({ attributes, children, element }) => {
	const editor = useSlate();
	const { checked } = element;
	const readOnly = useReadOnly()

	let timeoutRef = React.useRef();
	let workaroundIOSDblClickBug = () => {
		// Add touch-action: manipulation on click to workaround https://bugs.webkit.org/show_bug.cgi?id=216681,
		// and remove after a short delay to prevent double click.
		let root = document.getElementById("__next");
		root.style.touchAction = "manipulation";
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			root.style.touchAction = "";
		}, 500);
	};
	return (
		<div
			{...attributes}
			className={css`
				display: flex;
				flex-direction: row;
				align-items: flex-start;

			
			`}>
			<span
				contentEditable={false}
				className={css`
					user-select: none;
					margin-right: 0.5em;
                    margin-top: 0.1em;
					display:block;
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
				contentEditable={!readOnly}
				suppressContentEditableWarning
				className={css`
					opacity: ${checked ? 0.666 : 1};
					text-decoration: ${!checked ? "none" : "line-through"};
					word-wrap: break-word;
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
		case "inline-wrapper":
			return (
				<span contentEditable="false" {...attributes}>
					{children}
				</span>
			)
		case "inline-bug":
			return <InlineChromiumBugfix {...props} />;
		case "inline-wrapper-bug":
			return <InlineWrapperBug {...props} />;
		case "editable-void":
			return <EditableVoid {...props}></EditableVoid>;
		case "check-list-item":
			return <CheckListItemElement {...props} />;
		case "dropdown-content":
			return <DropDownList {...props} />;
		case "input-component":
			return <InputComponent {...props} />;

		case "table-list":
			return <TableList {...props} />;

		case "table-cell1":
			return <TableCell1 {...props} />;
		case "heading-one":
			return <Heading1Component {...props}></Heading1Component>;
		case "span-txt":
			return (
				<SpanTxt {...props}></SpanTxt>
			)
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
