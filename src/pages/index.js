import Head from "next/head";
import Image from "next/image";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SlateMobile from "@/components/slateMobile";
import SlateReact from "@/components/slateReact";
import SlateAndroid from "@/components/slateAndroid";
import PlainTextExample from "@/components/plainText";
import { useBearStore, useAuthStore } from "@/globals/authStorage";
import { Slate, useSelected } from "slate-react";
import CheckListsExample from "@/components/checkListExample";
import { useModalStore } from "@/globals/zustandGlobal";
import { ReactEditor } from "slate-react";
import TablesExample from "@/components/TablesExample";
import { Tab } from "@headlessui/react";
import MultiSelect from "@/components/multiSelectComponent";
export default function Home() {
	let ModalProps = useModalStore((state) => state.display);
	const [display, setDisplay] = useState(false);
	const [valuenow, setValue] = useState({ select: [{ label: "Grapes 🍇", value: "grapes" }], id: 1 })
	useEffect(() => {
		console.log(valuenow, "value return");

	}, [valuenow])
	return (
		<div className="m-8">
			<Head>
				<title>Create Next App</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link
					rel="icon"
					href="/favicon.ico"
				/>
			</Head>

			{/* <SlateMobile /> */}
			{/* <SlateReact /> */}
			<SlateAndroid />
			{/* <TablesExample /> */}

			{/* {value['inputTxt']} */}

			{/* <MultiSelect value={valuenow['select']} /> */}
			<div className="relative">
				<div contentEditable="true">
					asd asda

				</div>
				<div style={{ border: '1px solid grey' }} className="absolute left-0 top-0 w-full h-full">

				</div>

			</div>


			<footer id="footer">
				<div id="divedit" style={{ height: '40px', padding: '10px', background: 'grey' }} contentEditable="true">

					asd asdas

				</div>
				<button style={{ background: 'red' }} onClick={e => {
					ReactEditor.focus(ModalProps)

					document.body.classList.remove('keyboard');
					document.body.style.overflow = "auto";

					var inputbox = document.querySelector('#footer')
					inputbox.style.display = "none"

				}}>
					click me
				</button>
			</footer>




		</div>
	);
}
