import { useIo } from "@/lib/client/socket";
import { ServerEvents } from "@/lib/shared/events";

export default function useInternalServerEvents () {
  const io = useIo();

  const on = <EventName extends keyof ServerEvents, Callback extends ServerEvents[EventName]>(eventName: EventName, callback: Callback) => {
    io?.on(eventName, callback as never);
  };

  const off = <EventName extends keyof ServerEvents, Callback extends ServerEvents[EventName]>(eventName: EventName, callback: Callback) => {
    io?.off(eventName, callback as never);
  };

  return { on, off };
}
