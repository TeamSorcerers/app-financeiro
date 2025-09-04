import { config } from "@dotenvx/dotenvx";

config();

import logger from "@/lib/server/logger";
import socket from "@/lib/server/socket";
import next from "next";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath, parse } from "node:url";
import { Server as SocketIOServer } from "socket.io";

const __workingDirName = dirname(fileURLToPath(import.meta.url));

const dev = process.env.APP_ENV === "development";
const port = Number(process.env.PORT ?? "3000");
const useSSL = process.env.USE_SSL === "true";

logger.info(`Preparando aplicação Next.js em modo de ${dev ? "desenvolvimento" : "produção"}`);
const app = next({ dev, turbopack: true });
const handle = app.getRequestHandler();

await app.prepare();

async function startServer () {
  const requestHandler = (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end("Bad Request: URL is missing");

      return;
    }
    const parsedUrl = parse(req.url, true);

    handle(req, res, parsedUrl);
  };

  if (useSSL && process.env.SSL_CERT_PATH && process.env.SSL_PRIV_KEY_PATH) {
    logger.info("Importando certificados SSL");

    const httpsOptions = {
      key: await readFile(join(__workingDirName, process.env.SSL_PRIV_KEY_PATH)),
      cert: await readFile(join(__workingDirName, process.env.SSL_CERT_PATH)),
    };

    logger.info("Iniciando servidor HTTPS");

    return createHttpsServer(httpsOptions, requestHandler);
  }

  logger.info("Iniciando servidor HTTP");

  return createHttpServer(requestHandler);
}

try {
  const server = await startServer();

  logger.info("Iniciando servidor Socket.IO");
  socket.set(new SocketIOServer(server));

  server.listen(port, "0.0.0.0", () => {
    logger.info(`Servidor rodando em http${useSSL ? "s" : ""}://localhost:${port}`);
  });
} catch (error) {
  logger.error(error, "Erro ao iniciar o servidor");
}
