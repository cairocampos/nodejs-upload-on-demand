import { Server } from "socket.io";
import Busboy, { FileInfo } from "busboy";
import { join } from "path";
import { logger } from "../utils";
import { pipeline, Readable } from "stream";
import { promisify } from "util";
import { createWriteStream } from "fs";
const pipelineAsync = promisify(pipeline);

export class Upload {
  constructor(private readonly io: Server, private readonly socketId: string) {}

  registerEvents(headers: any, onFinish: () => void): Busboy.Busboy {
    const busboy = Busboy({
      headers,
    });

    busboy.on("file", this.onFile.bind(this));
    busboy.on("finish", onFinish);

    return busboy;
  }

  handleFileBytes(filename: string) {
    async function* handleData(data) {
      for await (const item of data) {
        const size = item.length;
        logger.info(`File ${filename}] got ${size} bytes to ${this.socketId}`);
        this.io.to(this.socketId).emit("file-uploaded", size);
        yield item;
      }
    }

    return handleData.bind(this);
  }

  async onFile(fieldName: string, file: Readable, { filename }: FileInfo) {
    const saveFileTo = join(__dirname, "../../uploads", filename);
    logger.info("Uploading " + saveFileTo);

    await pipelineAsync(
      file,
      this.handleFileBytes.apply(this, [filename]),
      createWriteStream(saveFileTo)
    );

    logger.info(`File [${filename}] finished`);
  }
}
