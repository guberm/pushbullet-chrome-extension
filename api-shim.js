// api-shim.js
// Polyfill missing Extension APIs for Offscreen document MV3

if (!chrome.runtime.getManifest) {
    chrome.runtime.getManifest = () => ({ version: "366", name: "Pushbullet" });
}

// A dictionary to store event listeners for our mock objects
const eventListeners = {};

// Helper to create a mock event that just stores the callback
function mockEvent(eventName) {
    eventListeners[eventName] = [];
    return {
        addListener: (cb) => eventListeners[eventName].push(cb),
        removeListener: (cb) => {
            const idx = eventListeners[eventName].indexOf(cb);
            if (idx !== -1) eventListeners[eventName].splice(idx, 1);
        }
    };
}

// Receive events from SW
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event && eventListeners[message.event]) {
        eventListeners[message.event].forEach(cb => cb(...(message.args || [])));
    }
});

// Helper to forward API calls to SW
function callSW(api, args, cb) {
    chrome.runtime.sendMessage({ api, args }, (response) => {
        if (cb) cb(response);
    });
}

// --- POLYFILLS ---

if (!chrome.action && chrome.browserAction) {
    chrome.action = chrome.browserAction;
}

if (!chrome.action) {
    chrome.action = {
        setIcon: (spec, cb) => callSW('chrome.action.setIcon', [spec], cb),
        setBadgeText: (spec, cb) => callSW('chrome.action.setBadgeText', [spec], cb),
        setBadgeBackgroundColor: (spec, cb) => callSW('chrome.action.setBadgeBackgroundColor', [spec], cb)
    };
} else if (!chrome.action.setIcon) {
    chrome.action.setIcon = (spec, cb) => callSW('chrome.action.setIcon', [spec], cb);
    chrome.action.setBadgeText = (spec, cb) => callSW('chrome.action.setBadgeText', [spec], cb);
    chrome.action.setBadgeBackgroundColor = (spec, cb) => callSW('chrome.action.setBadgeBackgroundColor', [spec], cb);
}

if (!chrome.windows) {
    chrome.windows = {
        onRemoved: mockEvent('chrome.windows.onRemoved'),
        create: (spec, cb) => callSW('chrome.windows.create', [spec], cb),
        remove: (id, cb) => callSW('chrome.windows.remove', [id], cb),
        update: (id, spec, cb) => callSW('chrome.windows.update', [id, spec], cb),
        getCurrent: (opts, cb) => callSW('chrome.windows.getCurrent', [opts], cb)
    };
} else if (!chrome.windows.onRemoved) {
    chrome.windows.onRemoved = mockEvent('chrome.windows.onRemoved');
}

if (!chrome.commands) {
    chrome.commands = {
        onCommand: mockEvent('chrome.commands.onCommand'),
        getAll: (cb) => callSW('chrome.commands.getAll', [], cb)
    };
} else if (!chrome.commands.onCommand) {
    chrome.commands.onCommand = mockEvent('chrome.commands.onCommand');
}

if (!chrome.notifications) {
    chrome.notifications = {
        create: (id, spec, cb) => callSW('chrome.notifications.create', [id, spec], cb),
        clear: (id, cb) => callSW('chrome.notifications.clear', [id], cb),
        update: (id, spec, cb) => callSW('chrome.notifications.update', [id, spec], cb),
        onClicked: mockEvent('chrome.notifications.onClicked'),
        onButtonClicked: mockEvent('chrome.notifications.onButtonClicked'),
        onClosed: mockEvent('chrome.notifications.onClosed')
    };
} else if (!chrome.notifications.onClicked) {
    chrome.notifications.onClicked = mockEvent('chrome.notifications.onClicked');
    chrome.notifications.onButtonClicked = mockEvent('chrome.notifications.onButtonClicked');
    chrome.notifications.onClosed = mockEvent('chrome.notifications.onClosed');
}

let contextMenuCounter = 0;
const contextMenuHandlers = {};

if (!chrome.contextMenus) {
    chrome.contextMenus = {
        create: (spec, cb) => {
            if (!spec.id) spec.id = 'menu_' + (++contextMenuCounter);
            if (spec.onclick) {
                contextMenuHandlers[spec.id] = spec.onclick;
                delete spec.onclick;
            }
            if (spec.contexts) {
                spec.contexts = spec.contexts.map(c => c === 'browser_action' ? 'action' : c);
            }
            callSW('chrome.contextMenus.create', [spec], cb);
        },
        removeAll: (cb) => {
            Object.keys(contextMenuHandlers).forEach(k => delete contextMenuHandlers[k]);
            callSW('chrome.contextMenus.removeAll', [], cb);
        },
        onClicked: mockEvent('chrome.contextMenus.onClicked')
    };
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (contextMenuHandlers[info.menuItemId]) {
            contextMenuHandlers[info.menuItemId](info, tab);
        }
    });
} else if (!chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked = mockEvent('chrome.contextMenus.onClicked');
}

if (!chrome.tabs) {
    chrome.tabs = {
        create: (spec, cb) => callSW('chrome.tabs.create', [spec], cb),
        query: (spec, cb) => callSW('chrome.tabs.query', [spec], cb),
        update: (id, spec, cb) => callSW('chrome.tabs.update', [id, spec], cb)
    };
}

if (!chrome.cookies) {
    chrome.cookies = {
        remove: (spec, cb) => callSW('chrome.cookies.remove', [spec], cb),
        set: (spec, cb) => callSW('chrome.cookies.set', [spec], cb),
        get: (spec, cb) => callSW('chrome.cookies.get', [spec], cb),
        getAll: (spec, cb) => callSW('chrome.cookies.getAll', [spec], cb)
    };
}

if (!chrome.permissions) {
    chrome.permissions = {
        contains: (spec, cb) => callSW('chrome.permissions.contains', [spec], cb),
        request: (spec, cb) => callSW('chrome.permissions.request', [spec], cb),
        remove: (spec, cb) => callSW('chrome.permissions.remove', [spec], cb)
    };
}

if (!chrome.idle) {
    chrome.idle = {
        onStateChanged: mockEvent('chrome.idle.onStateChanged'),
        queryState: (seconds, cb) => callSW('chrome.idle.queryState', [seconds], cb),
        setDetectionInterval: (seconds) => callSW('chrome.idle.setDetectionInterval', [seconds])
    };
} else if (!chrome.idle.onStateChanged) {
    chrome.idle.onStateChanged = mockEvent('chrome.idle.onStateChanged');
}

if (!chrome.i18n || !chrome.i18n.getMessage) {
    chrome.i18n = chrome.i18n || {};
    let messages = {};
    try {
        const xhr = new XMLHttpRequest();
        // Doing a synchronous fetch to make it immediately available
        const url = chrome.runtime.getURL('_locales/en/messages.json');
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status === 200) {
            messages = JSON.parse(xhr.responseText);
        }
    } catch (e) {
        console.error("Failed to load i18n messages synchronously", e);
    }
    
    chrome.i18n.getMessage = function(messageName, substitutions) {
        if (!messages[messageName]) return "";
        let text = messages[messageName].message;
        if (substitutions) {
            if (!Array.isArray(substitutions)) substitutions = [substitutions];
            for (let i = 0; i < substitutions.length; i++) {
                text = text.replace('$' + (i + 1), substitutions[i]);
            }
        }
        return text;
    };
}
