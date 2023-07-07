import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { Writable } from "node:stream";

function convertToJSON(files) {
  const updatedFiles = files.map((file) => basename(file));
  return JSON.stringify(updatedFiles);
}

export default function multiplexer(files, destination, concurrency = 3) {
  let running = 0;
  let completed = 0;
  let index = 0;

  const filesStr = convertToJSON(files);
  // Send file metadata as json
  destination.write(filesStr);

  function onComplete(err) {
    if (err) {
      console.log("The error %d occurred in file %d", err.message, item);
      this.destroy();
    }

    if (++completed === files.length) {
      return destination.end();
    }
    running--;
    next();
  }

  function next() {
    // Manage concurrency for very large files
    while (running < concurrency && index < files.length) {
      const currentIndex = index++;
      const item = files[currentIndex];
      const fileStream = createReadStream(item);

      running++;
      fileStream.on("readable", () => {
        let chunk;
        while ((chunk = fileStream.read()) !== null) {
          const outBuff = Buffer.alloc(1 + 4 + chunk.length);
          outBuff.writeUInt8(currentIndex, 0);
          outBuff.writeUInt32BE(chunk.length, 1);
          chunk.copy(outBuff, 5);

          console.log(`Sending packet to channel: ${currentIndex}`);
          destination.write(outBuff);
        }
      });

      fileStream.once("end", onComplete);

      fileStream.once("error", onComplete);
    }
  }

  next();
}
