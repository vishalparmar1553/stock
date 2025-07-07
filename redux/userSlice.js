// redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null, // Stores user object (name, email, etc.)
  isDark: false, // Stores theme mode
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    toggleTheme(state) {
      state.isDark = !state.isDark;
    },
    setTheme(state, action) {
      state.isDark = action.payload;
    },
  },
});

export const { setUser, clearUser, toggleTheme, setTheme } = userSlice.actions;
export default userSlice.reducer;
