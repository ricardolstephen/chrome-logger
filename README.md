Chrome Logger
=============
Log your activity on google chrome.


Setup
-----

Dependencies
+ linux
+ google-chrome
+ commander, puppeteer (tested on puppeteer 1.15.0)

```
npm install commander
npm install puppeteer
```


Usage
-----

```
# Launch chrome.
./launcher.sh

# Watch your chrome logs.
screen -R logger_process

# Access your older logs.
less ./logs/chrome/<month-date.txt>  # ~/logs if launcher is your default browser launcher
```

Make chrome logger your default browser launcher in order to log all your
browsing sessions. Then, access the logs at ~/logs.
