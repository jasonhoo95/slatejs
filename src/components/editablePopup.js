import React, { useEffect, useState } from "react";
import { Fragment } from "react";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import { useModalStore } from "@/globals/zustandGlobal";

import { Editor, Transforms, createEditor, Path, Descendant, Element as SlateElement, Range, Node } from "slate";
export default function EditablePopup({ open, editor, setModal }) {
	const [openNow, setOpen] = useState(open);
	let updateAmount = useModalStore((state) => state.updateModal);
	useEffect(() => {
		console.log(open, openNow, "open now");
		setOpen(open)
	}, [open])
	return (
		<Transition.Root
			appear
			show={openNow}
			as={Fragment}>
			<Dialog
				onClose={(e) => {
					updateAmount(false)
					setOpen(false)
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
								<div className="mt-2">
									<p className="text-sm text-gray-500">Your payment has been successfully submitted. We’ve sent you an email with all of the details of your order.</p>
								</div>

								<div>
									<h1>Edit npw</h1>
								</div>
								<div

									className="mt-4">
									Insert katex
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
