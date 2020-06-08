const path = require('path');
const puppeteer = require('puppeteer');

const BrowserLoggerTargetTagger = require('./BrowserLoggerTargetTagger');
const BrowserLoggerArgumentParser = require('./BrowserLoggerArgumentParser');
const BrowserLoggerStorage = require('./BrowserLoggerStorage');
const BrowserOptions = require('./BrowserOptions');

// Note, tag targets instead of pages, since a target's page is unavailable by
// the time the target emits a targetdestroyed event.
const browserPageTargetTagger = new BrowserLoggerTargetTagger();
let browserLoggerStorage = null;

const appName = 'myapp'
const appProcess = `${appName}_${process.pid}`;

async function surveyCurrentState(browser) {
  console.log('INFO: Surveying the browser instance.');
  
  const targets = browser.targets();
  for (let i = targets.length - 1; i >= 0; --i) {
    const target = targets[i];
    if (target.type() == 'page') {
      const targetId = browserPageTargetTagger.lookup(target);
      const eventData = {
        timestamp: Date.now(),
        url: target.url(),
        targetId: targetId,
        event: 'defaultpage'
      };
      browserLoggerStorage.store(eventData);

      const page = await target.page();
      const documentVisibilityState = await page.evaluate(() => document.visibilityState);
      if (documentVisibilityState === 'visible') {
        const eventData = {
          timestamp: Date.now(),
          targetId: targetId,
          event: 'defaultdocumentvisible'
        };
        browserLoggerStorage.store(eventData);
      }
    }
  }

  console.log('INFO: Done surveying the browser instance.');
}

function attachPageLoggers(browser) {

  // pagecreated events
  browser.on('targetcreated', (target) => {
    if (target.type() == 'page') {
      const eventData = {
        timestamp: Date.now(),
        url: target.url(),
        targetId: browserPageTargetTagger.lookup(target),
        event: 'pagecreated'
      };
      browserLoggerStorage.store(eventData);
    }
  });

  // pagechanged events
  browser.on('targetchanged', (target) => {
    if (target.type() == 'page') {
      const eventData = {
        timestamp: Date.now(),
        url: target.url(),
        targetId: browserPageTargetTagger.lookup(target),
        event: 'pagechanged'
      };
      browserLoggerStorage.store(eventData);
    }
  });

  // pagedestroyed events
  browser.on('targetdestroyed', (target) => {
    if (target.type() == 'page') {
      const eventData = {
        timestamp: Date.now(),
        url: target.url(),
        targetId: browserPageTargetTagger.lookup(target),
        event: 'pagedestroyed'
      };
      browserLoggerStorage.store(eventData);
    }
  });
}

async function attachDocumentLoggersToPage(page) {
  const targetId = browserPageTargetTagger.lookup(page.target());

  // Define a browser-side namespace to minimize the contamination of the
  // browser-side global namespace.
  const browserScript_createNamespace = function (appProcess) {
    this[appProcess] = {};
  }
  // Create the namespace within the current document of the page.
  await page.evaluate(browserScript_createNamespace, appProcess);
  // Create the namespace within every new document the page loads.
  await page.evaluateOnNewDocument(browserScript_createNamespace, appProcess);

  // documentvisible, documenthidden events
  // Construct the logger.
  const visibilityLogger = ((targetId) => {
    return function (data) {
      if (data.visibilityState == 'visible') {
        const eventData = {
          timestamp: data.timestamp,
          targetId: targetId,
          event: 'documentvisible'
        };
        browserLoggerStorage.store(eventData);
      } else if (data.visibilityState == 'hidden') {
        const eventData = {
          timestamp: data.timestamp,
          targetId: targetId,
          event: 'documenthidden'
        };
        browserLoggerStorage.store(eventData);
      }
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_visibilityLogger`, visibilityLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachVisibilityLogger = function (appProcess) {
    this[appProcess].visibilityListener = (event) => {
      this[`${appProcess}_visibilityLogger`]({
        timestamp: Date.now(),
        visibilityState: document.visibilityState
      });
    };
    window.addEventListener('visibilitychange',
                            this[appProcess].visibilityListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachVisibilityLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachVisibilityLogger,
                                   appProcess);

  // documentscroll events
  // Construct the logger.
  const scrollLogger = ((targetId) => {
    return function (data) {
      const eventData = {
        timestamp: data.timestamp,
        targetId: targetId,
        event: 'documentscroll'
      };
      browserLoggerStorage.store(eventData);
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_scrollLogger`, scrollLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachScrollLogger = function (appProcess) {
    this[appProcess].scrollListener = (() => {
      let waiting_for_timeout = false;
      return (() => {
        if (!waiting_for_timeout) {
          this[`${appProcess}_scrollLogger`]({timestamp: Date.now()});
          waiting_for_timeout = true;
          setTimeout(() => {waiting_for_timeout = false;}, 3000);
        }
      });
    })();
    window.addEventListener('scroll', this[appProcess].scrollListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachScrollLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachScrollLogger,
                                   appProcess);

  // documentkeydown events
  // Construct the logger.
  const keydownLogger = ((targetId) => {
    return function (data) {
      const eventData = {
        timestamp: data.timestamp,
        targetId: targetId,
        event: 'documentkeydown'
      };
      browserLoggerStorage.store(eventData);
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_keydownLogger`, keydownLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachKeydownLogger = function (appProcess) {
    this[appProcess].keydownListener = (() => {
      let waiting_for_timeout = false;
      return (() => {
        if (!waiting_for_timeout) {
          this[`${appProcess}_keydownLogger`]({timestamp: Date.now()});
          waiting_for_timeout = true;
          setTimeout(() => {waiting_for_timeout = false;}, 3000);
        }
      });
    })();
    window.addEventListener('keydown', this[appProcess].keydownListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachKeydownLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachKeydownLogger,
                                   appProcess);

  // documentfocus events
  // Construct the logger.
  const focusLogger = ((targetId) => {
    return function (data) {
      const eventData = {
        timestamp: data.timestamp,
        targetId: targetId,
        event: 'documentfocus'
      };
      browserLoggerStorage.store(eventData);
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_focusLogger`, focusLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachFocusLogger = function (appProcess) {
    this[appProcess].focusListener = () => {
      this[`${appProcess}_focusLogger`]({timestamp: Date.now()});
    };
    window.addEventListener('focus', this[appProcess].focusListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachFocusLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachFocusLogger, appProcess);

  // documentblur events
  // Construct the logger.
  const blurLogger = ((targetId) => {
    return function (data) {
      const eventData = {
        timestamp: data.timestamp,
        targetId: targetId,
        event: 'documentblur'
      };
      browserLoggerStorage.store(eventData);
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_blurLogger`, blurLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachBlurLogger = function (appProcess) {
    this[appProcess].blurListener = () => {
      this[`${appProcess}_blurLogger`]({timestamp: Date.now()});
    };
    window.addEventListener('blur', this[appProcess].blurListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachBlurLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachBlurLogger, appProcess);

  // documentclick events
  // Construct the logger.
  const clickLogger = ((targetId) => {
    return function (data) {
      const eventData = {
        timestamp: data.timestamp,
        targetId: targetId,
        event: 'documentclick'
      };
      browserLoggerStorage.store(eventData);
    };
  })(targetId);
  // Expose the logger to the browser-side page as an rpc.
  await page.exposeFunction(`${appProcess}_clickLogger`, clickLogger);
  // Define the browser-side script that attaches the logger to the document.
  const browserScript_attachClickLogger = function (appProcess) {
    this[appProcess].clickListener = () => {
      this[`${appProcess}_clickLogger`]({timestamp: Date.now()});
    };
    window.addEventListener('click', this[appProcess].clickListener);
  };
  // Attach the logger to the current document of the page.
  await page.evaluate(browserScript_attachClickLogger, appProcess);
  // Setup the page to attach the logger to every new document it loads.
  await page.evaluateOnNewDocument(browserScript_attachClickLogger, appProcess);
}

async function attachDocumentLoggers(browser) {

  // Attach document loggers to all default pages.
  const pages = await browser.pages();
  for (let i = pages.length - 1; i >= 0; --i) {
    attachDocumentLoggersToPage(pages[i]);
  }

  // Whenever a new page is created, attach document loggers to it.
  browser.on('targetcreated', async (target) => {
    if (target.type() == 'page') {
      const page = await target.page();
      attachDocumentLoggersToPage(page);
    }
  });
}

(async function main() {

  const args = BrowserLoggerArgumentParser.parseArguments();

  console.log(`INFO: Using logger process \`${appProcess}\`.`);

  let browser = null;
  if (args.launchChromium) {
    browser = await puppeteer.launch(BrowserOptions.chromiumNew);
    browserLoggerStorage =
      new BrowserLoggerStorage(path.join('logs', 'chromium'));
  } else {
    browser = await puppeteer.connect(BrowserOptions.chromeRunning);
    browserLoggerStorage =
      new BrowserLoggerStorage(path.join('logs', 'chrome'));
  }

  console.log('INFO: Connected to the browser.');

  surveyCurrentState(browser);
  
  attachPageLoggers(browser);
  attachDocumentLoggers(browser);

  const runCleanupProcedures = () => {
    browserLoggerStorage.close();
    console.log('\nINFO: Disconnected from the browser.');
    process.exit();
  }

  // Setup the browser disconnection handler to cleanup the system when it's
  // browser disconnects.
  browser.on('disconnected', runCleanupProcedures);

  // Setup the interrupt handler to disconnect from the browser on interrupt.
  process.on('SIGINT', async () => {
    const pages = await browser.pages();
    for (let i = pages.length -1; i >= 0; --i) {
      await pages[i].evaluate(function (appProcess) {
        
        window.removeEventListener('visibilitychange', this[appProcess].visibilityListener);
        delete this[`${appProcess}_visibilityLogger`];
        window.removeEventListener('scroll', this[appProcess].scrollListener);
        delete this[`${appProcess}_scrollLogger`];
        window.removeEventListener('keydown', this[appProcess].keydownListener);
        delete this[`${appProcess}_keydownLogger`];
        window.removeEventListener('focus', this[appProcess].focusListener);
        delete this[`${appProcess}_focusLogger`];
        window.removeEventListener('blur', this[appProcess].blurListener);
        delete this[`${appProcess}_blurLogger`];
        window.removeEventListener('click', this[appProcess].clickListener);
        delete this[`${appProcess}_clickLogger`];
        
        delete this[appProcess];
      }, appProcess);
    }
    browser.disconnect();
  });
})();
