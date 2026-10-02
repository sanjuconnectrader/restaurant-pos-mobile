import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { API_URL, getAccessToken } from '../api/client';

const events = ['table:updated','order:created','order:updated','order:item-added','order:item-voided','order:bill-requested','order:paid','order:closed','reservation:updated'];
const listeners = new Set<() => void>();
let socket: Socket | null = null;
let appSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
const refreshAll = () => listeners.forEach((listener) => listener());

export function subscribeLive(listener: () => void) {
  listeners.add(listener);
  if (!socket) {
    socket = io(API_URL.replace(/\/api$/, ''), { auth: { token: getAccessToken() }, transports: ['websocket'] });
    events.forEach((event) => socket?.on(event, refreshAll));
    socket.on('connect_error', () => { if (socket) socket.auth = { token: getAccessToken() }; });
    appSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') { if (socket) socket.auth = { token: getAccessToken() }; refreshAll(); } });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { socket?.disconnect(); socket = null; appSubscription?.remove(); appSubscription = null; }
  };
}
