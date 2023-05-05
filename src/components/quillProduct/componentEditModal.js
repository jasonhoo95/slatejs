import React, { useEffect, useState } from "react";
import { Fragment } from "react";
import { v4 } from "uuid";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import Quilljs from "./quillComponent";

import { ReactEditor } from "slate-react";
import { useModalStore } from "@/globals/zustandGlobal";
import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Range, Node } from "slate";
export default function ComponentEditModal({ open, setOpen, path, editor, element }) {
	// const dispatch = useDispatch();
	let updateClick = useModalStore((state) => state.updateClick);
	const ModalProps = useModalStore((state) => state.amount);
	let updateModal = useModalStore((state) => state.updateModal);
	const [check, setCheck] = useState(false);
	const wrapKatex = (editor) => {
		let id = v4();
		console.log(ModalProps, "data return");

		const url = ModalProps.url;
		const katex = {
			type: "katex",
			url,
			id,
			children: [{ text: "", type: "katex" }],
		};
		Transforms.insertNodes(ModalProps.editor, katex);
		const nextNode = Editor.next(ModalProps.editor, {
			at: ModalProps.path.path,
		});
		Transforms.select(ModalProps.editor, nextNode[1]);

		Transforms.move(ModalProps.editor);

		Transforms.insertText(ModalProps.editor, "\u00a0".toString(), {
			at: ModalProps.editor.selection.anchor,
		});
		ReactEditor.focus(ModalProps.editor);

		// setOpen(false);
		setCheck(true);
		let data = {
			...ModalProps,
			edit: true,
			open: false,
		};
		updateModal(data);
	};

	return (
		<Transition.Root
			appear
			show={open}
			// afterLeave={(e) => {
			// 	const text = Node.leaf(ModalProps.editor, ModalProps.editor.selection.anchor.path);

			// 	if (!ModalProps.edit && text.text.length == 0) {
			// 		Transforms.delete(ModalProps.editor, { at: ModalProps.editor.selection.anchor, unit: "offset", distance: 1 });
			// 	}
			// 	updateModal(null);
			// 	updateClick(null);
			// }}
			as={Fragment}>
			<Dialog
				onClose={(e) => {
					// setOpen(e);
					const text = Node.leaf(ModalProps.editor, ModalProps.editor.selection.anchor.path);

					if (!ModalProps.edit && text.text.length == 0) {
						Transforms.insertText(ModalProps.editor, "\u00a0".toString(), {
							at: ModalProps.editor.selection.anchor,
						});
						// Transforms.delete(ModalProps.editor, { at: ModalProps.editor.selection.anchor, reverse: true, unit: "offset", distance: 1 });

						Transforms.move(ModalProps.editor, { reverse: true, unit: "offset", distance: 1 });
						setTimeout(() => {
							Transforms.delete(ModalProps.editor, { at: ModalProps.editor.selection.anchor, unit: "offset", distance: 1 });
						}, 10);
					}
					let data = {
						...ModalProps,
						open: false,
					};
					updateModal(data);
					console.log(ModalProps.editor.selection.anchor, "modal anchir");
					console.log(editor.selection.anchor, "modal editor");

					ReactEditor.focus(editor);
				}}>
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

				<div className="fixed inset-0 z-[100] overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 translate-y-[-100%]"
							enterTo="opacity-100 translate-y-[0]"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95">
							<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<Dialog.Title
									as="h3"
									className="text-lg font-medium leading-6 text-gray-900">
									{ModalProps ? ModalProps.type : null}
								</Dialog.Title>
								<div className="mt-2">
									<p className="text-sm text-gray-500">Your payment has been successfully submitted. We’ve sent you an email with all of the details of your order.</p>
								</div>

								<div
									onClick={(e) => {
										wrapKatex();
									}}
									className="mt-4">
									Insert katex
								</div>

								<div className="mt-4">
									<button
										onClick={(e) => {
											Transforms.removeNodes(ModalProps.editor, {
												at: ModalProps.path,
											});

											const url = "123";
											let id = v4();

											const katex = {
												type: "katex",
												url,
												id,
												children: [{ text: "", type: "katex" }],
											};

											Transforms.insertNodes(ModalProps.editor, katex);

											const nextNode = Editor.next(ModalProps.editor, {
												at: ModalProps.path,
											});
											Transforms.select(ModalProps.editor, {
												path: nextNode[1],
												offset: 0,
											});
											ReactEditor.focus(ModalProps.editor);

											// setOpen(false);

											// dispatch(increment());
										}}
										type="button"
										className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
										Got it, thanks!
									</button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
