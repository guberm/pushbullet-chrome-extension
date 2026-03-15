'use strict'

var allEntries = []
var filterText = ''

var logEl       = document.getElementById('log')
var emptyEl     = document.getElementById('empty')
var filterEl    = document.getElementById('filter')
var autoScrollEl= document.getElementById('auto-scroll')
var statusEl    = document.getElementById('status')
var countEl     = document.getElementById('count')

// ─── Rendering ────────────────────────────────────────────────────────────────

function classify(text) {
    var lower = text.toLowerCase()
    if (/error|exception|uncaught|failed|fail/.test(lower)) return 'err'
    if (/warn|warning/.test(lower)) return 'warn'
    if (/signed in|bootstrapping|websocket|connected|saving/.test(lower)) return 'info'
    return ''
}

function makeEntry(raw) {
    var text
    try { text = JSON.parse(raw) } catch(e) { text = raw }
    if (typeof text === 'object') text = JSON.stringify(text)

    var div = document.createElement('div')
    div.className = 'entry'
    div.dataset.raw = text.toLowerCase()

    var ts = ''
    var body = text
    // Try to extract timestamp prefix "3/15/2026, 1:58:12 PM - "
    var m = text.match(/^(\d+\/\d+\/\d+,\s*[\d:]+\s*[AP]M)\s*-\s*(.*)$/s)
    if (m) { ts = m[1]; body = m[2] }

    var tsSpan = document.createElement('span')
    tsSpan.className = 'ts'
    tsSpan.textContent = ts ? '[' + ts + '] ' : ''

    var txtSpan = document.createElement('span')
    txtSpan.className = 'txt ' + classify(body)
    txtSpan.textContent = body

    div.appendChild(tsSpan)
    div.appendChild(txtSpan)
    return div
}

function appendEntry(raw) {
    allEntries.push(raw)
    var div = makeEntry(raw)
    var matches = !filterText || div.dataset.raw.includes(filterText)
    if (!matches) div.classList.add('hidden')
    if (emptyEl.parentNode) emptyEl.remove()
    logEl.appendChild(div)
    countEl.textContent = allEntries.length + ' entries'
    if (autoScrollEl.checked && matches) {
        logEl.scrollTop = logEl.scrollHeight
    }
}

function applyFilter() {
    filterText = filterEl.value.toLowerCase().trim()
    var entries = logEl.querySelectorAll('.entry')
    entries.forEach(function(el) {
        el.classList.toggle('hidden', !!(filterText && !el.dataset.raw.includes(filterText)))
    })
    if (autoScrollEl.checked) logEl.scrollTop = logEl.scrollHeight
}

// ─── Controls ─────────────────────────────────────────────────────────────────

filterEl.addEventListener('input', applyFilter)

document.getElementById('btn-clear').onclick = function() {
    allEntries = []
    logEl.innerHTML = ''
    logEl.appendChild(emptyEl)
    countEl.textContent = '0 entries'
    chrome.runtime.sendMessage({ type: 'clear_full_log' }, function() {
        void chrome.runtime.lastError
    })
}

document.getElementById('btn-copy').onclick = function() {
    if (allEntries.length === 0) { alert('No logs to copy.'); return }
    var lines = allEntries.map(function(r) {
        try { return JSON.parse(r) } catch(e) { return r }
    }).join('\n')
    navigator.clipboard.writeText(lines).then(function() {
        var btn = document.getElementById('btn-copy')
        var orig = btn.textContent
        btn.textContent = '✅ Copied!'
        setTimeout(function() { btn.textContent = orig }, 1500)
    }).catch(function() {
        alert('Copy failed — try downloading instead.')
    })
}

document.getElementById('btn-download').onclick = function() {
    if (allEntries.length === 0) { alert('No logs to download.'); return }
    var lines = allEntries.map(function(r) {
        try { return JSON.parse(r) } catch(e) { return r }
    }).join('\n')
    var blob = new Blob([lines], { type: 'text/plain' })
    var url  = URL.createObjectURL(blob)
    var a    = document.createElement('a')
    a.href   = url
    a.download = 'pushbullet-' + new Date().toISOString().replace(/[:.]/g,'-') + '.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// ─── Live feed ────────────────────────────────────────────────────────────────

// Listen for live entries broadcast from background
chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.type === 'log_entry') {
        appendEntry(msg.entry)
    }
})

// Load existing entries on open
window.init = function() {
    statusEl.textContent = '🟢 Connected'
    chrome.runtime.sendMessage({ type: 'get_full_log' }, function(response) {
        if (chrome.runtime.lastError || !response) {
            statusEl.textContent = '🔴 Error loading logs'
            return
        }
        response.log.forEach(appendEntry)
    })
}
