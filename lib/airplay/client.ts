import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import * as net from 'net';

interface ResponseWaiter {
  callback?: (res: any) => void;
}

interface Request {
  method: string;
  path: string;
  headers?: { [key: string]: string | number };
}

export class Client extends EventEmitter {
  private host_: string;
  private port_: number;
  private user_: string;
  private pass_: string;
  private responseWaiters_: ResponseWaiter[];
  private socket_: net.Socket | null;

  constructor(
    host: string,
    port: number,
    user: string,
    pass: string,
    callback: (res: any) => void
  ) {
    super();
    this.host_ = host;
    this.port_ = port;
    this.user_ = user;
    this.pass_ = pass;
    this.responseWaiters_ = [];
    this.socket_ = net.createConnection(port, host);
    this.socket_.on('connect', () => {
      this.responseWaiters_.push({ callback });
      this.socket_?.write(
        'GET /playback-info HTTP/1.1\n' +
          'User-Agent: MediaControl/1.0\n' +
          'Content-Length: 0\n' +
          '\n'
      );
    });
    this.socket_.on('data', (data: Buffer) => {
      const res = this.parseResponse_(data.toString());
      const waiter = this.responseWaiters_.shift();
      waiter?.callback?.(res);
    });
  }

  public close(): void {
    this.socket_?.destroy();
    this.socket_ = null;
  }

  private parseResponse_(res: string): any {
    let header = res;
    let body = '';
    const splitPoint = res.indexOf('\r\n\r\n');
    if (splitPoint !== -1) {
      header = res.substr(0, splitPoint);
      body = res.substr(splitPoint + 4);
    }
    header = header.replace(/\r\n/g, '\n');
    const status = header.substr(0, header.indexOf('\n'));
    const statusMatch = status.match(/HTTP\/1.1 ([0-9]+) (.+)/);
    header = header.substr(status.length + 1);
    const allHeaders: { [key: string]: string } = {};
    const headerLines = header.split('\n');
    for (const headerLine of headerLines) {
      const key = headerLine.substr(0, headerLine.indexOf(':'));
      const value = headerLine.substr(key.length + 2);
      allHeaders[key] = value;
    }
    return {
      statusCode: parseInt(statusMatch![1]),
      statusReason: statusMatch![2],
      headers: allHeaders,
      body: body,
    };
  }

  private issue_(
    req: Request,
    body: string | null,
    callback: (res: any) => void
  ): void {
    if (!this.socket_) {
      console.log('client not connected');
      return;
    }
    req.headers = req.headers || {};
    req.headers['User-Agent'] = 'MediaControl/1.0';
    req.headers['Content-Length'] = body ? Buffer.byteLength(body) : 0;
    req.headers['Connection'] = 'keep-alive';
    let allHeaders = '';
    for (const key in req.headers) {
      allHeaders += key + ': ' + req.headers[key] + '\n';
    }
    let text = req.method + ' ' + req.path + ' HTTP/1.1\n' + allHeaders + '\n';
    if (body) {
      text += body;
    }
    this.responseWaiters_.push({ callback });
    this.socket_.write(text);
  }

  public get(path: string, callback: (res: any) => void): void {
    const req: Request = {
      method: 'GET',
      path: path,
    };
    this.issue_(req, null, callback);
  }

  public post(path: string, body: string, callback: (res: any) => void): void {
    const req: Request = {
      method: 'POST',
      path: path,
    };
    this.issue_(req, body, callback);
  }
}
