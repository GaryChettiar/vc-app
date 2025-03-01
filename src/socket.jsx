import { io } from "socket.io-client";

const socket = io("https://vc-app-ytza.onrender.com"); // Your backend URL
export default socket;
