
import { Browser } from './browser';
import { Device } from './device';

export { Browser, Device };

export function createBrowser(): Browser {
    return new Browser();
}

export function connect(host: string, port: number, opt_pass?: string): Device {
    // TODO: connect
    throw new Error('Not yet implemented');
}
