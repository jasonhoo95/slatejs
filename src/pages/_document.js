import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
	return (
		<Html>
			<Head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/atom-one-dark.min.css"
				/>
				<script src="https://code.jquery.com/jquery-1.12.4.js"></script>
				<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
				<script
					defer
					src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js"></script>
				<script
					src="https://code.jquery.com/jquery-3.6.0.min.js"
					defer></script>
				<script
					src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.js"
					async></script>
				<script
					src="https://cdn.jsdelivr.net/npm/chart.js@3.6.0/dist/chart.min.js"
					async
				/>
				<script
					defer
					src="https://cdn.quilljs.com/1.3.7/quill.min.js"
				/>

				{/* <script src="https://cdn.quilljs.com/1.3.7/quill.min.js" async></script> */}
				<link
					href="https://cdn.quilljs.com/1.3.7/quill.snow.css"
					rel="stylesheet"
				/>
				<link
					href="https://cdn.quilljs.com/1.3.7/quill.bubble.css"
					rel="stylesheet"
				/>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/tw-elements/dist/css/index.min.css"
				/>
				<script
					src="https://cdn.jsdelivr.net/npm/tw-elements/dist/js/index.min.js"
					async></script>

				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/katex@0.13.3/dist/katex.min.css"
					integrity="sha384-ThssJ7YtjywV52Gj4JE/1SQEDoMEckXyhkFVwaf4nDSm5OBlXeedVYjuuUd0Yua+"
					crossOrigin="anonymous"
				/>
				<script
					defer
					src="https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.js"></script>
				<script
					defer
					src="https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/contrib/mhchem.min.js"></script>
				<script
					async
					src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
				{/* <script
					type="application/javascript"
					src="/web_support.js"></script> */}

				{/* <script
					async
					src="https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/contrib/auto-render.min.js"
					onLoad="renderMathInElement(document.body);"></script> */}
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
