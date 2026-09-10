(() => {
  const wheel = document.getElementById('prize-wheel');
  const result = document.getElementById('wheel-result');
  const claim = document.getElementById('claim-reward');
  const card = document.querySelector('.giveaway-card');
  const notice = document.querySelector('.independent-note');
  if (card && notice) {
    const wrapper = document.createElement('div');
    wrapper.className = 'giveaway-with-footer';
    card.before(wrapper);
    wrapper.append(card);
    document.body.append(notice);
    notice.className = 'giveaway-footer';
    const demoNote = document.createElement('p');
    demoNote.className = 'demo-claim-note';
    demoNote.textContent = '';
    claim.after(demoNote);
  }
  let audio;
  const unlockAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      audio ||= new AudioContext();
      if (audio.state !== 'running') return audio.resume().catch(() => {});
    } catch { /* Continue silently if audio is unavailable. */ }
  };
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  unlockAudio();
  const confettiSound = () => {
    if (audio?.state !== 'running' || document.hidden) return;
    const duration = 0.55;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    let softened = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / audio.sampleRate;
      const noise = Math.random() * 2 - 1;
      softened = softened * 0.7 + noise * 0.3;
      // Quick air pop, followed by fluttering paper settling.
      const pop = Math.exp(-t / 0.022) * 0.7;
      const flutter = (0.55 + 0.45 * Math.sin(t * 83) * Math.sin(t * 137));
      const rustle = (1 - Math.exp(-t / 0.015)) * Math.exp(-t / 0.12) * flutter * 0.12;
      const fade = Math.min(1, (duration - t) / 0.1);
      samples[i] = (softened * pop + noise * rustle) * fade;
    }
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.85;
    source.connect(gain).connect(audio.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  };
  const successSound = () => {
    if (audio?.state !== 'running' || document.hidden) return;
    const bus = audio.createDynamicsCompressor();
    bus.threshold.value = -16;
    bus.knee.value = 12;
    bus.ratio.value = 4;
    bus.attack.value = 0.003;
    bus.release.value = 0.18;
    const master = audio.createGain();
    master.gain.value = 0.85;
    bus.connect(master).connect(audio.destination);
    let active = 0;
    const note = (frequency, delay, duration, volume, type = 'triangle') => {
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.012);
      gain.gain.setValueAtTime(volume * 0.7, start + duration * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(bus);
      active++;
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        if (--active === 0) { bus.disconnect(); master.disconnect(); }
      };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };
    // Compact reward cue: warm impact and a clean two-note resolution.
    note(130.81, 0, 0.22, 0.16, 'sine');
    note(523.25, 0.025, 0.36, 0.13, 'sine');
    note(1046.5, 0.025, 0.18, 0.022, 'sine');
    note(783.99, 0.14, 0.52, 0.14, 'sine');
    note(1567.98, 0.14, 0.28, 0.018, 'sine');
  };
  let clickBuffer;
  const wheelClick = () => {
    if (audio?.state !== 'running' || document.hidden) return;
    if (!clickBuffer) {
      // A dry noise impulse gives a mechanical tick without a musical pitch.
      const length = Math.ceil(audio.sampleRate * 0.018);
      clickBuffer = audio.createBuffer(1, length, audio.sampleRate);
      const samples = clickBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.0025));
      }
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = clickBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 650;
    gain.gain.value = 0.32;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
  };
  const verification = document.createElement('dialog');
  verification.className = 'verification-dialog';
  verification.setAttribute('aria-labelledby', 'verification-title');
  verification.innerHTML = `
    <img class="verification-art" src="./assets/human-check.svg" alt="">
    <h2 id="verification-title">Wait! Are you human?</h2>
    <p>Please confirm you're not a robot.</p>
    <button class="captcha-check" type="button"><span class="captcha-box" aria-hidden="true"></span><span>I'm not a robot</span></button>
    <p class="captcha-error" role="status" aria-live="polite"></p>
    <p class="verification-note">Demo verification — this check is designed to fail every time.</p>
    <iframe class="captcha-content" title="Cute cats" hidden></iframe>`;
  document.body.append(verification);
  const verificationText = {
    note: 'Demo verification — this check is designed to fail every time.',
    checking: 'Simulating verification…',
    ...window.verificationText
  };
  verification.querySelector('.verification-note').textContent = verificationText.note;
  const check = verification.querySelector('.captcha-check');
  const error = verification.querySelector('.captcha-error');
  const content = verification.querySelector('.captcha-content');
  const resetContent = () => {
    verification.classList.remove('showing-content');
    verification.setAttribute('aria-labelledby', 'verification-title');
    verification.removeAttribute('aria-label');
    content.hidden = true;
    content.removeAttribute('src');
  };
  let verificationTimer;
  let revealTimers = [];
  verification.addEventListener('close', () => {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    delete verification.dataset.phase;
    clearTimeout(verificationTimer);
    resetContent();
    check.disabled = false;
    check.classList.remove('loading');
    check.removeAttribute('aria-busy');
  });
  check.addEventListener('click', () => {
    if (check.disabled) return;
    resetContent();
    check.classList.remove('failed');
    check.classList.add('loading');
    check.disabled = true;
    check.setAttribute('aria-busy', 'true');
    check.setAttribute('aria-describedby', 'captcha-error');
    error.id = 'captcha-error';
    error.textContent = verificationText.checking;
    verificationTimer = setTimeout(() => {
      check.classList.remove('loading');
      check.classList.add('failed');
      check.disabled = false;
      check.removeAttribute('aria-busy');
      error.textContent = 'Demo verification finished.';
      content.src = './captcha-content.html';
      content.hidden = false;
      verification.classList.add('showing-content');
      verification.removeAttribute('aria-labelledby');
      verification.setAttribute('aria-label', 'Cute cats');
      content.focus();
    }, 1800);
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const celebrate = () => {
    confettiSound();
    successSound();
    if (reducedMotion.matches) return;
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    const bounds = wheel.getBoundingClientRect();
    const palette = ['#5865F2', '#8B9DEC', '#DCDCDD', '#b9a4ff', '#ffd88a'];
    const animations = Array.from({ length: 72 }, (_, i) => {
      const piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.style.background = palette[i % palette.length];
      piece.style.left = `${bounds.left + bounds.width / 2}px`;
      piece.style.top = `${bounds.top + bounds.height / 2}px`;
      piece.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
      layer.append(piece);
      const x = (Math.random() - 0.5) * Math.min(window.innerWidth, 850);
      const rise = 90 + Math.random() * 240;
      const rotation = (Math.random() - 0.5) * 1000;
      const animation = piece.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${x * .55}px,${-rise}px) rotate(${rotation * .4}deg)`, opacity: 1, offset: .3 },
        { transform: `translate(${x}px,${window.innerHeight * .65}px) rotate(${rotation}deg)`, opacity: 0 }
      ], { duration: 2000 + Math.random() * 1000, delay: Math.random() * 180, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' });
      return animation.finished;
    });
    Promise.allSettled(animations).then(() => layer.remove());
  };
  claim.addEventListener('click', () => {
    error.textContent = '';
    check.classList.remove('failed');
    check.removeAttribute('aria-describedby');
    verification.dataset.phase = 'dark';
    verification.showModal();
    revealTimers = [
      setTimeout(() => { verification.dataset.phase = 'intro'; }, 500),
      setTimeout(() => {
        delete verification.dataset.phase;
        check.focus({ preventScroll: true });
      }, 1500)
    ];
  });
  const amounts = [5, 10, 15, 20, 30, 40, 50];
  const colors = ['#5865f2', '#8174dc', '#4752c4', '#7369d8', '#6e61cf', '#424caa', '#9581e8'];
  const ns = 'http://www.w3.org/2000/svg';
  const step = 360 / amounts.length;
  const point = (angle, radius) => [160 + radius * Math.sin(angle * Math.PI / 180), 160 - radius * Math.cos(angle * Math.PI / 180)];
  amounts.forEach((amount, i) => {
    const start = point(i * step, 151);
    const end = point((i + 1) * step, 151);
    const wedge = document.createElementNS(ns, 'path');
    wedge.setAttribute('d', `M160 160 L${start} A151 151 0 0 1 ${end} Z`);
    wedge.setAttribute('fill', colors[i]);
    wedge.setAttribute('stroke', '#ffffff55');
    wedge.setAttribute('stroke-width', '2');
    wheel.append(wedge);
    const label = document.createElementNS(ns, 'text');
    const pos = point((i + 0.5) * step, 109);
    label.setAttribute('transform', `rotate(${(i + 0.5) * step} ${pos[0]} ${pos[1]})`);
    label.setAttribute('x', pos[0]);
    label.setAttribute('y', pos[1]);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', '#DCDCDD');
    label.setAttribute('font-size', '22');
    label.setAttribute('font-family', 'gg sans, sans-serif');
    label.setAttribute('font-weight', '700');
    label.textContent = `$${amount}`;
    wheel.append(label);
  });
  // The middle of the $20 slice starts at 180 degrees; rotate it to the top pointer.
  const finish = 360 * 6 - (amounts.indexOf(20) + 0.5) * step;
  const reveal = () => {
    claim.disabled = false;
    claim.textContent = 'Claim $20 reward';
    claim.classList.add('claim-ready');
    celebrate();
    result.textContent = '';
    result.classList.add('complete');
  };
  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'claim-button';
  startButton.textContent = 'Spin the wheel';
  claim.before(startButton);
  claim.hidden = true;
  result.textContent = '';
  startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    await unlockAudio();
    startButton.remove();
    claim.hidden = false;
    result.textContent = '';
  if (reducedMotion.matches) {
    wheel.style.transform = `rotate(${finish}deg)`;
    reveal();
  } else {
    const spin = wheel.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${finish}deg)` }], {
      duration: 4600, easing: 'cubic-bezier(0.12, 0.65, 0.12, 1)', fill: 'forwards'
    });
    spin.onfinish = reveal;
    let previousSlice = 0;
    const tick = () => {
      const progress = spin.effect.getComputedTiming().progress || 0;
      const slice = Math.floor(progress * finish / step);
      if (slice > previousSlice) wheelClick();
      previousSlice = slice;
      if (spin.playState === 'running') requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  }, { once: true });
})();




















