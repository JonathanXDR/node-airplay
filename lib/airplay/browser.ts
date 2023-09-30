import { EventEmitter } from 'events';
import * as mdns from 'mdns';
import { Device } from './device';

export class Browser extends EventEmitter {
  private devices_: { [key: number]: Device };
  private nextDeviceId_: number;
  private browser_: any;

  constructor() {
    super();
    this.devices_ = {};
    this.nextDeviceId_ = 0;
    this.browser_ = mdns.createBrowser(mdns.tcp('airplay'));
    this.browser_.on('serviceUp', (info: any, flags: any) =>
      this.handleServiceUp(info, flags)
    );
    this.browser_.on('serviceDown', (info: any, flags: any) =>
      this.handleServiceDown(info, flags)
    );
  }

  private handleServiceUp(info: any, flags: any): void {
    let device = this.findDeviceByInfo_(info);
    if (!device) {
      device = new Device(this.nextDeviceId_++, info);
      this.devices_[device.id] = device;
      device.on('ready', () => this.emit('deviceOnline', device));
      device.on('close', () => {
        if (device && this.devices_[device.id]) {
          delete this.devices_[device.id];
          this.emit('deviceOffline', device);
        }
      });
    }
  }

  private handleServiceDown(info: any, flags: any): void {
    const device = this.findDeviceByInfo_(info);
    if (device) {
      device.close();
    }
  }

  private findDeviceByInfo_(info: any): Device | null {
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device && device.matchesInfo(info)) {
        return device;
      }
    }
    return null;
  }

  public getDevices(): Device[] {
    const devices: Device[] = [];
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device && device.isReady()) {
        devices.push(device);
      }
    }
    return devices;
  }

  public getDeviceById(deviceId: number): Device | null {
    const device = this.devices_[deviceId];
    if (device && device.isReady()) {
      return device;
    }
    return null;
  }

  public start(): void {
    this.browser_.start();
  }

  public stop(): void {
    this.browser_.stop();
  }
}
