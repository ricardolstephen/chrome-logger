const path = require('path');
const fs = require('fs');

class BrowserLoggerStorage {
  
  constructor(storageDir) {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, {recursive: true});
    }
    const today = new Date();
    const pad = (n) => (n < 10) ? `0${n}` : `${n}`;
    const storageFile = `${pad(today.getMonth()+1)}-${pad(today.getDate())}.txt`;
    this.storagePath = path.join(storageDir, storageFile);
    this.storage = fs.createWriteStream(this.storagePath, {flags: 'a'});
  }
  
  store(x) {
    const serialized = JSON.stringify(x);
    this.storage.write(`${serialized}\n`);
    if (x.url === undefined) {
      console.log(`${x.targetId.toString().padEnd(3)} ${x.event}`);
    } else {
      console.log(`${x.targetId.toString().padEnd(3)} ${x.event.padEnd(25)} \
                   ${x.url}`);
    }
  }

  close() {
    this.storage.end();
  }
}

module.exports = BrowserLoggerStorage;
