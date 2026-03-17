'use strict';

// Create a silent audio context to keep offscreen document alive because we use reason AUDIO_PLAYBACK
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || function() { return Promise.resolve() };
try {
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.0001; // inaudible but non-zero so Chrome keeps AudioContext alive
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
} catch (e) {
    console.error('Failed to start audio keeping offscreen alive', e);
}

setInterval(function() {
    chrome.runtime.sendMessage({ type: 'ping' }).catch(function() {});
}, 3000);
