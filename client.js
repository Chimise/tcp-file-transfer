import net from "node:net";
import multiplexer from "./utils/multiplex.js";
import {hideBin} from 'yargs/helpers'
import yargs from "yargs";

const argv = yargs(hideBin(process.argv)).option('ipadrr', {
  alias: 'ip',
  description: 'IP address of the recipient server',
  type: 'string',
  default: '127.0.0.1'
}).option('file', {
  alias: 'f',
  description: 'Path to the file to be sent',
  type: 'string',
  demandOption: true
}).parse();

async function main() {
  const serverIp = argv.host;
  const files = [].concat(argv.file);
  

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
