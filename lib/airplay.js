const { Browser } = require('./airplay/browser');
const { Device } = require('./airplay/device'); // Make sure this path points to device.js

exports.Browser = Browser;
exports.createBrowser = () => new Browser();
exports.Device = Device;
exports.connect = (host, port, opt_pass) => {
  // TODO: connect
  throw new Error('not yet implemented');
};
