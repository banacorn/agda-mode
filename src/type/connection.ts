import { Duplex } from 'stream';
import { Agda } from '../type';

//
// Connection
//

export type Path = string;
export type Version = {
    raw: string;
    sem: string;
};
export type Protocol = 'Emacs' | 'JSON';
export type ValidPath = {
    path: Path;
    version: Version;
    supportedProtocol: Protocol[];
};

export type Connection = ValidPath & {
    stream: Duplex;
    queue: {
        resolve: (actions: Agda.Response[]) => void;
        reject: (error?: any) => void;
    }[];
    filepath: string;   // path of the Agda file
}
