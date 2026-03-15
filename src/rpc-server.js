// rpc-server.js
// Exposes the pb object to UI pages via messaging

function serializeState(obj, depth=0) {
    if (depth > 12) return null;
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'function') return { __isFunction: true };
    if (Array.isArray(obj)) return obj.map(v => serializeState(v, depth+1));
    if (typeof obj === 'object') {
        const res = {};
        for (let k of Object.keys(obj)) {
            if (k === 'alertSound' || k === 'socket') continue;
            try {
                res[k] = serializeState(obj[k], depth+1);
            } catch (e) {}
        }
        return res;
    }
    return obj;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'get_pb_state') {
        sendResponse(serializeState(window.pb));
        return true;
    }
    if (message.type === 'get_full_log') {
        sendResponse({ log: window.pb.fullLog || [] });
        return true;
    }
    if (message.type === 'clear_full_log') {
        window.pb.fullLog = [];
        sendResponse({ ok: true });
        return true;
    }
    if (message.type === 'call_pb_function') {
        try {
            let parts = message.path;
            let obj = window.pb;
            for (let i = 0; i < parts.length - 1; i++) {
                if (obj == null) {
                    sendResponse({ success: false, error: `Path traversal failed at "${parts[i]}": parent is null/undefined` });
                    return true;
                }
                obj = obj[parts[i]];
            }
            if (obj == null) {
                sendResponse({ success: false, error: `Parent at path "${parts.slice(0, -1).join('.')}" is null/undefined` });
                return true;
            }
            let func = obj[parts[parts.length - 1]];
            if (typeof func !== 'function') {
                sendResponse({ success: false, error: `"${parts.join('.')}" is not a function` });
                return true;
            }

            if (message.hasCallback) {
                // Inject a synthetic callback that returns the result via sendResponse.
                const callArgs = [...(message.args || []), function(result) {
                    sendResponse(result !== undefined ? result : null);
                }];
                func.apply(obj, callArgs);
                return true; // keep channel open for async response
            } else {
                let res = func.apply(obj, message.args || []);
                sendResponse({ success: true, result: res });
            }
        } catch (e) {
            console.error('RPC call fell through', message.path, e);
            sendResponse({ success: false, error: e.toString() });
        }
        return true;
    }
});

// Broadcast state changes whenever events fire.
// We piggyback the eventName on the state update so the panel always
// applies new state BEFORE firing the event — preventing race conditions
// where the event arrives before the state (e.g. notifications_changed).
['active', 'locals_changed', 'notifications_changed', 'signed_in', 'signed_out'].forEach(evt => {
    pb.addEventListener(evt, () => {
        chrome.runtime.sendMessage({
            type: 'pb_state_update',
            state: serializeState(window.pb),
            eventName: evt
        }).catch(() => {});
    });
});
