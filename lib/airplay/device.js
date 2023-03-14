const events = require('events');
const plist = require('plist');
const util = require('util');

const { Client } = require('./client');

class Device extends events.EventEmitter {
  constructor(id, info, opt_readyCallback) {
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
        plist.parse(res.body, (err, obj) => {
          const el = obj[0];
          this.serverInfo_ = {
            deviceId: el.deviceid,
            features: el.features,
            model: el.model,
            protocolVersion: el.protovers,
            sourceVersion: el.srcvers,
          };
        });

        this.makeReady_(opt_readyCallback);
      });
    });
  }

  isReady() {
    return this.ready_;
  }

  makeReady_(opt_readyCallback) {
    this.ready_ = true;
    if (opt_readyCallback) {
      opt_readyCallback(this);
    }
    this.emit('ready');
  }

  close() {
    if (this.client_) {
      this.client_.close();
    }
    this.client_ = null;
    this.ready_ = false;

    this.emit('close');
  }

  getInfo() {
    const info = this.info_;
    const serverInfo = this.serverInfo_;
    return {
      id: this.id,
      name: info.serviceName,
      deviceId: info.host,
      features: serverInfo.features,
      model: serverInfo.model,
      slideshowFeatures: [],
      supportedContentTypes: [],
    };
  }

  getName() {
    return this.info_.serviceName;
  }

  matchesInfo(info) {
    for (const key in info) {
      if (this.info_[key] != info[key]) {
        return false;
      }
    }
    return true;
  }

  default(callback) {
    if (callback) {
      callback(this.getInfo());
    }
  }

  status(callback) {
    this.client_.get('/playback-info', (res) => {
      if (res) {
        plist.parse(res.body, (err, obj) => {
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
          if (callback) {
            callback(result);
          }
        });
      } else {
        if (callback) {
          callback(null);
        }
      }
    });
  }

  authorize(req, callback) {
    // TODO: implement authorize
    if (callback) {
      callback(null);
    }
  }

  play(content, start, callback) {
    const body =
      `Content-Location: ${content}\n` + `Start-Position: ${start}\n`;
    this.client_.post('/play', body, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  stop(callback) {
    this.client_.post('/stop', null, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  scrub(position, callback) {
    this.client_.post(`/scrub?position=${position}`, null, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  reverse(callback) {
    this.client_.post('/reverse', null, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  rate(value, callback) {
    this.client_.post(`/rate?value=${value}`, null, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  volume(value, callback) {
    this.client_.post(`/volume?value=${value}`, null, (res) => {
      if (callback) {
        callback(res ? {} : null);
      }
    });
  }

  photo(req, callback) {
    // TODO: implement photo
    if (callback) {
      callback(null);
    }
  }
}

module.exports = { Device };
