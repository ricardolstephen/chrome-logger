#!/bin/bash

CWD="$(dirname $(readlink -f "${BASH_SOURCE[0]}"))"
LOGGER_SCREEN="logger_process"
DEVTOOLS_SCREEN="devtools_process"
DEVTOOLS_PORT=9222

# Launch devtools and chrome.
if [[ -z "$(screen -ls | grep $DEVTOOLS_SCREEN)" ]]; then
  screen -dmS $DEVTOOLS_SCREEN
fi
if [[ -z "$(lsof -Pi @localhost:$DEVTOOLS_PORT -sTCP:LISTEN -t)" ]]; then
  screen -S $DEVTOOLS_SCREEN -X stuff \
         "/opt/google/chrome/chrome --remote-debugging-port=$DEVTOOLS_PORT\n"
  while [[ -z "$(lsof -Pi @localhost:$DEVTOOLS_PORT -sTCP:LISTEN -t)" ]]; do
    sleep 0.5
  done
else
  google-chrome
fi

# Launch logger.
if [[ -z "$(screen -ls | grep $LOGGER_SCREEN)" ]]; then
  screen -dmS $LOGGER_SCREEN
fi
if [[ $(echo "$(ps -aF | grep "BrowserLogger.js")" | wc -l) -ne 2 ]]; then
  screen -S $LOGGER_SCREEN -X stuff \
         "node $CWD/src/BrowserLogger.js\n"
fi
