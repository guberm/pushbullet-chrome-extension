async function setupOffscreenDocument() {
  const offscreenUrl = 'background.html';
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'keep background functional for background websocket connection'
  });
}

chrome.runtime.onStartup.addListener(setupOffscreenDocument);
chrome.runtime.onInstalled.addListener(setupOffscreenDocument);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'wake_up') {
    setupOffscreenDocument();
    sendResponse(true);
    return false;
  }
  
  if (message.api) {
      try {
          let parts = message.api.split('.');
          let obj = chrome;
          for (let i = 1; i < parts.length - 1; i++) {
              obj = obj[parts[i]];
          }
          let func = obj[parts[parts.length - 1]];
          if (func) {
              let res = func.apply(obj, message.args || []);
              if (res && typeof res.then === 'function') {
                  res.then(val => sendResponse(val)).catch(err => {
                      console.error('API Error', message.api, err);
                      sendResponse(null);
                  });
              } else {
                  sendResponse(res);
              }
          } else {
              console.error('API not found:', message.api);
              sendResponse(undefined);
          }
      } catch (e) {
          console.error('Forward API crashed:', message.api, e);
          sendResponse(null);
      }
      return true; // async response
  }
});

// Forward Events back to the offscreen document
function forwardEvent(eventName, ...args) {
    chrome.runtime.sendMessage({ event: eventName, args: args }).catch(() => {});
}

if (chrome.notifications) {
    chrome.notifications.onClicked.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.notifications.onClicked', ...args); 
    });
    chrome.notifications.onButtonClicked.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.notifications.onButtonClicked', ...args); 
    });
    chrome.notifications.onClosed.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.notifications.onClosed', ...args); 
    });
}

if (chrome.windows && chrome.windows.onRemoved) {
    chrome.windows.onRemoved.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.windows.onRemoved', ...args); 
    });
}

if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.commands.onCommand', ...args); 
    });
}

if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((...args) => { 
        setupOffscreenDocument(); 
        forwardEvent('chrome.contextMenus.onClicked', ...args); 
    });
}

if (chrome.idle && chrome.idle.onStateChanged) {
    chrome.idle.onStateChanged.addListener((...args) => {
        setupOffscreenDocument();
        forwardEvent('chrome.idle.onStateChanged', ...args);
    });
}
