import { useEffect, useState } from "react";
export default function Discussion() {
	let yo: any;
	const [stringData, setString] = useState<string>();
	const alertBox = (e) => {
		if (e.target.closest(".quill-mention")) {
			alert("yoyo");
		}
	};

	useEffect(() => {
		const data = document.querySelector(".helloworld");
		console.log(data, "load classAD");
	}, []);

	const renderSummary = () => {
		return <div ref={yo}>hello whats up world</div>;
	};
	const html = `<p>asdas das dasdas das daasd asdas <span class="quill-mention" data-name="jason123" id="a0a4df25-06e2-4c35-a5a5-ca9c0bf3bfa7" data-attribute="testing json" data-mainid="undefined">﻿<span contenteditable="false"><span style="background-color:red;">jason123</span></span>﻿</span> asdasas das</p><p class="paragraph1" id="2dafe00a-ebc7-4245-814b-f744a35056bc">asdas da <span class="quill-mention" data-name="zxcasd" id="d8d4e1eb-247e-4719-9fda-12c958a1a113" data-attribute="testing json" data-mainid="undefined">﻿<span contenteditable="false"><span style="background-color:red;">zxcasd</span></span>﻿</span></p>`;
	return (
		<div>
			<div
				ref={yo}
				className="helloworld">
				{renderSummary()}

				<div className="heightBottom">
					<div className="inner-container">
						<div>asd ad asd ad d asd</div>
						<div>asd ad asd ad d asd</div>
						<div>asd ad asd ad d asd</div>
					</div>
				</div>
			</div>
		</div>
	);
}
