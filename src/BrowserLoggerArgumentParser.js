const commander = require('commander');

commander
  .description(`Collect user logs from chrome (default) or chromium.`)
  .option('--launchChromium', 'Launch and connect to an instance of chromium.');

function parseArguments() {
  commander.parse(process.argv);
  return {
    launchChromium: (commander.launchChromium !== undefined)
  };
}

exports.parseArguments = parseArguments;
