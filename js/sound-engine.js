(function () {
    "use strict";

    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = null;
    var muted = false;
    var storageKey = "dweb-sound-muted";

    // Pentatonic-ish subtle click tones (ORBIT-X inspired, premium volume)
    var CLICK_NOTE = 523.25;   // C5 - soft click
    var TOGGLE_NOTE = 659.25;  // E5 - toggle on
    var TOGGLE_OFF_NOTE = 493.88; // B4 - toggle off
    var NAV_NOTE = 783.99;     // G5 - navigation

    function ensureContext() {
        if (!context && AudioContext) {
            context = new AudioContext();
        }
        return context;
    }

    function play(freq, type, duration, vol) {
        if (muted || !context) return;
        try {
            var t = context.currentTime;
            var osc = context.createOscillator();
            var gain = context.createGain();
            osc.type = type || "sine";
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + duration);
            gain.gain.setValueAtTime(vol || 0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start(t);
            osc.stop(t + duration);
        } catch (e) {
            // Audio may be blocked by browser policy; fail silently.
        }
    }

    function resumeContext() {
        if (context && context.state === "suspended") {
            context.resume();
        }
    }

    window.soundEngine = {
        init: function () {
            try {
                muted = window.localStorage.getItem(storageKey) === "true";
            } catch (e) {
                muted = false;
            }
            document.addEventListener("mousedown", resumeContext, { once: true, passive: true });
            document.addEventListener("touchstart", resumeContext, { once: true, passive: true });
            document.addEventListener("keydown", resumeContext, { once: true });
        },
        click: function () {
            play(CLICK_NOTE, "sine", 0.06, 0.05);
        },
        toggleOn: function () {
            play(TOGGLE_NOTE, "triangle", 0.1, 0.07);
        },
        toggleOff: function () {
            play(TOGGLE_OFF_NOTE, "triangle", 0.1, 0.07);
        },
        nav: function () {
            play(NAV_NOTE, "sine", 0.05, 0.04);
        },
        setMuted: function (value) {
            muted = !!value;
            try {
                window.localStorage.setItem(storageKey, String(muted));
            } catch (e) {}
        },
        isMuted: function () {
            return muted;
        },
        toggle: function () {
            muted = !muted;
            try {
                window.localStorage.setItem(storageKey, String(muted));
            } catch (e) {}
            return muted;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            window.soundEngine.init();
        });
    } else {
        window.soundEngine.init();
    }
})();