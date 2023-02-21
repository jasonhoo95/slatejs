import Head from "next/head";
import Image from "next/image";
// import Quilljs from "@/components/quillProduct/quillComponent";
import dynamic from "next/dynamic";
import ProseMirrorEditor from "@/components/prosemirrorEditor";
import SlateReact from "@/components/slateReact";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useSelected } from "slate-react";
// const SlateReact = dynamic(() => import("@/components/slateReact"), {
// 	ssr: false,
// });

// import Editor from "@/components/quillProduct/reactQuill";
export default function Home() {
	// useEffect(() => {
	// 	document.body.style.overflow = "hidden";
	// }, []);
	// var string = "helloworld \n yoyoahtsap";
	// const RenderContent = () => {
	// 	const ref = useRef();
	// 	useLayoutEffect(() => {
	// 		console.log("layoutEffect", ref.current);
	// 	}, []);

	// 	return <div ref={ref}>HELLO WORLD!!!</div>;
	// };
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

			{/* <div
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
				asd asd a da da
			</div>
			<div>
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
				sample text
				<br />
			</div> */}

			<SlateReact />
		</div>
	);
}
