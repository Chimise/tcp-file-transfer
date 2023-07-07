import net from "node:net";
import demultiplex from "./utils/demultiplex.js";
import yargs from "yargs/yargs";

const port = process.env.PORT || 3700;

async function main() {
  const server = net.createServer((socket) => {
    demultiplex(socket);
    socket.on("end", () => {
      socket.write("Files stored");
      socket.end();
    });
  });

  server.listen(port, () => {
    console.log("Tcp connection listening on port %d", port);
  });
}

main().catch(err => console.log(err));
