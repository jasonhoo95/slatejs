import Head from "next/head";
import Image from "next/image";
import dynamic from "next/dynamic";
import SlateMobile from "@/components/slateMobile";
import SlateReact from "@/components/slateReact";
import PlainTextExample from "@/components/plainText";
import { useBearStore, useAuthStore } from "@/globals/authStorage";
import { Slate } from "slate-react";
import CheckListsExample from "@/components/checkListExample";
import { useEffect } from "react";
import { useModalStore } from "@/globals/zustandGlobal";
import { ReactEditor } from "slate-react";

export default function Home() {
	let ModalProps = useModalStore((state) => state.display);

	useEffect(() => {


	}, [])
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
			<SlateReact />


			{/* <footer id="footer">
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
			</footer> */}


			{/* <PlainTextExample /> */}


		</div>
	);
}
