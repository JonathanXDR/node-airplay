const Airplay = require('./airplay'); // Make sure this path points to airplay.js

const mediaUrl = 'YOUR_MEDIA_URL'; // Replace this with your media URL

const browser = Airplay.createBrowser();

// Start browsing for devices
browser.start();

// Event listeners
browser.on('deviceOnline', (device) => {
  console.log(`Device online: ${device.getName()}`);
  device.play(mediaUrl, 0, (res) => {
    if (res) {
      console.log('Media is playing');
    } else {
      console.error('Failed to play media');
    }
  });
});

browser.on('deviceOffline', (device) => {
  console.log(`Device offline: ${device.getName()}`);
});

// Stop browsing after 10 seconds and close the browser
setTimeout(() => {
  browser.stop();
}, 10000);
