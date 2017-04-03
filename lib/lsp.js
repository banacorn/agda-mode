"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require('net');
class LSP {
    connect() {
        const client = net.connect({ port: 8192 }, () => {
            //'connect' listener
            console.log('connected to server!');
            client.write('world!\r\n');
        });
        client.on('data', (data) => {
            console.log(data.toString());
            client.end();
        });
        client.on('error', (error) => {
            console.log(`something wrong happened`);
            console.log(error);
        });
        client.on('end', () => {
            console.log('disconnected from server');
        });
    }
}
exports.default = LSP;
//# sourceMappingURL=lsp.js.map