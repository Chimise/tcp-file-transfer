import { WriteStream, createWriteStream } from "node:fs";
import { IncomingMessage } from "node:http";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cache = new Map();
const files = new Set();

/**
 *
 * @param {string} file
 * @param {number} index
 * @returns {string}
 */
function generateAnotherName(file, index) {
  const ext = extname(file);
  const base = basename(file, ext);
  return `${base}-${index}${ext}`;
}

/**
 *
 * @param {IncomingMessage} source
 */
export default function demultiplex(source) {
  let currentIndex = null;
  let currentLength = null;
  let fileMetadata = null;
  let parsedFileData = null;

  source
    .on("readable", () => {
      let chunk;
      let fileStream;

      if (!fileMetadata) {
        fileMetadata = source.read();
        try {
          parsedFileData = JSON.parse(fileMetadata.toString());
          parsedFileData.forEach((name, index) => {
            if (files.has(name)) {
              name = generateAnotherName(name, index);
            }

            files.add(name);
            cache.set(index, {
              name,
            });
          });
        } catch (error) {
          console.log(err);
          process.exit(1);
        }
      }

      if (currentIndex === null) {
        // Read the filename and store it
        chunk = source.read(1);
        currentIndex = chunk && chunk.readUInt8();

        if (currentIndex === null) {
          return null;
        }

        // Create a file stream with the filename and cache it for reuse
        fileStream = createFileStream(currentIndex);
      }

      if (currentLength === null) {
        // Read the length of the chunk
        chunk = source.read(4);
        currentLength = chunk && chunk.readUInt32BE(0);
        if (currentLength === null) {
          return null;
        }
      }

      // Read the chunk
      chunk = source.read(currentLength);
      if (chunk === null) {
        return null;
      }

      console.log(`Received packet from: ${currentIndex}`);
      if (fileStream) {
        fileStream.write(chunk);
      }

      currentIndex = null;
      currentLength = null;
    })
    .on("end", () => {
      cache.forEach((value) => {
        value.stream && value.stream.end();
      });
      cache.clear();
      files.clear();
    })
    .on("error", (err) => {
      console.log(err);
      process.exit(1);
    });
}

/**
 *
 * @param {number} index
 * @returns {WriteStream}
 */

function createFileStream(index) {
  if (!cache.has(index)) {
    return null;
  }

  const file = cache.get(index);

  let stream = file.stream;

  if (!stream) {
    stream = createWriteStream(join(__dirname, "../files", file.name));
    file.stream = stream;
  }

  return stream;
}
