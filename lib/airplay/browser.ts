import { EventEmitter } from 'events';
import * as mdns from 'multicast-dns';
import { Device } from './device';

export class Browser extends EventEmitter {
  private devices_: { [id: number]: Device };
  private nextDeviceId_: number;
  private browser_: any;

  constructor() {
    super();
    this.devices_ = {};
    this.nextDeviceId_ = 0;
    this.browser_ = mdns();

    this.browser_.on('response', (response: any) => {
      const info = response.answers[0]; // Assuming the relevant information is in the first answer
      const device = this.findDeviceByInfo_(info);
      if (!device) {
        const newDevice = new Device(this.nextDeviceId_++, info);
        this.devices_[newDevice.id] = newDevice;
        newDevice.on('ready', () => {
          this.emit('deviceOnline', newDevice);
        });
        newDevice.on('close', () => {
          delete this.devices_[newDevice.id];
          this.emit('deviceOffline', newDevice);
        });
      }
    });
  }

  private findDeviceByInfo_(info: any): Device | null {
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device.matchesInfo(info)) {
        return device;
      }
    }
    return null;
  }

  public getDevices(): Device[] {
    const devices: Device[] = [];
    for (const deviceId in this.devices_) {
      const device = this.devices_[deviceId];
      if (device.isReady()) {
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
    // Assuming the relevant service type is 'airplay'
    this.browser_.query({
      questions: [{ name: 'airplay.local', type: 'A' }],
    });
  }

  public stop(): void {
    // Not directly supported by multicast-dns; might need to implement a custom stop mechanism
  }
}
