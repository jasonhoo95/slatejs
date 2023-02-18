import React, { useEffect, useMemo, useState, Fragment } from "react";

import { v4 } from "uuid";
import { Dialog, Transition } from "@headlessui/react";
import { useSelector, useDispatch } from "react-redux";
// import { increment } from "@/globals/counterSlice";
export default function KatexPop({ type, quill, dataValue, open, setOpen }) {
	var Delta = Quill.import("delta");
	const [katexValue, setKatex] = useState("");
	const [linkInput, setLink] = useState("");
	const [mention, setMention] = useState("");

	useEffect(() => {
		if (dataValue.value && dataValue.edit) {
			setKatex(dataValue.value);
		} else if (dataValue.text && dataValue.editLink) {
			setLink(dataValue.text.innerText);
		} else if (!dataValue.editLink) {
			setLink("");
		}
	}, [dataValue]);

	useEffect(() => {}, []);

	const katexInsert = (txt) => {
		if (dataValue.edit) {
			let id = v4();
			const selection = quill.getSelection(true);

			let blot = Quill.find(dataValue.id);
			let index = blot.offset(quill.scroll);

			quill.updateContents(
				new Delta()
					.retain(index) // Keep 'Hello '
					.delete(1) // 'World' is deleted
					.insert({ formatKatexInline: { value: katexValue } })
			);
			quill.focus();
			quill.setSelection(selection.index + 1);
			setOpen(false);
			setKatex("");
		} else {
			let id = v4();
			const selection = quill.getSelection(true);
			quill.insertEmbed(selection.index, "formatKatexInline", {
				value: katexValue,
			});

			// quill.focus();
			quill.setSelection(selection.index + 1);
			setOpen(false);
			setKatex("");
		}
	};

	const insertUrl = () => {
		if (!dataValue.editLink) {
			const selection = quill.getSelection(true);

			if (selection.length > 0) {
				quill.formatText(selection, "link", "helloworld.com");
			}
			// quill.insertText(selection, linkTxt.text, "link", "https://helloworld.com", "silent");
			setOpen(false);
			setLink("");
		} else {
			let blot = Quill.find(dataValue.text);
			let index = blot.offset(quill.scroll);
			var textlength = dataValue.text.innerText;
			quill.updateContents([
				{ retain: index },
				{ delete: textlength.length },
				{
					insert: linkInput,
					attributes: { link: "https://devui.desisdsssdd/" },
				},
			]);

			// quill.deleteText(index, textlength.length);
			// quill.insertText(index, linkInput, "link", "https://replace.com");

			quill.focus();

			setOpen(false);
			setLink("");
		}
	};

	const mentionInsert = () => {
		if (dataValue.editMention) {
			let blot = Quill.find(dataValue.id);
			let index = blot.offset(quill.scroll);

			quill.deleteText(index, 1);
			quill.insertEmbed(index, "mention", {
				name: mention,
				attribute: "testing json",
			});

			quill.setSelection(index + 1);

			setOpen(false);
		} else {
			const selection = quill.getSelection(true);
			quill.insertEmbed(selection.index, "mention", {
				name: mention,
				attribute: "testing json",
			});
			quill.setSelection(selection.index + 1);

			setOpen(false);
		}
	};

	const renderLinkInput = useMemo(() => {
		return (
			<div>
				<span>Link Input:</span>
				<input
					type="text"
					value={linkInput}
					tabIndex={-1}
					onChange={(e) => setLink(e.target.value)}
				/>
				<button onClick={(e) => insertUrl()}>INSERT URL</button>
			</div>
		);
	}, [linkInput]);

	const renderMentionInput = useMemo(() => {
		return (
			<div>
				<span>Mention Input:</span>
				<input
					type="text"
					value={mention}
					onChange={(e) => {
						setMention(e.target.value);
					}}
					tabIndex={-1}
				/>
				<button onClick={(e) => mentionInsert()}>INSERT URL</button>
			</div>
		);
	}, [mention]);

	const renderKatexInput = useMemo(() => {
		return (
			<div>
				<h1 className="helloWorld">
					KATEX VAL: {dataValue.value ? dataValue.value : null}
				</h1>
				<span>Katex Input:</span>
				<input
					type="text"
					tabIndex={-1}
					value={katexValue}
					onChange={(e) => setKatex(e.target.value)}
				/>{" "}
				<button
					style={{ outline: "none" }}
					onClick={(e) => katexInsert()}>
					INSERT Katex Text
				</button>
			</div>
		);
	}, [katexValue]);

	return (
		<Transition
			appear
			show={open}
			afterLeave={() => {
				setKatex("");
				setLink("");
				quill.focus();
			}}
			as={Fragment}>
			<Dialog
				as="div"
				className="relative z-10"
				onClose={setOpen}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0">
					<div className="fixed inset-0 bg-black bg-opacity-25" />
				</Transition.Child>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95">
							<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<Dialog.Title
									as="h3"
									className="text-lg font-medium leading-6 text-gray-900"></Dialog.Title>
								<div>{renderMentionInput}</div>

								<div>{type == "link" ? renderLinkInput : renderKatexInput}</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
