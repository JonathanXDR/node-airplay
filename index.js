const { Browser } = require('./lib/airplay/browser.js');
const browser = new Browser();

browser.start();
// log "Browser started" in GREEN
console.log('\x1b[32m%s\x1b[0m', 'Browser started');

browser.on('deviceOnline', (device) => {
  console.log(`Found device with name: ${device.info.name}`);
  browser.getDeviceById(deviceId);
});

// browser.stop();
// console.log('\x1b[31m%s\x1b[0m', 'Browser stopped');
