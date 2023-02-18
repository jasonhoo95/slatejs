import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
	list: [],
	loading: "",
};

export const getPost = createAsyncThunk("/posts/getpost", async () => {
	const data = await fetch("https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=china");
	return data.json();
});

export const fetchSlice = createSlice({
	name: "post",
	initialState,
	reducers: {},
	extraReducers: {
		[getPost.fulfilled]: (state, { meta, payload }) => {
			console.log("finish", payload);
			state.list = payload;
			state.loading = "fin";
		},
		[getPost.pending]: (state, { meta }) => {
			console.log("pending");

			state.loading = "pending";
		},
		[getPost.rejected]: (state, { meta, payload, error }) => {
			console.log("reject", payload);

			state.loading = "fin";
		},
	},
});

// Action creators are generated for each case reducer function

export default fetchSlice.reducer;
