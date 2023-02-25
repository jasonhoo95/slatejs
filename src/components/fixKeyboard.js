let fixPosition = 0; // the fix
let lastScrollY = window.pageYOffset; // the last scroll position
let toolbarWrap = document.getElementById("toolbar-wrap"); // the toolbar wrap
let toolbar = document.getElementById("toolbar"); // the toolbar
let editor = document.getElementById("editor"); // the editor

// function to set the margin to show the toolbar if hidden
const setMargin = function () {
	// if toolbar wrap is hidden
	const newPosition = toolbarWrap.getBoundingClientRect().top;
	if (newPosition < -1) {
		// add a margin to show the toolbar
		toolbar.classList.add("down"); // add class so toolbar can be animated
		fixPosition = Math.abs(newPosition); // this is new position we need to fix the toolbar in the display
		// if at the bottom of the page take a couple of pixels off due to gap
		if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
			fixPosition -= 2;
		}
		// set the margin to the new fixed position
		toolbar.style["margin-top"] = fixPosition + "px";
	}
};

// use lodash debounce to stop flicker
const debounceMargin = _.debounce(setMargin, 150);

// function to run on scroll and blur
const showToolbar = function () {
	// remove animation and put toolbar back in default position
	if (fixPosition > 0) {
		toolbar.classList.remove("down");
		fixPosition = 0;
		toolbar.style["margin-top"] = 0 + "px";
	}
	// will check if toolbar needs to be fixed
	debounceMargin();
};

// add an event listener to scroll to check if
// toolbar position has moved off the page
window.addEventListener("scroll", showToolbar);
// add an event listener to blur as iOS keyboard may have closed
// and toolbar postition needs to be checked again
editor.addEventListener("blur", showToolbar);
