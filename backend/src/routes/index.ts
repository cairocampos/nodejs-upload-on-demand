import { IncomingMessage, ServerResponse } from "http";
import url from "url";
import { Server } from "socket.io";
import { Upload } from "../services/upload";
import { pipeline } from "stream";
import { promisify } from "util";
const pipelineAsync = promisify(pipeline);
import { logger } from "../utils";

export class Routes {
  constructor(private readonly io: Server) {}

  async options(request: IncomingMessage, response: ServerResponse) {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST",
    });

    response.end();
  }

  async post(request: IncomingMessage, response: ServerResponse) {
    const { headers } = request;
    const { query } = url.parse(request.url as string, true);
    const upload = new Upload(this.io, query?.socketId as string);

    const onFinish =
      (request: IncomingMessage, response: ServerResponse) => () => {
        response.writeHead(303, {
          Connection: "Close",
          Location: `${headers?.origin}?msg=File uploaded with success`,
        });

        response.end();
      };

    const busboyInstance = upload.registerEvents(
      headers,
      onFinish(request, response)
    );

    await pipelineAsync(request, busboyInstance);

    logger.info("Request finished with success!");
  }
}
