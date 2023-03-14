const buffer = require('buffer');
const events = require('events');
const net = require('net');
const util = require('util');

class Client extends events.EventEmitter {
  constructor(host, port, user, pass, callback) {
    super();

    this.host_ = host;
    this.port_ = port;
    this.user_ = user;
    this.pass_ = pass;

    this.responseWaiters_ = [];

    this.socket_ = net.createConnection(port, host);
    this.socket_.on('connect', () => {
      this.responseWaiters_.push({
        callback,
      });
      this.socket_.write(
        'GET /playback-info HTTP/1.1\n' +
          'User-Agent: MediaControl/1.0\n' +
          'Content-Length: 0\n' +
          '\n'
      );
    });

    this.socket_.on('data', (data) => {
      const res = this.parseResponse_(data.toString());
      // util.puts(util.inspect(res));

      const waiter = this.responseWaiters_.shift();
      if (waiter.callback) {
        waiter.callback(res);
      }
    });
  }

  close() {
    if (this.socket_) {
      this.socket_.destroy();
    }
    this.socket_ = null;
  }

  parseResponse_(res) {
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

    const allHeaders = {};
    const headerLines = header.split('\n');
    for (let n = 0; n < headerLines.length; n++) {
      const headerLine = headerLines[n];
      const key = headerLine.substr(0, headerLine.indexOf(':'));
      const value = headerLine.substr(key.length + 2);
      allHeaders[key] = value;
    }

    return {
      statusCode: parseInt(statusMatch[1], 10),
      statusReason: statusMatch[2],
      headers: allHeaders,
      body,
    };
  }

  issue_(req, body, callback) {
    if (!this.socket_) {
      util.puts('client not connected');
      return;
    }

    req.headers = req.headers || {};
    req.headers['User-Agent'] = 'MediaControl/1.0';
    req.headers['Content-Length'] = body ? buffer.Buffer.byteLength(body) : 0;
    req.headers['Connection'] = 'keep-alive';

    let allHeaders = '';
    for (const key in req.headers) {
      allHeaders += key + ': ' + req.headers[key] + '\n';
    }

    const text =
      req.method + ' ' + req.path + ' HTTP/1.1\n' + allHeaders + '\n';
    if (body) {
      text += body;
    }

    this.responseWaiters_.push({
      callback,
    });
    this.socket_.write(text);
  }

  get(path, callback) {
    const req = {
      method: 'GET',
      path,
    };
    this.issue_(req, null, callback);
  }

  post(path, body, callback) {
    const req = {
      method: 'POST',
      path,
    };
    this.issue_(req, body, callback);
  }
}

module.exports = { Client };
