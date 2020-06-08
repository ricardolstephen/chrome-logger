const os = require('os');
const path = require('path');

const chromiumNew = {
  userDataDir: path.join(os.homedir(), '.config/chromium'),
  headless: false,
  defaultViewport: null
};

const chromeRunning = {
  browserURL: 'http://localhost:9222',
  defaultViewport: null
};

// const chromeNew = {
//   executablePath: '/usr/bin/google-chrome',
//   userDataDir: path.join(os.homedir(), '.config/google-chrome'),
//   headless: false,
//   defaultViewport: null
// };

exports.chromiumNew = chromiumNew;
exports.chromeRunning = chromeRunning;
// exports.chromeNew = chromeNew;
