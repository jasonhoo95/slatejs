import React, { useEffect, useState } from "react";

export default function QuillForm() {
	const [quill, setQuill] = useState();
	useEffect(() => {
		var Font = Quill.import("formats/font");
		// We do not add Aref Ruqaa since it is the default
		Font.whitelist = ["mirza", "roboto"];
		Quill.register(Font, true);

		var quilljs = new Quill("#editor-container", {
			modules: {
				toolbar: "#toolbar-container",
			},
			theme: "snow",
		});
		setQuill(quilljs);
	}, []);
	return (
		<div style={{ display: quill ? "block" : "none" }}>
			<div id="toolbar-container">
				<select className="ql-font">
					<option selected>Aref Ruqaa</option>
					<option value="mirza">Mirza</option>
					<option value="roboto">Roboto</option>
				</select>
				<div>asd asdas</div>
			</div>
			<div id="editor-container">
				<p>
					When Mr. Bilbo Baggins of Bag End announced that he would shortly be
					celebrating his eleventy-first birthday with a party of special
					magnificence, there was much talk and excitement in Hobbiton.
				</p>
				<p>
					<br />
				</p>
				<p>
					Bilbo was very rich and very peculiar, and had been the wonder of the
					Shire for sixty years, ever since his remarkable disappearance and
					unexpected return. The riches he had brought back from his travels had
					now become a local legend, and it was popularly believed, whatever the
					old folk might say, that the Hill at Bag End was full of tunnels
					stuffed with treasure. And if that was not enough for fame, there was
					also his prolonged vigour to marvel at. Time wore on, but it seemed to
					have little effect on Mr. Baggins. At ninety he was much the same as
					at fifty. At ninety-nine they began to call him well-preserved, but
					unchanged would have been nearer the mark. There were some that shook
					their heads and thought this was too much of a good thing; it seemed
					unfair that anyone should possess (apparently) perpetual youth as well
					as (reputedly) inexhaustible wealth.
				</p>
				<p>ASD ASDA DA DASD</p>
				<p>
					<br />
				</p>
				<p>
					The eldest of these, and Bilbo"s favourite, was young Frodo Baggins.
					When Bilbo was ninety-nine, he adopted Frodo as his heir, and brought
					him to live at Bag End; and the hopes of the Sackville-Bagginses were
					finally dashed. Bilbo and Frodo happened to have the same birthday,
					September 22nd. "You had better come and live here, Frodo my lad,"
					said Bilbo one day; "and then we can celebrate our birthday-parties
					comfortably together." At that time Frodo was still in his tweens, as
					the hobbits called the irresponsible twenties between childhood and
					coming of age at thirty-three.
				</p>
				<p>
					<br />
				</p>
				<p>
					Twelve more years passed. Each year the Bagginses had given very
					lively combined birthday-parties at Bag End; but now it was understood
					that something quite exceptional was being planned for that autumn.
					Bilbo was going to be eleventy-one, 111, a rather curious number and a
					very respectable age for a hobbit (the Old Took himself had only
					reached 130); and Frodo was going to be thirty-three, 33) an important
					number: the date of his "coming of age".
				</p>
			</div>
			<div>
				<h1>asdas dadas</h1>
			</div>
		</div>
	);
}
