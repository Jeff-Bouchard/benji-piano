
    "use strict";

    const state = {
      audio: null,
      analyser: null,
      master: null,
      delay: null,
      feedback: null,
      active: new Map(),
      latched: false,
      sequenceTimer: null,
      sequenceIndex: 0,
      consumedNch: 0,
      events: [],
      capturePackets: [],
      captureEvents: [],
      lastPulse: 0
    };

    const notes = [
      { note: "C4", frequency: 261.63, kind: "white", fullName: "Layer 0 OWF / Rompel identity anchor", key: "a", focus: "Identity and WORM namespace", benji: "Benji Button / sovereign identity anchor" },
      { note: "C#4", frequency: 277.18, kind: "black", fullName: "RC4OK entropy mixing", key: "w", focus: "Entropy and physical proof", benji: "Benji Button / RC4OK entropy mask" },
      { note: "D4", frequency: 293.66, kind: "white", fullName: "Layer 1 LBRTY radio when available", key: "s", focus: "Transport and mesh routing", benji: "Benji Button / radio transport decoy" },
      { note: "D#4", frequency: 311.13, kind: "black", fullName: "TLSA DANE endpoint authentication", key: "e", focus: "Identity and WORM namespace", benji: "Benji Button / TLSA verification tone" },
      { note: "E4", frequency: 329.63, kind: "white", fullName: "Layer 2 SoftEther VPN with NAT traversal and WireGuard", key: "d", focus: "Transport and mesh routing", benji: "Benji Button / SoftEther tunnel cover" },
      { note: "F4", frequency: 349.23, kind: "white", fullName: "Layer 2.5 Skywire source-routed MPLS mesh", key: "f", focus: "Transport and mesh routing", benji: "Benji Button / Skywire next-hop-blind route" },
      { note: "F#4", frequency: 369.99, kind: "black", fullName: "EmerSSH authenticated shell binding", key: "t", focus: "Identity and WORM namespace", benji: "Benji Button / EmerSSH operator phrase" },
      { note: "G4", frequency: 392.00, kind: "white", fullName: "Layer 3 EmerDNS decentralized name resolution", key: "g", focus: "Identity and WORM namespace", benji: "Benji Button / EmerDNS name reveal" },
      { note: "G#4", frequency: 415.30, kind: "black", fullName: "ENUMER phone and address discovery namespace", key: "y", focus: "Identity and WORM namespace", benji: "Benji Button / ENUMER alias chord" },
      { note: "A4", frequency: 440.00, kind: "white", fullName: "WORM trust chain record", key: "h", focus: "Identity and WORM namespace", benji: "Benji Button / WORM record resolver" },
      { note: "A#4", frequency: 466.16, kind: "black", fullName: "EmerDPO organization ownership", key: "u", focus: "Identity and WORM namespace", benji: "Benji Button / DPO ownership proof" },
      { note: "B4", frequency: 493.88, kind: "white", fullName: "EmerSSL certificate binding", key: "j", focus: "Identity and WORM namespace", benji: "Benji Button / EmerSSL handshake" },
      { note: "C5", frequency: 523.25, kind: "white", fullName: "UHEPRNG ultra-high-entropy generator", key: "k", focus: "Entropy and physical proof", benji: "Benji Button / UHEPRNG noise carrier" },
      { note: "C#5", frequency: 554.37, kind: "black", fullName: "Skywire mesh route advertisement", key: "o", focus: "Transport and mesh routing", benji: "Benji Button / mesh advertisement pulse" },
      { note: "D5", frequency: 587.33, kind: "white", fullName: "PBAT physical biometric authentication token", key: "l", focus: "Entropy and physical proof", benji: "Benji Button / PBAT bone-conduction motif" },
      { note: "D#5", frequency: 622.25, kind: "black", fullName: "RFC 9497 ristretto255-SHA512 POPRF / VOPRF blind token", key: "p", focus: "Entropy and physical proof", benji: "Benji Button / blind-token shimmer" },
      { note: "E5", frequency: 659.25, kind: "white", fullName: "IPFS and emerMAGNET content retrieval", key: ";", focus: "Transport and mesh routing", benji: "Benji Button / content retrieval decoy" },
      { note: "F5", frequency: 698.46, kind: "white", fullName: "RandPay probabilistic micropayment settlement", key: "z", focus: "Settlement and NCH Energy", benji: "Benji Button / RandPay ticket roll" },
      { note: "F#5", frequency: 739.99, kind: "black", fullName: "VRF verifiable random function service", key: "x", focus: "Entropy and physical proof", benji: "Benji Button / VRF reveal-after-consumption" },
      { note: "G5", frequency: 783.99, kind: "white", fullName: "x402 HTTP 402 payment interface", key: "c", focus: "Settlement and NCH Energy", benji: "Benji Button / x402 payment-required motif" },
      { note: "G#5", frequency: 830.61, kind: "black", fullName: "Emercoin NVS name-value storage operation", key: "v", focus: "Settlement and NCH Energy", benji: "Benji Button / NVS value reveal, never execute" },
      { note: "A5", frequency: 880.00, kind: "white", fullName: "NCH Energy consumption and dissipation", key: "b", focus: "Settlement and NCH Energy", benji: "Benji Button / NCH Energy debit" },
      { note: "A#5", frequency: 932.33, kind: "black", fullName: "Skywire exit edge with TLSA at the internet boundary", key: "n", focus: "Transport and mesh routing", benji: "Benji Button / exit-edge obfuscation" },
      { note: "B5", frequency: 987.77, kind: "white", fullName: "Persona Engine derived pseudonymous identity", key: "m", focus: "Identity and WORM namespace", benji: "Benji Button / persona blend-set voice" }
    ];

    const dataPoisonerModules = [
      { name: "Canvas noise", detail: "Tiny deterministic per-origin pixel perturbation to prevent stable canvas fingerprinting.", strict: 0.0025, moderate: 0.0008, baseline: 0.0002 },
      { name: "Audio noise", detail: "Perturbs audio buffers and analyser reads to break audio fingerprinting.", strict: 0.0025, moderate: 0.0008, baseline: 0.0002 },
      { name: "WebGL noise and vendor clamp", detail: "Generic vendor/renderer plus slight readPixels noise.", strict: 0.0025, moderate: 0.0008, baseline: 0.0002 },
      { name: "Quantize performance.now()", detail: "Rounds high-resolution timers: Strict 12 ms, Moderate 8 ms, Baseline 4 ms.", strict: 12, moderate: 8, baseline: 4 },
      { name: "Date.now() skew and quantize", detail: "Strict around 25 ms, Moderate around 12 ms, Baseline around 6 ms.", strict: 25, moderate: 12, baseline: 6 },
      { name: "Strict-mode analytics payload poisoning", detail: "Actual extension capability: page-world send hooks can modify analytics payloads when installed and authorized. This portable file does not do that.", strict: 100, moderate: 0, baseline: 0 },
      { name: "Storage hygiene", detail: "Blocks common tracker keys such as _ga and fbp in localStorage/sessionStorage.", strict: 100, moderate: 100, baseline: 100 },
      { name: "Whitelist bypass", detail: "Whitelisted origins bypass poisoning and suppression entirely.", strict: 100, moderate: 100, baseline: 100 }
    ];

    const denyHosts = [
      "www.google-analytics.com",
      "analytics.google.com",
      "stats.g.doubleclick.net",
      "ssl.google-analytics.com",
      "region1.google-analytics.com",
      "api.segment.io",
      "cdn.segment.com",
      "segment.io",
      "api.amplitude.com",
      "amplitude.com",
      "api2.amplitude.com",
      "api.mixpanel.com",
      "decide.mixpanel.com",
      "facebook.com",
      "www.facebook.com",
      "connect.facebook.net",
      "graph.facebook.com",
      "snapads.com",
      "sc-analytics.appspot.com",
      "log.byteoversea.com",
      "business-api.tiktok.com",
      "analytics.tiktok.com",
      "px.ads.linkedin.com",
      "api.linkedin.com",
      "bat.bing.com",
      "app.link",
      "cdn.branch.io",
      "action.metaffiliation.com",
      "click.linksynergy.com",
      "track.adform.net",
      "ib.adnxs.com",
      "idsync.rlcdn.com",
      "collector.github.com"
    ];

    const noteByName = new Map(notes.map((note) => [note.note, note]));
    const noteByKey = new Map(notes.map((note) => [note.key, note]));
    const blackPattern = ["C#4", "D#4", null, "F#4", "G#4", "A#4", null, "C#5", "D#5", null, "F#5", "G#5", "A#5", null];

    const elements = {
      whiteRow: document.getElementById("whiteRow"),
      blackRow: document.getElementById("blackRow"),
      keybed: document.getElementById("keybed"),
      waveform: document.getElementById("waveform"),
      stackFocus: document.getElementById("stackFocus"),
      nchReserve: document.getElementById("nchReserve"),
      nchReserveRead: document.getElementById("nchReserveRead"),
      nchConsumed: document.getElementById("nchConsumed"),
      nchRemaining: document.getElementById("nchRemaining"),
      tempo: document.getElementById("tempo"),
      tempoRead: document.getElementById("tempoRead"),
      tempoInterval: document.getElementById("tempoInterval"),
      currentNote: document.getElementById("currentNote"),
      scope: document.getElementById("scope"),
      benjiButtons: document.getElementById("benjiButtons"),
      benjiLedger: document.getElementById("benjiLedger"),
      poisonMode: document.getElementById("poisonMode"),
      payloadFormat: document.getElementById("payloadFormat"),
      nchPerEvent: document.getElementById("nchPerEvent"),
      nchPerEventRead: document.getElementById("nchPerEventRead"),
      risk: document.getElementById("risk"),
      riskRead: document.getElementById("riskRead"),
      modules: document.getElementById("modules"),
      poisonLedger: document.getElementById("poisonLedger"),
      captureFile: document.getElementById("captureFile"),
      captureScale: document.getElementById("captureScale"),
      nchPerPacket: document.getElementById("nchPerPacket"),
      nchPerPacketRead: document.getElementById("nchPerPacketRead"),
      captureLedger: document.getElementById("captureLedger")
    };

    const scopeContext = elements.scope.getContext("2d");

    function formatNch(value) {
      return Number(value).toFixed(6);
    }

    function tempoIntervalMs() {
      return Math.max(1, Math.round(60000 / Number(elements.tempo.value)));
    }

    function eventCostNch(durationSeconds, note) {
      const base = Number(elements.nchPerEvent.value);
      const reserve = Number(elements.nchReserve.value);
      const risk = Number(elements.risk.value);
      const focusMultiplier = note && note.focus === "Settlement and NCH Energy" ? 1.18 : 1;
      const durationMultiplier = Math.max(0.12, durationSeconds);
      const amortizedDissipation = (0.05 * reserve) / risk;
      return (base * durationMultiplier * focusMultiplier) + amortizedDissipation;
    }

    function consumeNch(amount, label, detail) {
      state.consumedNch += amount;
      state.events.push({
        at: new Date().toISOString(),
        label,
        detail,
        nchEnergyConsumed: amount,
        nchEnergyConsumedTotal: state.consumedNch
      });
      if (state.events.length > 200) state.events.shift();
      renderEnergy();
    }

    function renderEnergy() {
      const reserve = Number(elements.nchReserve.value);
      elements.nchReserveRead.textContent = formatNch(reserve);
      elements.nchConsumed.textContent = formatNch(state.consumedNch);
      elements.nchRemaining.textContent = formatNch(Math.max(0, reserve - state.consumedNch));
      elements.tempoRead.textContent = String(elements.tempo.value);
      elements.tempoInterval.textContent = String(tempoIntervalMs()) + " ms";
      elements.nchPerEventRead.textContent = formatNch(elements.nchPerEvent.value);
      elements.riskRead.textContent = String(elements.risk.value);
      elements.nchPerPacketRead.textContent = formatNch(elements.nchPerPacket.value);
      if (state.master) state.master.gain.value = Math.min(0.72, Math.max(0.05, reserve / 3200));
      renderModules();
    }

    function ensureAudio() {
      if (state.audio) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      state.audio = new AudioContextClass();
      state.analyser = state.audio.createAnalyser();
      state.analyser.fftSize = 1024;
      state.master = state.audio.createGain();
      state.delay = state.audio.createDelay(0.5);
      state.feedback = state.audio.createGain();
      state.delay.delayTime.value = 0.16;
      state.feedback.gain.value = 0.18;
      state.delay.connect(state.feedback);
      state.feedback.connect(state.delay);
      state.master.connect(state.analyser);
      state.delay.connect(state.analyser);
      state.analyser.connect(state.audio.destination);
      renderEnergy();
    }

    function shapeForFocus(focus) {
      if (focus === "Transport and mesh routing") return { attack: 0.012, release: 0.28, detune: 4, delay: 0.13 };
      if (focus === "Entropy and physical proof") return { attack: 0.006, release: 0.46, detune: -7, delay: 0.23 };
      if (focus === "Settlement and NCH Energy") return { attack: 0.018, release: 0.22, detune: 0, delay: 0.08 };
      return { attack: 0.01, release: 0.34, detune: 2, delay: 0.16 };
    }

    function startNote(note, source) {
      ensureAudio();
      if (state.audio.state === "suspended") state.audio.resume();
      if (state.active.has(note.note)) return;
      const now = state.audio.currentTime;
      const shape = shapeForFocus(note.focus);
      const oscillator = state.audio.createOscillator();
      const overtone = state.audio.createOscillator();
      const gain = state.audio.createGain();
      const overtoneGain = state.audio.createGain();
      oscillator.type = elements.waveform.value;
      oscillator.frequency.value = note.frequency;
      oscillator.detune.value = shape.detune;
      overtone.type = elements.waveform.value === "sine" ? "triangle" : "sine";
      overtone.frequency.value = note.frequency * 2;
      overtoneGain.gain.value = 0.14;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.82, now + shape.attack);
      gain.gain.exponentialRampToValueAtTime(0.24, now + 0.18);
      state.delay.delayTime.setTargetAtTime(shape.delay, now, 0.02);
      oscillator.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(state.master);
      gain.connect(state.delay);
      oscillator.start(now);
      overtone.start(now);
      state.active.set(note.note, { oscillator, overtone, gain, started: now, source });
      setPressed(note.note, true);
      elements.currentNote.textContent = note.note + " / " + note.fullName;
      state.lastPulse = performance.now();
    }

    function stopNote(note, force) {
      const voice = state.active.get(note.note);
      if (!voice) return;
      if (state.latched && !force && voice.source !== "sequence") return;
      const now = state.audio ? state.audio.currentTime : 0;
      const duration = Math.max(0.06, now - voice.started);
      const shape = shapeForFocus(note.focus);
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0.0001, now, shape.release / 4);
      voice.oscillator.stop(now + shape.release);
      voice.overtone.stop(now + shape.release);
      state.active.delete(note.note);
      setPressed(note.note, false);
      consumeNch(eventCostNch(duration, note), "Deterministic sound proof note", note.note + " / " + note.fullName);
      if (state.active.size === 0) elements.currentNote.textContent = "Ready";
    }

    function setPressed(noteName, on) {
      document.querySelectorAll('[data-note="' + noteName + '"]').forEach((button) => button.classList.toggle("is-on", on));
    }

    function clearNotes() {
      notes.forEach((note) => stopNote(note, true));
    }

    function createKey(note, className) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key " + className;
      button.dataset.note = note.note;
      button.dataset.focus = note.focus;
      button.setAttribute("aria-label", note.note + " " + note.fullName + " keyboard key " + note.key);
      const noteSpan = document.createElement("span");
      noteSpan.className = "note";
      noteSpan.textContent = note.note;
      const nameSpan = document.createElement("span");
      nameSpan.className = "key-label";
      nameSpan.textContent = note.fullName;
      const keySpan = document.createElement("span");
      keySpan.className = "key-label mono";
      keySpan.textContent = "key " + note.key;
      button.append(noteSpan, nameSpan, keySpan);
      return button;
    }

    function renderKeys() {
      elements.whiteRow.textContent = "";
      elements.blackRow.textContent = "";
      notes.filter((note) => note.kind === "white").forEach((note) => elements.whiteRow.appendChild(createKey(note, "white")));
      blackPattern.forEach((noteName) => {
        if (!noteName) {
          const spacer = document.createElement("div");
          spacer.className = "spacer";
          elements.blackRow.appendChild(spacer);
          return;
        }
        elements.blackRow.appendChild(createKey(noteByName.get(noteName), "black"));
      });
    }

    function focusPool() {
      const selected = elements.stackFocus.value;
      return selected === "Full PrivateNess layered stack" ? notes : notes.filter((note) => note.focus === selected);
    }

    function applyFocusOpacity() {
      const selected = elements.stackFocus.value;
      document.querySelectorAll(".key").forEach((button) => {
        const muted = selected !== "Full PrivateNess layered stack" && button.dataset.focus !== selected;
        button.style.opacity = muted ? "0.48" : "1";
      });
    }

    function playPulse(note, durationMs) {
      startNote(note, "sequence");
      window.setTimeout(() => stopNote(note, true), durationMs);
    }

    function startSequence() {
      ensureAudio();
      const step = tempoIntervalMs();
      const pool = focusPool();
      state.sequenceTimer = window.setInterval(() => {
        const first = pool[state.sequenceIndex % pool.length];
        const fifth = pool[(state.sequenceIndex + 4) % pool.length];
        playPulse(first, step * 0.72);
        if (state.sequenceIndex % 3 === 0) playPulse(fifth, step * 0.55);
        state.sequenceIndex += 1;
      }, step);
      document.getElementById("playSequence").textContent = "Stop layered sequence";
    }

    function stopSequence(resetLabel = true) {
      if (state.sequenceTimer) {
        window.clearInterval(state.sequenceTimer);
        state.sequenceTimer = null;
      }
      if (resetLabel) document.getElementById("playSequence").textContent = "Play layered sequence";
    }

    function renderBenjiButtons() {
      elements.benjiButtons.textContent = "";
      notes.forEach((note) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "benji-button";
        button.dataset.benjiNote = note.note;
        const strong = document.createElement("strong");
        strong.textContent = note.benji;
        const small = document.createElement("small");
        small.textContent = "Associated sound: " + note.note + " / " + note.fullName + ". NCH Energy is consumed locally when pressed.";
        button.append(strong, small);
        elements.benjiButtons.appendChild(button);
      });
      renderBenjiLedger();
    }

    function addLedgerItem(container, title, detail, amount) {
      const event = document.createElement("div");
      event.className = "event";
      const strong = document.createElement("strong");
      strong.textContent = title;
      const detailEl = document.createElement("span");
      detailEl.textContent = detail;
      const amountEl = document.createElement("code");
      amountEl.textContent = "NCH Energy consumed: " + formatNch(amount);
      event.append(strong, detailEl, amountEl);
      container.prepend(event);
      while (container.children.length > 30) container.lastElementChild.remove();
    }

    function renderBenjiLedger() {
      if (!elements.benjiLedger.children.length) {
        const empty = document.createElement("div");
        empty.className = "event";
        empty.textContent = "Press a Benji button to create a local sound-obfuscation event.";
        elements.benjiLedger.appendChild(empty);
      }
    }

    function pressBenji(note) {
      const amount = eventCostNch(0.8, note);
      playPulse(note, 860);
      consumeNch(amount, "Benji button sound obfuscation", note.benji);
      if (elements.benjiLedger.children.length === 1 && elements.benjiLedger.children[0].textContent.startsWith("Press a Benji")) elements.benjiLedger.textContent = "";
      addLedgerItem(elements.benjiLedger, note.benji, "Resolve and reveal concept only; this portable file never executes NVS values.", amount);
    }

    function renderModules() {
      if (!elements.modules) return;
      const mode = elements.poisonMode.value;
      elements.modules.textContent = "";
      dataPoisonerModules.forEach((module) => {
        const value = module[mode];
        const max = Math.max(module.strict, module.moderate, module.baseline, 1);
        const width = Math.min(100, Math.round((value / max) * 100));
        const card = document.createElement("div");
        card.className = "module";
        const title = document.createElement("h3");
        title.textContent = module.name;
        const detail = document.createElement("p");
        detail.className = "muted";
        detail.textContent = module.detail;
        const metric = document.createElement("code");
        metric.textContent = "current setting: " + String(value);
        const bar = document.createElement("div");
        bar.className = "bar";
        const fill = document.createElement("span");
        fill.style.width = String(width) + "%";
        bar.appendChild(fill);
        card.append(title, detail, metric, bar);
        elements.modules.appendChild(card);
      });
    }

    function renderDemoCadencePreview() {
      const mode = elements.poisonMode.value;
      const amount = eventCostNch(1, noteByName.get("A5"));
      const eventsPerMinute = Number(elements.tempo.value);
      const estimatedMinuteCost = amount * eventsPerMinute;
      consumeNch(amount, "DEMO Data Poisoner cadence preview", "No live endpoint, request, payload, suppression, or poisoning event was created.");
      const event = document.createElement("div");
      event.className = "event";
      const title = document.createElement("strong");
      title.textContent = "DEMO cadence plan only / mode " + mode;
      const boundaryEl = document.createElement("span");
      boundaryEl.textContent = "No host selected. No method selected. No payload generated. No browser extension state changed.";
      const formatEl = document.createElement("code");
      formatEl.textContent = "Repo payload format reference: " + elements.payloadFormat.value;
      const cadenceEl = document.createElement("code");
      cadenceEl.textContent = "Tempo: " + eventsPerMinute + " events per minute / interval: " + tempoIntervalMs() + " ms";
      const costEl = document.createElement("code");
      costEl.textContent = "DEMO NCH Energy estimate per event: " + formatNch(amount) + " / per minute: " + formatNch(estimatedMinuteCost);
      event.append(title, boundaryEl, formatEl, cadenceEl, costEl);
      elements.poisonLedger.prepend(event);
      while (elements.poisonLedger.children.length > 12) elements.poisonLedger.lastElementChild.remove();
      playPulse(noteByName.get("A5"), Math.min(700, tempoIntervalMs() * 0.55));
    }

    function packetProtocol(packet) {
      const layers = packet && packet._source && packet._source.layers ? packet._source.layers : {};
      if (layers.dns) return "DNS";
      if (layers.tls) return "TLS";
      if (layers.http || layers.http2) return "HTTP";
      if (layers.quic) return "QUIC";
      if (layers.tcp) return "TCP";
      if (layers.udp) return "UDP";
      if (layers.icmp || layers.icmpv6) return "ICMP";
      if (layers.ip || layers.ipv6) return "IP";
      return "FRAME";
    }

    function packetLength(packet) {
      const layers = packet && packet._source && packet._source.layers ? packet._source.layers : {};
      const frame = layers.frame || {};
      const value = frame["frame.len"] || frame["frame.cap_len"] || 0;
      return Number(Array.isArray(value) ? value[0] : value) || 0;
    }

    function packetTime(packet) {
      const layers = packet && packet._source && packet._source.layers ? packet._source.layers : {};
      const frame = layers.frame || {};
      const value = frame["frame.time_epoch"] || 0;
      return Number(Array.isArray(value) ? value[0] : value) || 0;
    }

    function layerValue(layer, key) {
      if (!layer) return "";
      const value = layer[key];
      if (Array.isArray(value)) return String(value[0] || "");
      if (value === undefined || value === null) return "";
      return String(value);
    }

    function canonicalPacketEvent(packet) {
      const layers = packet && packet._source && packet._source.layers ? packet._source.layers : {};
      const frame = layers.frame || {};
      const ip = layers.ip || {};
      const ipv6 = layers.ipv6 || {};
      const tcp = layers.tcp || {};
      const udp = layers.udp || {};
      const dns = layers.dns || {};
      const tls = layers.tls || {};
      const http = layers.http || {};
      const http2 = layers.http2 || {};
      return JSON.stringify({
        frame_number: layerValue(frame, "frame.number"),
        frame_time_epoch: layerValue(frame, "frame.time_epoch"),
        frame_len: layerValue(frame, "frame.len"),
        protocol: packetProtocol(packet),
        ip_src: layerValue(ip, "ip.src") || layerValue(ipv6, "ipv6.src"),
        ip_dst: layerValue(ip, "ip.dst") || layerValue(ipv6, "ipv6.dst"),
        tcp_srcport: layerValue(tcp, "tcp.srcport"),
        tcp_dstport: layerValue(tcp, "tcp.dstport"),
        udp_srcport: layerValue(udp, "udp.srcport"),
        udp_dstport: layerValue(udp, "udp.dstport"),
        dns_qry_name: layerValue(dns, "dns.qry.name"),
        tls_handshake_extensions_server_name: layerValue(tls, "tls.handshake.extensions_server_name"),
        http_host: layerValue(http, "http.host"),
        http2_authority: layerValue(http2, "http2.headers.authority")
      });
    }

    async function sha256Hex(text) {
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    function noteForFingerprint(fingerprint) {
      const byte = parseInt(fingerprint.slice(0, 2), 16);
      return notes[byte % notes.length];
    }

    function noteForPacket(packet, index, fingerprint) {
      if (elements.captureScale.value === "fingerprint" && fingerprint) return noteForFingerprint(fingerprint);
      const protocol = packetProtocol(packet);
      const protocolMap = {
        DNS: "G4",
        TLS: "B4",
        HTTP: "G5",
        QUIC: "C#5",
        TCP: "F4",
        UDP: "D4",
        ICMP: "D5",
        IP: "E5",
        FRAME: "C4"
      };
      if (elements.captureScale.value === "protocol") return noteByName.get(protocolMap[protocol] || "C4");
      if (elements.captureScale.value === "length") {
        const white = notes.filter((note) => note.kind === "white");
        return white[Math.min(white.length - 1, Math.floor(packetLength(packet) / 120) % white.length)];
      }
      return notes[index % notes.length];
    }

    function renderCaptureSummary(fileName) {
      elements.captureLedger.textContent = "";
      if (!state.capturePackets.length) {
        const empty = document.createElement("div");
        empty.className = "event";
        empty.textContent = "No real capture packets loaded.";
        elements.captureLedger.appendChild(empty);
        return;
      }
      const counts = new Map();
      let bytes = 0;
      state.capturePackets.forEach((packet) => {
        const protocol = packetProtocol(packet);
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
        bytes += packetLength(packet);
      });
      addLedgerItem(elements.captureLedger, "REAL capture imported", fileName + " / packets parsed: " + state.capturePackets.length + " / frame bytes: " + bytes, 0);
      state.captureEvents.slice(0, 5).forEach((event, index) => {
        addLedgerItem(elements.captureLedger, "Full deterministic event fingerprint " + String(index + 1), event.fingerprint, 0);
      });
      Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).forEach(([protocol, count]) => {
        addLedgerItem(elements.captureLedger, "Protocol " + protocol, "Packets: " + count, 0);
      });
    }

    async function importCaptureFile(file) {
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      state.capturePackets = Array.isArray(parsed) ? parsed.filter((item) => item && item._source && item._source.layers) : [];
      const playablePackets = state.capturePackets.slice(0, 512);
      state.captureEvents = await Promise.all(playablePackets.map(async (packet) => {
        const canonical = canonicalPacketEvent(packet);
        return {
          packet,
          canonical,
          fingerprint: await sha256Hex(canonical)
        };
      }));
      renderCaptureSummary(file.name);
    }

    function playImportedCapture() {
      if (!state.captureEvents.length) {
        renderCaptureSummary("no file loaded");
        return;
      }
      ensureAudio();
      const limit = Math.min(96, state.captureEvents.length);
      const firstTime = packetTime(state.captureEvents[0].packet);
      for (let index = 0; index < limit; index += 1) {
        const captureEvent = state.captureEvents[index];
        const packet = captureEvent.packet;
        const nextTime = packetTime(packet);
        const relativeMs = elements.captureScale.value === "tempo" && firstTime && nextTime ? Math.min(6000, Math.max(0, (nextTime - firstTime) * 1000)) : index * Math.min(180, tempoIntervalMs() * 0.35);
        window.setTimeout(() => {
          const note = noteForPacket(packet, index, captureEvent.fingerprint);
          playPulse(note, 130);
          const amount = Number(elements.nchPerPacket.value);
          consumeNch(amount, "DEMO NCH Energy estimate for imported capture packet", packetProtocol(packet) + " / frame length " + packetLength(packet) + " / SHA-256 event fingerprint " + captureEvent.fingerprint);
        }, relativeMs);
      }
    }

    function drawScope() {
      const canvas = elements.scope;
      const width = canvas.width;
      const height = canvas.height;
      scopeContext.clearRect(0, 0, width, height);
      scopeContext.globalAlpha = 0.22;
      scopeContext.strokeStyle = "#9fb2bd";
      scopeContext.lineWidth = 1;
      for (let x = 0; x < width; x += width / 12) {
        scopeContext.beginPath();
        scopeContext.moveTo(x, 0);
        scopeContext.lineTo(x, height);
        scopeContext.stroke();
      }
      scopeContext.beginPath();
      scopeContext.moveTo(0, height / 2);
      scopeContext.lineTo(width, height / 2);
      scopeContext.stroke();
      scopeContext.globalAlpha = 1;
      scopeContext.lineWidth = 4;
      scopeContext.strokeStyle = state.active.size ? "#45d19e" : "#78a6ff";
      scopeContext.beginPath();
      if (state.analyser && state.active.size) {
        const data = new Uint8Array(state.analyser.fftSize);
        state.analyser.getByteTimeDomainData(data);
        for (let i = 0; i < data.length; i += 1) {
          const x = (i / (data.length - 1)) * width;
          const y = (data[i] / 255) * height;
          if (i === 0) scopeContext.moveTo(x, y);
          else scopeContext.lineTo(x, y);
        }
      } else {
        const pulseAge = Math.min(1, (performance.now() - state.lastPulse) / 900);
        const amp = 12 + (1 - pulseAge) * 30;
        for (let x = 0; x <= width; x += 8) {
          const y = height / 2 + Math.sin(x / 42 + performance.now() / 430) * amp;
          if (x === 0) scopeContext.moveTo(x, y);
          else scopeContext.lineTo(x, y);
        }
      }
      scopeContext.stroke();
      window.requestAnimationFrame(drawScope);
    }

    function switchTab(name) {
      document.querySelectorAll(".tab").forEach((button) => {
        button.setAttribute("aria-selected", String(button.dataset.tab === name));
      });
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === "panel-" + name);
      });
    }

    function exportState() {
      const payload = {
        exported_at: new Date().toISOString(),
        artifact: "PrivateNess Data Poisoning Engine / Deterministic Sound Proof",
        repo_reference: "github.com/jeff-bouchard/privateness-data-poisoner",
        real_behaviors_in_this_file: [
          "WebAudio local sound synthesis as deterministic reproducibility proof",
          "Local JSON export",
          "Real tshark JSON import when the user provides a capture file",
          "Full SHA-256 deterministic event fingerprints for imported packet events"
        ],
        demo_behaviors_in_this_file: [
          "NCH Energy accounting estimate",
          "Benji-button NVS action mapping",
          "Data Poisoner cadence preview without live poisoning"
        ],
        tempo_events_per_minute: Number(elements.tempo.value),
        tempo_interval_ms: tempoIntervalMs(),
        demo_nch_energy_reserve: Number(elements.nchReserve.value),
        demo_nch_energy_consumed_total: Number(state.consumedNch.toFixed(6)),
        demo_nch_energy_remaining: Number(Math.max(0, Number(elements.nchReserve.value) - state.consumedNch).toFixed(6)),
        randpay_risk_divisor: Number(elements.risk.value),
        imported_capture_packet_count: state.capturePackets.length,
        imported_capture_fingerprints_sha256: state.captureEvents.map((event) => event.fingerprint),
        events: state.events.slice()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "privateness-piano-session.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function resetSession() {
      stopSequence();
      clearNotes();
      state.consumedNch = 0;
      state.events = [];
      elements.benjiLedger.textContent = "";
      elements.poisonLedger.textContent = "";
      renderBenjiLedger();
      renderEnergy();
    }

    function bindEvents() {
      document.querySelectorAll(".tab").forEach((button) => {
        button.addEventListener("click", () => switchTab(button.dataset.tab));
      });
      document.getElementById("startAudio").addEventListener("click", () => ensureAudio());
      document.getElementById("exportState").addEventListener("click", exportState);
      document.getElementById("resetSession").addEventListener("click", resetSession);
      elements.keybed.addEventListener("pointerdown", (event) => {
        const button = event.target.closest(".key");
        if (!button) return;
        button.setPointerCapture(event.pointerId);
        startNote(noteByName.get(button.dataset.note), "pointer");
      });
      elements.keybed.addEventListener("pointerup", (event) => {
        const button = event.target.closest(".key");
        if (!button) return;
        stopNote(noteByName.get(button.dataset.note));
      });
      elements.keybed.addEventListener("pointercancel", (event) => {
        const button = event.target.closest(".key");
        if (!button) return;
        stopNote(noteByName.get(button.dataset.note));
      });
      document.addEventListener("keydown", (event) => {
        if (event.repeat) return;
        const target = event.target;
        if (target && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
        const note = noteByKey.get(event.key.toLowerCase());
        if (!note) return;
        event.preventDefault();
        startNote(note, "keyboard");
      });
      document.addEventListener("keyup", (event) => {
        const note = noteByKey.get(event.key.toLowerCase());
        if (!note) return;
        event.preventDefault();
        stopNote(note);
      });
      document.getElementById("playSequence").addEventListener("click", () => {
        if (state.sequenceTimer) stopSequence();
        else startSequence();
      });
      document.getElementById("holdNotes").addEventListener("click", (event) => {
        state.latched = !state.latched;
        event.currentTarget.textContent = state.latched ? "Release held notes" : "Hold notes";
        if (!state.latched) clearNotes();
      });
      document.getElementById("clearNotes").addEventListener("click", clearNotes);
      elements.stackFocus.addEventListener("change", applyFocusOpacity);
      [elements.nchReserve, elements.tempo, elements.nchPerEvent, elements.risk, elements.nchPerPacket].forEach((input) => {
        input.addEventListener("input", () => {
          renderEnergy();
          if (input === elements.tempo) {
            if (state.sequenceTimer) {
              stopSequence(false);
              startSequence();
            }
          }
        });
      });
      elements.poisonMode.addEventListener("change", renderModules);
      elements.benjiButtons.addEventListener("click", (event) => {
        const button = event.target.closest("[data-benji-note]");
        if (!button) return;
        pressBenji(noteByName.get(button.dataset.benjiNote));
      });
      document.getElementById("previewPoisonCadence").addEventListener("click", renderDemoCadencePreview);
      document.getElementById("clearPoisonEvents").addEventListener("click", () => {
        elements.poisonLedger.textContent = "";
      });
      elements.captureFile.addEventListener("change", (event) => {
        importCaptureFile(event.target.files && event.target.files[0]).catch((error) => {
          elements.captureLedger.textContent = "";
          addLedgerItem(elements.captureLedger, "Capture import failed", error.message, 0);
        });
      });
      document.getElementById("playCapture").addEventListener("click", playImportedCapture);
    }

    renderKeys();
    renderBenjiButtons();
    renderModules();
    renderEnergy();
    renderCaptureSummary("no file loaded");
    applyFocusOpacity();
    bindEvents();
    drawScope();
  
