import net from "node:net";
import multiplexer from "./utils/multiplex.js";

async function main() {
  const serverIp = process.argv[2] || "127.0.0.1";
  const files = process.argv.slice(3);
  if (files.length === 0) {
    throw new Error("At least one file must be provided");
  }
  const client = new net.Socket();

  client.connect(3700, serverIp, () => {
    multiplexer(files, client);
  });

  client.on('data', (data) => {
    console.log('Server response: ' + data);
  })

  client.on('error', (err) => {
    console.log('An error occurred' + err);
  })
}

main().catch(err => console.log(err));
