'use strict'

var setUpNotificationsContent = function() {
    notificationsChangedListener()
    pb.addEventListener('notifications_changed', notificationsChangedListener)
}

var tearDownNotificationsContent = function() {
    pb.removeEventListener('notifications_changed', notificationsChangedListener)
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
