'use strict'

pb.addEventListener('signed_in', function(e) {
    pb.updateIcon()

    pb.addEventListener('notifications_changed', function(e) {
        pb.updateIcon()
    })
})

pb.loadSettings = function() {
    pb.settings = {
        'darkMode': localStorage['darkMode'] === 'true',
        'openMyLinksAutomatically': localStorage['openMyLinksAutomatically'] !== 'false',
        'onlyShowTitles': localStorage['onlyShowTitles'] === 'true',
        'useDarkIcon': localStorage['useDarkIcon'] === 'true',
        'playSound': localStorage['playSound'] === 'true',
        'showMirrors': localStorage['showMirrors'] !== 'false',
        'showContextMenu': localStorage['showContextMenu'] !== 'false',
        'notificationDuration': parseInt(localStorage['notificationDuration']) || 0,
        'snoozedUntil': localStorage['snoozedUntil'] ? parseInt(localStorage['snoozedUntil']) || 0 : 0,
        'showNotificationCount': localStorage['showNotificationCount'] !== 'false',
        'hideSignInReminder': localStorage['hideSignInReminder'] === 'true',
        'allowInstantPush': localStorage['allowInstantPush'] === 'true',
        'instantPushIden': localStorage['instantPushIden'],
        'automaticallyAttachLink': localStorage['automaticallyAttachLink'] !== 'false',
        'disableAnalytics': localStorage['disableAnalytics'] === 'true',
        'needsDataApproval': localStorage['needsDataApproval'] === 'true',
        'enableFullLog': localStorage['enableFullLog'] === 'true'
    }

    pb.updateContextMenu()
    pb.updateIcon()

    clearTimeout(pb.snoozeTimeout)
    if (pb.isSnoozed()) {
        pb.snoozeTimeout = setTimeout(function() {
            delete localStorage.snoozedUntil
            pb.loadSettings()
        }, localStorage.snoozedUntil - Date.now())
    }
}

pb.saveSettings = function() {
    Object.keys(pb.settings).forEach(function(key) {
        localStorage[key] = pb.settings[key]
    })

    pb.dispatchEvent('notifications_changed')
}

pb.setSetting = function(key, value) {
    if (value == null) {
        delete localStorage[key]
        delete pb.settings[key]
    } else {
        localStorage[key] = value
        pb.settings[key] = value
    }
    pb.saveSettings()
    pb.loadSettings()
}

pb.snooze = function() {
    localStorage.snoozedUntil = Date.now() + (60 * 60 * 1000)
    pb.loadSettings()
}

pb.unsnooze = function() {
    delete localStorage.snoozedUntil
    pb.loadSettings()
}

pb.isSnoozed = function() {
    return pb.settings.snoozedUntil > Date.now()
}

pb.updateIcon = function() {
    if (!localStorage.apiKey) {
        chrome.action.setBadgeBackgroundColor({ 'color': '#e85845' })
        chrome.action.setBadgeText({ 'text': '1' })
    } else {
        if (!pb.settings.useDarkIcon) {
            pb.log('Using light icon')
            chrome.action.setIcon({
                'path': {
                    '19': 'icon_19.png',
                    '38': 'icon_38.png'
                }
            })
        } else {
            pb.log('Using dark icon')
            chrome.action.setIcon({
                'path': {
                    '19': 'icon_19_gray.png',
                    '38': 'icon_38_gray.png'
                }
            })
        }

        if (pb.settings.snoozedUntil > Date.now()) {
            chrome.action.setBadgeText({ 'text': 'zzz' })
            if (pb.settings.useDarkIcon) {
                chrome.action.setBadgeBackgroundColor({ 'color': '#76c064' })
            } else {
                chrome.action.setBadgeBackgroundColor({ 'color': '#4a4a4a' })
            }
        } else {
            var activeCount = Object.keys(pb.notifier.active).length;
            chrome.action.setBadgeText({
                'text': activeCount > 0 && pb.settings.showNotificationCount ? '' + activeCount : ''
            })

            if (pb.settings.useDarkIcon) {
                chrome.action.setBadgeBackgroundColor({ 'color': '#4ab367' })
            } else {
                chrome.action.setBadgeBackgroundColor({ 'color': '#e85845' })
            }
        }
    }
}
