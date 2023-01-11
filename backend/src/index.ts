import dotenv from "dotenv";
import http, { IncomingMessage, ServerResponse } from "http";
import { Routes } from "./routes";
import socketIo, { Server } from "socket.io";
import { logger } from "./utils";
import { AddressInfo } from "net";
dotenv.config();

const handler = (request: IncomingMessage, response: ServerResponse) => {
  const defaultRoute = async (
    request: IncomingMessage,
    response: ServerResponse
  ) => response.end("hello!");
  const routes = new Routes(io);
  // if (!Object.keys(routes).includes(request.method?.toLowerCase() as string)) {
  //   return response.end("Hello!");
  // }

  const route = routes[request.method?.toLowerCase() as string] || defaultRoute;
  return route.apply(routes, [request, response]);
};

const server = http.createServer(handler);
const io: Server = new socketIo.Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => logger.info("socket connected " + socket.id));

server.listen(process.env.PORT, () => {
  const { address, port } = server.address() as AddressInfo;
  logger.info(`App running at http://${address}:${port}`);
});
