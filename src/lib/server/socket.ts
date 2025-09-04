import type { ServerEvents } from "@/lib/shared/events";
import { Server } from "socket.io";

// eslint-disable-next-line no-shadow
declare const global: typeof globalThis & { __io_server__ : Server;};

export default Object.freeze({
  get () {
    if (!global.__io_server__) {
      throw new Error("Socket.IO not initialized");
    }

    return global.__io_server__;
  },

  emit<EventName extends keyof ServerEvents, Args extends Parameters<ServerEvents[EventName]>> (eventName: EventName, ...args: Args) {
    this.get().emit(eventName, ...args);
  },

  set (io: Server) {
    global.__io_server__ = io;
  },
});
