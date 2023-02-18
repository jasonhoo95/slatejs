import { v4 } from "uuid";

export const QuillComponent = () => {
	let Inline = Quill.import("blots/inline");
	var Block = Quill.import("blots/block");
	const BlockEmbed = Quill.import("blots/embed");
	const Link = Quill.import("formats/link");
	const HtmlBlock = Quill.import("blots/block/embed");

	let SizeStyle = Quill.import("attributors/style/size");
	SizeStyle.whitelist = ["10px", "15px", "18px", "20px", "32px", "54px"];
	Quill.register(SizeStyle, true);

	class MediaBlot extends HtmlBlock {
		static create(value) {
			const node = super.create();
			node.setAttribute("src", "https://www.youtube.com/embed/HV9SQ3ZTGSA");
			node.setAttribute("frameborder", "0");
			node.setAttribute(
				"allow",
				"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
			);
			node.setAttribute("allowtransparency", true);
			node.setAttribute("allowfullscreen", true);
			node.setAttribute("scrolling", "0");
			node.setAttribute("width", "100%");
			node.setAttribute("height", "400px");
			return node;
		}

		static value(node) {
			return node.dataset.id;
		}
	}

	MediaBlot.blotName = "videoFrame";
	MediaBlot.tagName = "iframe";
	Quill.register(MediaBlot);

	class MyLink extends Link {
		static create(value) {
			let node = super.create(value);

			return node;
		}

		constructor(domNode) {
			super(domNode);
			domNode.classList.add("hreflink");
		}
	}

	Quill.register(MyLink);

	class MentionBlot extends BlockEmbed {
		static create(data) {
			let uuid = v4();

			const node = super.create(data.name);
			node.innerHTML = `<span style='background-color:red;'>${data.name}</span>`;

			// store data
			node.setAttribute("data-name", data.name);
			node.setAttribute("id", uuid);
			node.setAttribute("data-attribute", data.attribute);
			node.setAttribute("data-mainID", data.mainID);

			// document.querySelector(`#${id} .popup-overlay`).setAttribute("data-name", data.name);
			return node;
		}

		static value(domNode) {
			return {
				name: domNode.getAttribute("data-name"),
				attribute: domNode.getAttribute("data-attribute"),
				mainID: domNode.getAttribute("data-mainID"),
			};
		}

		static formats(domNode) {
			return {
				name: domNode.getAttribute("data-name"),
				attribute: domNode.getAttribute("data-attribute"),
				mainID: domNode.getAttribute("data-mainID"),
			};
		}
	}

	MentionBlot.blotName = "mention";
	MentionBlot.className = "quill-mention";
	MentionBlot.tagName = "span";

	Quill.register({
		"formats/mention": MentionBlot,
	});

	var icons = Quill.import("ui/icons");
	icons["header2Block"] =
		'<img style="width:100%;height:100%" src="green-tick.png"/>';
	class HighlightBlot extends Inline {
		static create(value) {
			let node = super.create(value);

			// if (value.group) {
			// 	node.classList.add("highlight-1");
			// }

			return node;
		}

		constructor(domNode) {
			super(domNode);

			domNode.classList.add("subheading");
		}

		static formats(domNode) {
			return {
				isInvalidSpelling: true,
				alternativeSpellings: domNode.getAttribute(
					"data-alternative-spellings"
				),
			};
		}
	}

	HighlightBlot.blotName = "highlight";
	HighlightBlot.tagName = "a";
	HighlightBlot.className = "red-shadow";

	Quill.register("formats/highlight", HighlightBlot);

	class FontSizeInline extends Inline {
		static create(value) {
			let id = v4();
			let node = super.create(value);

			node.setAttribute("style", `font-size:${value.size};color:black`);
			node.dataset.id = id;

			// if (value.group) {
			// 	node.classList.add("highlight-1");
			// }

			return node;
		}

		constructor(domNode) {
			super(domNode);
		}

		static formats(node) {
			return {
				size: node.style.fontSize,
				id: node.dataset.id,
			};
		}

		// static value(domNode) {
		// 	return {
		// 		size: domNode.style.fontSize,
		// 	};
		// }
	}

	FontSizeInline.blotName = "FontSizeInline";
	FontSizeInline.className = "FontSizeInline";
	FontSizeInline.tagName = "a";

	Quill.register("formats/FontSizeInline", FontSizeInline);

	class ShadowInline extends Inline {
		static create(value) {
			let node = super.create(value);

			let id = v4();
			node.setAttribute("style", `color: ${value.color};`);
			node.dataset.id = id;

			return node;
		}

		constructor(domNode) {
			super(domNode);
		}

		static formats(domNode) {
			return {
				color: domNode.style.color,
				id: domNode.dataset.id,
			};
		}
	}

	ShadowInline.blotName = "ShadowInline";
	ShadowInline.tagName = "a";
	ShadowInline.className = "shadowInline";

	Quill.register("formats/ShadowInline", ShadowInline);

	class CommentInline extends Inline {
		static create(value) {
			let node = super.create(value);

			let id = v4();
			node.setAttribute("style", `border-bottom:1px solid yellow;`);
			node.dataset.id = id;
			node.setAttribute("data-value", value.value);

			return node;
		}

		constructor(domNode) {
			super(domNode);
		}

		static formats(domNode) {
			return {
				color: domNode.style.color,
				id: domNode.dataset.id,
				value: domNode.getAttribute("data-value"),
			};
		}

		static value(domNode) {
			return {
				color: domNode.style.color,
				id: domNode.dataset.id,
				value: domNode.getAttribute("data-value"),
			};
		}
	}

	CommentInline.blotName = "CommentInline";
	CommentInline.tagName = "a";
	CommentInline.className = "CommentInline";

	Quill.register("formats/CommentInline", CommentInline);

	class BreakSpan extends BlockEmbed {
		static create(value) {
			let node = super.create(value);
			node.innerHTML = "<span><br/>&#xFEFF;</span>";
			return node;
		}

		static formats(domNode) {
			return {
				isInvalidSpelling: true,
				alternativeSpellings: domNode.getAttribute(
					"data-alternative-spellings"
				),
			};
		}
	}

	BreakSpan.blotName = "breakspan";
	BreakSpan.tagName = "span";
	BreakSpan.className = "breakspan";

	Quill.register("formats/breakspan", BreakSpan);

	class RedShadowBlock extends BlockEmbed {
		static create(value) {
			let node = super.create(value);
			return node;
		}

		static formats(domNode) {
			return {
				isInvalidSpelling: true,
				alternativeSpellings: domNode.getAttribute(
					"data-alternative-spellings"
				),
			};
		}
	}

	RedShadowBlock.blotName = "RedShadowBlock";
	RedShadowBlock.tagName = "span";
	RedShadowBlock.className = "red-shadow";

	Quill.register("formats/RedShadowBlock", RedShadowBlock);

	// class FormatKatex extends BlockEmbed {
	// 	static create(value) {
	// 		let id = v4();
	// 		let node = super.create(value);
	// 		var html = katex.renderToString(String.raw`${value.value}`, {
	// 			throwOnError: false,
	// 		});
	// 		// node.contentEditable = "false";
	// 		node.setAttribute("id", id);
	// 		node.setAttribute("data-value", value.value);
	// 		node.setAttribute("data-mainID", value.mainID);

	// 		node.innerHTML = `<div style="overflow:auto;text-align:center">${html}</div>`;

	// 		return node;
	// 	}

	// 	static value(domNode) {
	// 		return {
	// 			value: domNode.getAttribute("data-value"),
	// 			mainID: domNode.getAttribute("data-mainID"),
	// 		};
	// 	}

	// 	constructor(domNode, value) {
	// 		super(domNode);
	// 		domNode.addEventListener("click", (e) => {
	// 			// alert("click");
	// 		});
	// 	}
	// }

	// FormatKatex.blotName = "formatKatexBlock";
	// FormatKatex.tagName = "span";
	// FormatKatex.className = "ql-formula";

	// Quill.register("formats/formatKatexBlock", FormatKatex);

	class FormatKatexInline extends BlockEmbed {
		static create(value) {
			let id = v4();
			let node = super.create(value);

			try {
				var html = katex.renderToString(String.raw`${value.value}`);
				node.innerHTML = `<span >${html}</span>`;
				node.setAttribute("data-value", value.value);
				return node;
			} catch (e) {
				if (e instanceof katex.ParseError) {
					// KaTeX can't parse the expression
					node.innerHTML = "error handling";
					return node;
				} else {
					throw e; // other error
				}
			}
			// var html = katex.renderToString(String.raw`${value.value}`, {
			// 	throwOnError: true,
			// 	// displayMode: true,
			// });

			// console.log(html, "html error");
			// if (!html) {
			// 	node.innerHTML = `<span >math error</span>`;
			// } else {
			// 	node.innerHTML = `<span >${html}</span>`;
			// 	node.setAttribute("data-value", value.value);
			// }
		}

		static value(domNode) {
			return {
				value: domNode.getAttribute("data-value"),
				// mainID: domNode.getAttribute("data-mainID"),
			};
		}

		constructor(domNode, value) {
			super(domNode);

			// domNode.querySelector(".ql-formula > span").setAttribute("contenteditable", true);
		}
	}

	FormatKatexInline.blotName = "formatKatexInline";
	FormatKatexInline.tagName = "span";
	FormatKatexInline.className = "ql-formula";

	Quill.register("formats/formatKatexInline", FormatKatexInline);

	class redDivInline extends Block {
		static create(value) {
			let node = super.create(value);

			node.setAttribute("color", value.color);
			switch (value.color) {
				case "green":
					node.setAttribute(
						"style",
						`background-color:rgba(255,229,100,.3);border-left:4px solid #ffe564 `
					);
					break;
				case "red":
					node.setAttribute(
						"style",
						`background-color:rgba(255,100,100,.3);border-left:4px solid #ff6464 `
					);
					break;
			}

			return node;
		}

		static formats(domNode) {
			return {
				color: domNode.getAttribute("color"),
			};
		}
	}

	redDivInline.blotName = "redDivInline";
	redDivInline.tagName = "div";
	redDivInline.className = "redDivInline";

	class checkBox extends Block {
		static create(value) {
			let id = v4();
			let node = super.create(value);

			node.setAttribute("id", id);
			node.setAttribute("data-list", "unchecked");

			return node;
		}
		constructor(domNode) {
			super(domNode);

			var newTH = document.createElement("li");
			newTH.className = "checkbox";
			newTH.onclick = function () {
				domNode.setAttribute("data-list", "checked");
			};
			domNode.appendChild(newTH);
		}
	}

	checkBox.blotName = "checkBox";
	checkBox.tagName = "ol";
	checkBox.className = "licheck";
	class redDivBlock extends Block {
		static create(value) {
			let node = super.create(value);

			node.setAttribute("color", value.color);
			switch (value.color) {
				case "green":
					node.setAttribute(
						"style",
						`background-color:rgba(255,229,100,.3);border-left:4px solid #ffe564 `
					);
					break;
				case "red":
					node.setAttribute(
						"style",
						`background-color:rgba(255,100,100,.3);border-left:4px solid #ff6464 `
					);
					break;
			}

			return node;
		}

		static formats(domNode) {
			return {
				color: domNode.getAttribute("color"),
			};
		}
	}

	redDivBlock.blotName = "redDiv";
	redDivBlock.tagName = "div";
	redDivBlock.className = "redDiv";

	class animationBlock extends Block {
		static create(value) {
			let node = super.create(value);

			node.setAttribute("data-type", value.type);

			return node;
		}
		constructor(domNode) {
			super(domNode);
		}

		static formats(domNode) {
			return {
				type: domNode.getAttribute("data-type"),
			};
		}
	}

	animationBlock.blotName = "animationBlock";
	animationBlock.tagName = "p";
	animationBlock.className = "fadein-anim";

	class paragraphBlock extends Block {
		static create(value) {
			let node = super.create(value);
			let id = v4();
			node.setAttribute("id", id);

			// node.innerText = "Please enter something";
			// node.setAttribute("data-placeholder", "Type / for full options");

			return node;
		}
		constructor(domNode) {
			super(domNode);
		}

		static formats(domNode) {
			return {
				type: domNode.getAttribute("data-type"),
			};
		}
	}

	paragraphBlock.blotName = "paragraphBlock";
	paragraphBlock.className = "paragraph1";

	paragraphBlock.tagName = "p";

	class header2Block extends Block {
		static create(value) {
			let node = super.create(value);
			let id = v4();
			node.setAttribute("id", id);
			node.setAttribute("class", value.class);

			// node.innerText = "Please enter something";

			return node;
		}
		constructor(domNode) {
			super(domNode);
		}

		static formats(domNode) {
			return {
				class: domNode.getAttribute("class"),
			};
		}
	}

	header2Block.blotName = "header2Block";

	header2Block.tagName = "h2";

	class paragraphInline extends Block {
		static create(value) {
			let node = super.create(value);

			// node.setAttribute("data-name", value.name);

			return node;
		}
		constructor(domNode) {
			super(domNode);
			// domNode.classList.remove("linebreak-unordered");
			// return domNode;
			// domNode.setAttribute("id", id);

			// domNode.setAttribute("draggable", true);

			// domNode.innerHTML = "<span class='my-handle' contenteditable='false'>::</span>";
			// // domNode.setAttribute("draggable", true);
			// domNode.addEventListener("dragstart", drag);
		}
	}

	paragraphInline.blotName = "paragraphInline";
	paragraphInline.className = "paragraphInline";

	paragraphInline.tagName = "div";

	class paragraphSoft extends Block {
		static create(value) {
			let node = super.create(value);

			// node.setAttribute("data-name", value.name);

			return node;
		}
		constructor(domNode) {
			super(domNode);
			// domNode.setAttribute("id", id);

			// domNode.setAttribute("draggable", true);

			// domNode.innerHTML = "<span class='my-handle' contenteditable='false'>::</span>";
			// // domNode.setAttribute("draggable", true);
			// domNode.addEventListener("dragstart", drag);
		}
	}

	paragraphSoft.blotName = "paragraphSoft";
	paragraphSoft.tagName = "p";
	paragraphSoft.className = "ql-soft";

	Quill.register("formats/redDivInline", redDivInline);
	Quill.register("formats/paragraphSoft", paragraphSoft);

	Quill.register("formats/redDiv", redDivBlock);
	Quill.register("formats/paragraphBlock", paragraphBlock);
	Quill.register("formats/header2Block", header2Block);

	Quill.register("formats/paragraphInline", paragraphInline);
	Quill.register("formats/animationBlock", animationBlock);

	var fontFamilyArr = ["impact", "comicsans", "festive", "shadow1"];
	let fonts = Quill.import("attributors/style/font");
	fonts.whitelist = fontFamilyArr;
	Quill.register(fonts, true);

	// var ColorClass = Quill.import("attributors/class/color");
	// var fontColorArr = ["red-shadow", "blue-shadow"];

	// ColorClass.whitelist = fontColorArr;

	// Quill.register(ColorClass, true);

	var Parchment = Quill.import("parchment");

	const CustomLinkClass = new Parchment.Attributor.Class(
		"custom-link",
		"custom-link",
		{
			scope: Parchment.Scope.INLINE,
			// whitelist: ["custom-link-shadow"],
		}
	);
	Quill.register(CustomLinkClass, true);

	var LineBreakClass = new Parchment.Attributor.Class(
		"linebreak",
		"linebreak",
		{
			scope: Parchment.Scope.BLOCK,
		}
	);

	class HighlightLink extends Inline {
		static create(value) {
			let node = super.create(value);

			return node;
		}

		constructor(domNode) {
			super(domNode);
		}
		static formats(domNode) {
			return {
				class: domNode.getAttribute("class"),
			};
		}

		static value(node) {
			return {
				class: node.getAttribute("class"),
			};
		}
	}

	HighlightLink.blotName = "highlightLink";
	HighlightLink.className = "red-shadow";
	HighlightLink.tagName = "a";
	Quill.register(HighlightLink, true);

	Quill.register("formats/linebreak", LineBreakClass);

	let Width = new Parchment.Attributor.Attribute("data-id", "data-id", {
		scope: Parchment.Scope.BLOCK,
	});
	Quill.register("formats/unordered", Width);

	var checkClass = new Parchment.Attributor.Class("checkClass", "checkClass", {
		scope: Parchment.Scope.BLOCK,
	});

	Quill.register("formats/checkClass", checkClass);

	var BulletBreakClass = new Parchment.Attributor.Class(
		"bulletbreak",
		"bulletbreak",
		{
			scope: Parchment.Scope.BLOCK,
		}
	);

	Quill.register("formats/bulletbreak", BulletBreakClass);

	var ListItem = Quill.import("formats/list/item");
	var List = Quill.import("formats/list");
	// const { ListContainer } = Quill.import("formats/list");

	// class UlContainer extends ListContainer {
	// 	static create(value) {
	// 		const node = super.create();
	// 		return node;
	// 	}
	// }
	// UlContainer.blotName = "ol-container";
	// UlContainer.tagName = "OL";
	// class CheckList extends List {
	// 	static register() {
	// 		Quill.register(UlContainer);
	// 	}
	// }
	// UlContainer.allowedChildren = [CheckList];
	// CheckList.requiredContainer = UlContainer;
	// CheckList.blotName = "checklist";
	// CheckList.tagName = "li";
	// CheckList.className = "checklist";

	// Quill.register(CheckList, true);

	class CustomListItem extends ListItem {
		static create(value) {
			const node = super.create();

			node.classList.add("linebreak-true");

			return node;
		}
		constructor(domNode) {
			super(domNode);

			// if (domNode.className.match("linebreak-true")) {
			//
			// }
		}
	}

	CustomListItem.blotName = "list-item";
	CustomListItem.tagName = "li";

	// Quill.register(CustomListItem, true);

	let config = { scope: Parchment.Scope.INLINE };

	let SpanBlockClass = new Parchment.Attributor.Class(
		"span-block",
		"span",
		config
	);
	Quill.register(SpanBlockClass, true);
};
