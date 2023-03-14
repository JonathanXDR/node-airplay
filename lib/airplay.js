const { Browser } = require('./airplay/browser');

exports.Browser = Browser;
exports.createBrowser = () => new Browser();

const { Device } = require('./airplay/device');
exports.Device = Device;
exports.connect = (host, port, opt_pass) => {
  // TODO: connect
  throw new Error('not yet implemented');
};
