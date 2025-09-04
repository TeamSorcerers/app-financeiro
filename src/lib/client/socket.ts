import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useIo () {
  const [ client, setClient ] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = io(String(window.location.origin), {
      rejectUnauthorized: false,
      reconnectionAttempts: 5,
    });

    setClient(socket);
  }, []);

  return client;
}
