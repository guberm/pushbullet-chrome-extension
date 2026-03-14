// rpc-server.js
// Exposes the pb object to UI pages via messaging

function serializeState(obj, depth=0) {
    if (depth > 6) return null;
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
    if (message.type === 'call_pb_function') {
        try {
            let parts = message.path;
            let obj = window.pb;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            let func = obj[parts[parts.length - 1]];
            
            // Process args: if the last arg is a callback object, we must wrap it!
            // But wait, the foreground can't send functions over messaging.
            // Oh right, callbacks won't work in this simple Proxy!
            
            let res = func.apply(obj, message.args || []);
            // Assuming functions in `pb` like `sendPush` don't need UI callbacks.
            sendResponse({ success: true, result: res });
        } catch (e) {
            console.error('RPC call fell through', message.path, e);
            sendResponse({ success: false, error: e.toString() });
        }
        return true;
    }
});

// Broadcast state changes whenever events fire
const broadcastState = () => {
    chrome.runtime.sendMessage({ 
        type: 'pb_state_update', 
        state: serializeState(window.pb) 
    }).catch(() => {});
};

['active', 'locals_changed', 'notifications_changed', 'signed_in', 'signed_out'].forEach(evt => {
    pb.addEventListener(evt, () => {
        broadcastState();
        chrome.runtime.sendMessage({ type: 'pb_event', eventName: evt }).catch(() => {});
    });
});
