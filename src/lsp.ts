const net = require('net');

export default class LSP {
    connect() {
        const client = net.connect({port: 8192}, () => {
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
