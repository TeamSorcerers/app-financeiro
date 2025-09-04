"use client";

import useInternalServerEvents from "@/lib/client/events";
import { createContext, useContext } from "react";

const serverEventsContext = createContext<ReturnType<typeof useInternalServerEvents>>({
  off: () => {
    throw new Error("off method not implemented.");
  },
  on: () => {
    throw new Error("on method not implemented.");
  },
});

export function ServerEventsProvider ({ children }: { children: React.ReactNode }) {
  const serverEvents = useInternalServerEvents();

  return (
    <serverEventsContext.Provider value={serverEvents}>
      {children}
    </serverEventsContext.Provider>
  );
}

export default function useServerEvents () {
  return useContext(serverEventsContext);
}
