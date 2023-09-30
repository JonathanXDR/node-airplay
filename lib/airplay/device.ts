import { EventEmitter } from 'events';
import { Client } from './client';

export class Device extends EventEmitter {
  id: number;
  private info_: any;
  private serverInfo_: any | null;
  private ready_: boolean;
  private client_: Client;

  constructor(
    id: number,
    info: any,
    opt_readyCallback?: (device: Device) => void
  ) {
    super();
    this.id = id;
    this.info_ = info;
    this.serverInfo_ = null;
    this.ready_ = false;

    const host = info.host;
    const port = info.port;
    const user = 'Airplay';
    const pass = '';
    this.client_ = new Client(host, port, user, pass, () => {
      // TODO: support passwords

      this.client_.get('/server-info', (res) => {
        const parsedInfo = JSON.parse(res.body);
        const el = parsedInfo[0];
        this.serverInfo_ = {
          deviceId: el.deviceid,
          features: el.features,
          model: el.model,
          protocolVersion: el.protovers,
          sourceVersion: el.srcvers,
        };
        this.makeReady_(opt_readyCallback);
      });
    });
  }

  isReady(): boolean {
    return this.ready_;
  }

  private makeReady_(opt_readyCallback?: (device: Device) => void): void {
    this.ready_ = true;
    if (opt_readyCallback) {
      opt_readyCallback(this);
    }
    this.emit('ready');
  }

  close(): void {
    this.client_.close();
    this.ready_ = false;
    this.emit('close');
  }

  getInfo(): any {
    return {
      id: this.id,
      name: this.info_.serviceName,
      deviceId: this.info_.host,
      features: this.serverInfo_?.features,
      model: this.serverInfo_?.model,
      slideshowFeatures: [],
      supportedContentTypes: [],
    };
  }

  getName(): string {
    return this.info_.serviceName;
  }

  matchesInfo(info: any): boolean {
    for (const key in info) {
      if (this.info_[key] !== info[key]) {
        return false;
      }
    }
    return true;
  }

  default(callback?: (info: any) => void): void {
    if (callback) {
      callback(this.getInfo());
    }
  }

  status(callback: (result: any) => void): void {
    this.client_.get('/playback-info', (res) => {
      if (res) {
        // Assuming plist will be replaced by a new TS-compatible library or logic
        const obj = JSON.parse(res.body); // Placeholder logic
        const el = obj[0];
        const result = {
          duration: el.duration,
          position: el.position,
          rate: el.rate,
          playbackBufferEmpty: el.playbackBufferEmpty,
          playbackBufferFull: el.playbackBufferFull,
          playbackLikelyToKeepUp: el.playbackLikelyToKeepUp,
          readyToPlay: el.readyToPlay,
          loadedTimeRanges: el.loadedTimeRanges,
          seekableTimeRanges: el.seekableTimeRanges,
        };
        callback(result);
      } else {
        callback(null);
      }
    });
  }

  authorize(req: any, callback: (result: any | null) => void): void {
    // TODO: implement authorize
    callback(null);
  }

  play(
    content: string,
    start: number,
    callback: (res: any | null) => void
  ): void {
    const body =
      'Content-Location: ' + content + '\nStart-Position: ' + start + '\n';
    this.client_.post('/play', body, (res) => {
      callback(res ? {} : null);
    });
  }

  stop(callback: (res: any | null) => void): void {
    this.client_.post('/stop', '', (res) => {
      callback(res ? {} : null);
    });
  }

  scrub(position: number, callback: (res: any | null) => void): void {
    this.client_.post('/scrub?position=' + position, '', (res) => {
      callback(res ? {} : null);
    });
  }

  reverse(callback: (res: any | null) => void): void {
    this.client_.post('/reverse', '', (res) => {
      callback(res ? {} : null);
    });
  }

  rate(value: number, callback: (res: any | null) => void): void {
    this.client_.post('/rate?value=' + value, '', (res) => {
      callback(res ? {} : null);
    });
  }

  volume(value: number, callback: (res: any | null) => void): void {
    this.client_.post('/volume?value=' + value, '', (res) => {
      callback(res ? {} : null);
    });
  }

  photo(req: any, callback: (result: any | null) => void): void {
    // TODO: implement photo
    callback(null);
  }
}
