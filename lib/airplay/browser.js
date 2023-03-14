const events = require('events');
const mdns = require('mdns');
const util = require('util');

const { Device } = require('./device');

class Browser extends events.EventEmitter {
  constructor() {
    super();

    this.devices_ = {};
    this.nextDeviceId_ = 0;

    this.browser_ = mdns.createBrowser(mdns.tcp('airplay'));
    this.browser_.on('serviceUp', (info, flags) => {
      console.log('available device: ' + info.name);

      let device = this.findDeviceByInfo_(info);
      if (!device) {
        device = new Device(this.nextDeviceId_++, info);
        this.devices_[device.id] = device;
        device.on('ready', () => {
          this.emit('deviceOnline', device);
        });
        device.on('close', () => {
          delete this.devices_[device.id];
          this.emit('deviceOffline', device);
        });
      }
    });

    this.browser_.on('serviceDown', (info, flags) => {
      const device = this.findDeviceByInfo_(info);
      if (device) {
        device.close();
      }
    });
  }

  findDeviceByInfo_(info) {
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device.matchesInfo(info)) {
        return device;
      }
    }
    return null;
  }

  getDevices() {
    const devices = [];
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device.isReady()) {
        devices.push(device);
      }
    }
    return devices;
  }

  getDeviceById(deviceId) {
    const device = this.devices_[deviceId];
    if (device && device.isReady()) {
      return device;
    }
    return null;
  }

  start() {
    this.browser_.start();
  }

  stop() {
    this.browser_.stop();
  }
}

exports.Browser = Browser;
