'use strict'

var focused = true, onFocusChanged
window.addEventListener('focus', function() {
    focused = true

    if (onFocusChanged) {
        onFocusChanged()
    }

    pb.dispatchEvent('active')
})
window.addEventListener('blur', function() {
    focused = false

    if (onFocusChanged) {
        onFocusChanged()
    }
})

function buildProxyFunction(path) {
    return function(...args) {
        // If the last arg is a function (callback), strip it and use the response channel.
        const lastArg = args[args.length - 1];
        if (typeof lastArg === 'function') {
            const callback = args.pop();
            chrome.runtime.sendMessage(
                { type: 'call_pb_function', path: path, args: args, hasCallback: true },
                function(result) {
                    // Always read lastError to prevent Chrome from throwing an unchecked error
                    // when the background port closes before responding.
                    if (chrome.runtime.lastError) { return; }
                    callback(result);
                }
            );
        } else {
            chrome.runtime.sendMessage(
                { type: 'call_pb_function', path: path, args: args },
                function() { void chrome.runtime.lastError; }
            );
        }
    };
}

// Ensure background-only functions are always callable as proxies,
// even before deepAssignState() populates them from the background state.
;['clearActiveChat', 'setActiveChat', 'track', 'sendPush', 'openChat'].forEach(function(fn) {
    if (typeof pb[fn] !== 'function') {
        pb[fn] = buildProxyFunction([fn]);
    }
});

function deepAssignState(target, source, path=[]) {
    for (let k of Object.keys(source)) {
        if (source[k] && source[k].__isFunction) {
            target[k] = buildProxyFunction([...path, k]);
        } else if (Array.isArray(source[k])) {
            // Recursively process array elements so nested __isFunction markers
            // inside button/item objects are converted to proxy functions.
            target[k] = source[k].map(function(item, i) {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    var obj = {};
                    deepAssignState(obj, item, [...path, k, String(i)]);
                    return obj;
                }
                return item;
            });
        } else if (source[k] && typeof source[k] === 'object') {
            if (!target[k]) target[k] = {};
            deepAssignState(target[k], source[k], [...path, k]);
        } else {
            target[k] = source[k];
        }
    }
}

var onload = function() {
    onload = null;
    chrome.runtime.sendMessage({type: 'wake_up'});
    
    var findPb = function() {
        chrome.runtime.sendMessage({type: 'get_pb_state'}, function(state) {
            if (chrome.runtime.lastError || !state) {
                setTimeout(findPb, 100);
                return;
            }
            
            window.pb = window.pb || {};
            // Emulate pb.addEventListener since it's commonly used locally too
            window.pb.addEventListener = function(evt, cb) {
                window.addEventListener(evt, cb);
            };
            window.pb.removeEventListener = function(evt, cb) {
                window.removeEventListener(evt, cb);
            };
            
            deepAssignState(window.pb, state);

            // Always keep event listener functions local — never proxy them via RPC.
            // deepAssignState overwrites them with proxies because they appear as
            // functions in the serialized background state.
            window.pb.addEventListener = function(evt, cb) { window.addEventListener(evt, cb); };
            window.pb.removeEventListener = function(evt, cb) { window.removeEventListener(evt, cb); };

            chrome.runtime.onMessage.addListener(function(msg) {
                if (msg.type === 'pb_state_update') {
                    deepAssignState(window.pb, msg.state);
                    // Re-pin after every state update too
                    window.pb.addEventListener = function(evt, cb) { window.addEventListener(evt, cb); };
                    window.pb.removeEventListener = function(evt, cb) { window.removeEventListener(evt, cb); };
                    // Fire the associated event AFTER state is applied so listeners
                    // always see up-to-date state (fixes notifications_changed race).
                    if (msg.eventName) {
                        window.dispatchEvent(new CustomEvent(msg.eventName));
                    }
                }
            });
            
            ready();
        });
    };
    findPb();
}

var ready = function() {
    addBodyCssClasses()

    window.init()

    pb.dispatchEvent('active')
}

var addBodyCssClasses = function() {
    if (pb.local && pb.local.user) {
        document.body.classList.add('signed-in')
    } else {
        document.body.classList.add('not-signed-in')
    }

    if (pb.browser == 'chrome') {
        document.body.classList.add('chrome')
    } else {
        document.body.classList.add('not-chrome')
    }

    if (pb.browser == 'edge') {
        document.body.classList.add('edge')
    } else {
        document.body.classList.add('not-edge')
    }

    if (pb.browser == 'opera') {
        document.body.classList.add('opera')
    } else {
        document.body.classList.add('not-opera')
    }

    if (pb.browser == 'safari') {
        document.body.classList.add('safari')
    } else {
        document.body.classList.add('not-safari')
    }

    if (pb.browser == 'firefox') {
        document.body.classList.add('firefox')
    } else {
        document.body.classList.add('not-firefox')
    }

    if (navigator.platform.indexOf('MacIntel') != -1) {
        document.body.classList.add('mac')
    } else {
        document.body.classList.add('not-mac')
    }

    if (navigator.platform.toLowerCase().indexOf('win') != -1) {
        document.body.classList.add('windows')
    } else {
        document.body.classList.add('not-windows')
    }
}

document.addEventListener('DOMContentLoaded', onload)

window.onerror = function(message, file, line, column, error) {
    if (typeof pb.track === 'function') {
        pb.track({
            'name': 'error',
            'stack': error ? error.stack : file + ':' + line + ':' + column,
            'message': message
        })
    }
}
