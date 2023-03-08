import Head from "next/head";
import Image from "next/image";
import Quilljs from "@/components/quillProduct/quillComponent";
import dynamic from "next/dynamic";
import ProseMirrorEditor from "@/components/prosemirrorEditor";
// import SlateReact from "@/components/slateReact";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useSelected } from "slate-react";
import FixKeyboardMain from "@/components/fixKeyboardMain";
const SlateReact = dynamic(() => import("@/components/slateReact"), {
	ssr: false,
});

// import Editor from "@/components/quillProduct/reactQuill";
export default function Home() {
	// var string = "helloworld \n yoyoahtsap";
	// const RenderContent = () => {
	// 	const ref = useRef();
	// 	useLayoutEffect(() => {
	// 		console.log("layoutEffect", ref.current);
	// 	}, []);

	// 	return <div ref={ref}>HELLO WORLD!!!</div>;
	// };
	return (
		<div className="m-8 main-wrapper">
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
				className="main"
				id="section1"
				style={{ height: "600px" }}
			>
				<h2>Section 1</h2>
				<p>Click on the link to see the "smooth" scrolling effect.</p>
				<a href="#section2">Click Me to Smooth Scroll to Section 2 Below</a>
				<p>Note: Remove the scroll-behavior property to remove smooth scrolling.</p>
			</div>

			<div
				className="main"
				id="section2"
				style={{ height: "600px" }}
			>
				<h2>Section 2</h2>
				<a href="#section1">Click Me to Smooth Scroll to Section 1 Above</a>
			</div> */}
			<SlateReact />
			{/* <div contentEditable="true">
				金高银将主演韩国首部音乐片[英雄]，饰演目睹明成皇后之死的朝鲜最后一个宫女雪姬。本片由尹济均执导，根据同名音乐剧改编，讲述朝鲜近代史上著名的运动家安重根生命中最后一年的故事。雪姬将收集日本的主要情报，是个积极支持社会事件的坚强角色。本片计划于今年下半年开拍，将在中国、日本、俄罗斯等国家取景。金高银将主演韩国首部音乐片[英雄]，饰演目睹明成皇后之死的朝鲜最后一个宫女雪姬。本片由尹济均执导，根据同名音乐剧改编，讲述朝鲜近代史上著名的运动家安重根生命中最后一年的故事。雪姬将收集日本的主要情报，是个积极支持社会事件的坚强角色。本片计划于今年下半年开拍，将在中国、日本、俄罗斯等国家取景。金高银将主演韩国首部音乐片[英雄]，饰演目睹明成皇后之死的朝鲜最后一个宫女雪姬。本片由尹济均执导，根据同名音乐剧改编，讲述朝鲜近代史上著名的运动家安重根生命中最后一年的故事。雪姬将收集日本的主要情报，是个积极支持社会事件的坚强角色。本片计划于今年下半年开拍，将在中国、日本、俄罗斯等国家取景。
			</div> */}
		</div>
	);
}
