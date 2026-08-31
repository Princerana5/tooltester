import { io, Socket } from 'socket.io-client';
const URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
let socket: Socket | null = null;
export function getSocket(): Socket {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(URL, { auth: { token: localStorage.getItem('token')||'' }, transports:['websocket'] });
  return socket;
}
export function disconnectSocket(){ socket?.disconnect(); socket=null; }
