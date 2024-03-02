import "../styles/globals.css";
import "../styles/quill.css";
// import "../styles/prosemirror.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/globals/store";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<Provider store={store}>
			<Component  {...pageProps} />
		</Provider>
	);
}
