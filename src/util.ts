import { EventEmitter } from 'events';
import * as Promise from 'bluebird';

// http://stackoverflow.com/a/2117523
export function guid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export function hash(o: any): string {
    const s = JSON.stringify(o);
    var hash = 0;
    if (s.length == 0) return hash.toString();
    for (var i = 0; i < s.length; i++) {
        hash = ((hash << 5) - hash) + s.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}
export class Resource<T> {
    private handle?: T;
    private emitter: EventEmitter;

    constructor() {
        this.handle = null;
        this.emitter = new EventEmitter;
    }

    isAvailable(): boolean {
        return (this.handle !== null);
    }

    resolve(resource: T) {
        this.emitter.emit('available', resource);
    }

    reject(message) {
        this.emitter.emit('error', message);
    }

    access(): Promise<T> {
        if (this.isAvailable()) {
            return Promise.resolve(this.handle);
        } else {
            return new Promise<T>((resolve, reject) => {
                this.emitter.once('available', (resource) => {
                    resolve(resource);
                });
                this.emitter.once('error', (message) => {
                    reject(message);
                });
            });
        }
    }
}

export class TelePromise<T> {
    private resolver: (result?: T) => void;
    private rejecter: (error: any) => void;

    // extracts resolve/reject from a new Promise,
    //  usage:
    //      new Promise(someTelePromise.wire());
    wire(): (resolve: (result?: T) => void, reject: (error: any) => void) => void {
        return (resolve, reject) => {
            this.resolver = resolve;
            this.rejecter = reject;
        }
    }

    resolve(result?: T): void {
        if (this.resolver) {
            this.resolver(result);
            this.cleanup();
        }
    }

    reject(error: any): void {
        if (this.rejecter) {
            this.rejecter(error);
            this.cleanup();
        }
    }

    cleanup(): void {
        this.resolver = undefined;
        this.rejecter = undefined;
    }
}
