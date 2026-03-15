'use strict'

var _notificationsPollInterval = null;

var setUpNotificationsContent = function() {
    notificationsChangedListener()
    pb.addEventListener('notifications_changed', notificationsChangedListener)
    // Poll the background for fresh state every 2s as a safety net in case
    // a state update message was dropped or arrived before listeners were ready.
    _notificationsPollInterval = setInterval(function() {
        chrome.runtime.sendMessage({ type: 'get_pb_state' }, function(state) {
            if (chrome.runtime.lastError || !state || !state.notifier) return
            if (!pb.notifier) pb.notifier = {}
            var prev = JSON.stringify(pb.notifier.active || {})
            pb.notifier.active = state.notifier.active || {}
            if (JSON.stringify(pb.notifier.active) !== prev) {
                notificationsChangedListener()
            }
        })
    }, 2000)
}

var tearDownNotificationsContent = function() {
    pb.removeEventListener('notifications_changed', notificationsChangedListener)
    if (_notificationsPollInterval) {
        clearInterval(_notificationsPollInterval)
        _notificationsPollInterval = null
    }
}

var notificationsChangedListener = function() {
    if (!window) {
        return
    }
    if (!pb.notifier || !pb.notifier.active) {
        return
    }

    var count = Object.keys(pb.notifier.active).length
    var tab = document.getElementById('notifications-tab-label')
    if (count > 0) {
        tab.textContent = chrome.i18n.getMessage('notifications') + ' (' + count + ')'
    } else {
        tab.textContent = chrome.i18n.getMessage('notifications')
    }
    
    updateNotifications()
}

var updateNotifications = function() {
    var notificationsHolder = document.getElementById('notifications-holder')
    var emptyHolder = document.getElementById('notifications-empty')

    while (notificationsHolder.firstChild) {
        notificationsHolder.removeChild(notificationsHolder.firstChild)
    }

    var keys = Object.keys(pb.notifier.active)
    if (keys.length > 0) {
        notificationsHolder.style.display = 'block'
        emptyHolder.style.display = 'none'

        keys.forEach(function(key) {
            var options = pb.notifier.active[key]

            notificationsHolder.insertBefore(fakeNotifications.renderNotification(options, function() {
                clearNotification(options)
            }), notificationsHolder.firstChild)
        })
    } else {
        notificationsHolder.style.display = 'none'
        emptyHolder.style.display = 'block'
    }
}

var clearNotification = function(options) {
    // Update the local panel state immediately so the UI responds at once.
    if (pb.notifier && pb.notifier.active) {
        delete pb.notifier.active[options.key]
    }
    updateNotifications()

    // Also dismiss in the background (clears the system notification + syncs state).
    chrome.notifications.clear(options.key, function() {
        void chrome.runtime.lastError
    })
    chrome.runtime.sendMessage({
        type: 'call_pb_function',
        path: ['notifier', 'dismiss'],
        args: [options.key]
    }, function() { void chrome.runtime.lastError })
}
