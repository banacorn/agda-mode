"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/emacs/stream/rectifier");
const Err = require("./error");
const emacs_1 = require("./parser/emacs");
const Action = require("./view/actions");
class ConnectionManager {
    constructor(core) {
        this.core = core;
        this.wire = (connection) => {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.connectAgda(connection));
            // the properties
            this.connection = connection;
            if (exports.useJSON(connection)) {
                console.log('JSON!');
                connection.stream
                    .pipe(new rectifier_1.default)
                    .on('data', (data) => {
                    const lines = data.toString().split('\n');
                    // console.log(data.toString());
                    lines.forEach(line => {
                        console.log(line);
                        console.log(JSON.parse(line));
                    });
                    // console.log(JSON.parse(data.toString()))
                });
            }
            else {
                // the streams
                connection.stream
                    .pipe(new rectifier_1.default)
                    .on('data', (data) => {
                    const promise = this.connection && this.connection.queue.pop();
                    if (promise) {
                        const lines = data.toString().trim().split('\n');
                        emacs_1.parseResponses(data.toString(), emacs_1.parseFileType(connection.filepath))
                            .then(responses => {
                            const resps = responses
                                .map((response, i) => ({
                                raw: lines[i],
                                parsed: response
                            }))
                                .filter(({ parsed }) => parsed.kind !== "RunningInfo"); // don't log RunningInfo because there's too many of them
                            this.core.view.store.dispatch(Action.PROTOCOL.logResponses(resps));
                            this.core.view.store.dispatch(Action.PROTOCOL.pending(false));
                            promise.resolve(responses);
                        })
                            .catch(Err.ParseError, error => {
                            this.core.view.set('Parse Error', [error.message, error.raw], 3 /* Error */);
                            promise.resolve([]);
                        })
                            .catch(error => {
                            this.handleAgdaError(error);
                            promise.resolve([]);
                        });
                    }
                });
            }
            return Promise.resolve(connection);
        };
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.getConnection = this.getConnection.bind(this);
        this.wire = this.wire.bind(this);
        this.queryPath = this.queryPath.bind(this);
        this.handleAgdaError = this.handleAgdaError.bind(this);
        this.updateStore = this.updateStore.bind(this);
    }
    connect() {
        return getAgdaPath()
            .catch(Err.Conn.NoPathGiven, () => {
            return autoSearch('agda');
        })
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.queryPath)
            .then(setAgdaPath)
            .then(this.updateStore)
            .then(exports.establishConnection(this.core.editor.getPath()))
            .then(this.wire);
    }
    disconnect() {
        if (this.connection) {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.disconnectAgda());
            // the streams
            this.connection.stream.end();
            // the property
            this.connection = undefined;
        }
    }
    getConnection() {
        if (this.connection)
            return Promise.resolve(this.connection);
        else
            return Promise.reject(new Err.Conn.NotEstablished);
    }
    queryPath(error) {
        this.core.view.store.dispatch(Action.CONNECTION.startQuerying());
        this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
        this.core.view.set('Connection Error', [], 3 /* Error */);
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(result => {
            this.core.view.store.dispatch(Action.CONNECTION.stopQuerying());
            return result;
        })
            .catch(Err.Conn.Invalid, this.queryPath);
    }
    handleAgdaError(error) {
        this.core.view.set(error.name, [], 3 /* Error */);
        switch (error.name) {
            case 'QueryCancelled': return Promise.resolve();
            default:
                this.disconnect();
                console.log(error);
                return this.core.view.tabs.open('settings').then(() => {
                    this.core.view.store.dispatch(Action.VIEW.navigate({ path: '/Connection' }));
                    this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
                });
        }
    }
    updateStore(validated) {
        this.core.view.store.dispatch(Action.CONNECTION.connectAgda(validated));
        return Promise.resolve(validated);
    }
}
exports.default = ConnectionManager;
function getAgdaPath() {
    const path = atom.config.get('agda-mode.agdaPath');
    if (path.trim() === '') {
        return Promise.reject(new Err.Conn.NoPathGiven);
    }
    else {
        return Promise.resolve(path);
    }
}
exports.getAgdaPath = getAgdaPath;
function setAgdaPath(validated) {
    atom.config.set('agda-mode.agdaPath', validated.path);
    return Promise.resolve(validated);
}
exports.setAgdaPath = setAgdaPath;
function autoSearch(path) {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', path));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${path}`, (error, stdout) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`Cannot find "${path}".\nLocating "${path}" in the user's path with 'which' but failed with the following error message: ${error.toString()}`, path));
            }
            else {
                resolve(emacs_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
// to make sure that we are connecting with the right thing
function validateProcess(path, validator) {
    path = emacs_1.parseFilepath(path);
    return new Promise((resolve, reject) => {
        var stillHanging = true;
        if (path === '') {
            reject(new Err.Conn.Invalid(`The path must not be empty`, path));
        }
        child_process_1.exec(`${path}`, (error, stdout, stderr) => {
            stillHanging = false;
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`"${path}" was not found`, path));
                    // command found however the arguments are invalid
                }
                else {
                    reject(new Err.Conn.Invalid(`Found something at "${path}" but it doesn't seem quite right:\n\n${error.message}`, path));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\n\"${stdout.toString()}\"`;
                reject(new Err.Conn.Invalid(message, path));
            }
            validator(stdout.toString(), resolve, reject);
        });
        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                return Promise.reject(new Err.Conn.Invalid(message, path));
            }
        }, 1000);
    });
}
exports.validateProcess = validateProcess;
function validateAgda(path) {
    return validateProcess(path, (message, resolve, reject) => {
        const result = message.match(/Agda version (.*)/);
        if (result) {
            // normalize version number to valid semver
            const raw = result[1];
            const tokens = result[1].replace('-', '.').split('.');
            const sem = tokens.length > 3
                ? _.take(tokens, 3).join('.')
                : tokens.join('.');
            const version = { raw, sem };
            resolve({
                path,
                version,
                supportedProtocol: message.match(/--interaction-json/) ? ['JSON', 'Emacs'] : ['Emacs']
            });
        }
        else {
            reject(new Err.Conn.Invalid(`Found a program named "agda" but it doesn't seem like Agda to me`, path));
        }
    });
}
exports.validateAgda = validateAgda;
exports.establishConnection = (filepath) => ({ path, version, supportedProtocol }) => {
    return new Promise((resolve, reject) => {
        const option = exports.useJSON({ path, version, supportedProtocol }) ? ['--interaction-json'] : ['--interaction'];
        const agdaProcess = child_process_1.spawn(path, option, { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new Err.Conn.ConnectionError(error.message, path));
        });
        agdaProcess.on('close', (signal) => {
            const message = signal === 127 ?
                `exit with signal ${signal}, Agda is not found` :
                `exit with signal ${signal}`;
            reject(new Err.Conn.ConnectionError(message, path));
        });
        // stream the incoming data to the parser
        agdaProcess.stdout.once('data', () => {
            resolve({
                path,
                version,
                supportedProtocol,
                stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                queue: [],
                filepath
            });
        });
    });
};
exports.useJSON = ({ supportedProtocol }) => {
    return (atom.config.get('agda-mode.enableJSONProtocol') && _.includes(supportedProtocol, 'JSON')) || false;
};
//# sourceMappingURL=connection.js.map