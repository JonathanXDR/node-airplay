const Client = require('./client');

class Device {
  constructor(host, port, user, pass) {
    this.host_ = host;
    this.port_ = port;
    this.user_ = user;
    this.pass_ = pass;
    this.client_ = null;
  }

  connect(callback) {
    this.client_ = new Client(
      this.host_,
      this.port_,
      this.user_,
      this.pass_,
      (res) => {
        if (res.statusCode === 200) {
          callback(null, res.body);
        } else {
          callback(new Error(`Failed to connect: ${res.statusReason}`), null);
        }
      }
    );
  }

  disconnect() {
    if (this.client_) {
      this.client_.close();
      this.client_ = null;
    }
  }

  getPlaybackInfo(callback) {
    this.client_.get('/playback-info', callback);
  }

  setPlaybackState(state, callback) {
    this.client_.post('/playback-state', JSON.stringify({ state }), callback);
  }

  setPosition(position, callback) {
    this.client_.post('/position', JSON.stringify({ position }), callback);
  }

  setVolume(volume, callback) {
    this.client_.post('/volume', JSON.stringify({ volume }), callback);
  }
}

module.exports = Device;
