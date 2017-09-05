import io from 'socket.io-client';
import prompt from 'prompt';


const socket = io.connect("http://localhost:3000");

socket.on('connect', () => console.log("connected"));
socket.on('message', msg => console.log("message: ", msg));
socket.on('disconnect', () => console.log("disconnect"));


prompt.message = "# ";
prompt.delimiter = "";
prompt.start();
prompt.get("Any key to exit?", () => ({}));
