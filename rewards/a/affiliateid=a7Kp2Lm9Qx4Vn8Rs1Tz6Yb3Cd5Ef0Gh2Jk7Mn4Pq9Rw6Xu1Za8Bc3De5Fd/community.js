(() => {
  const center = document.querySelector('.giveaway-with-footer');
  if (!center) return;
  const wording = { ...{"feedTitle":"Live feed","chatTitle":"Live chat","demoBadge":"DEMO","panelCaption":"Test participants · simulated activity, no payouts","winnerText":"Simulated win · ${amount}","chatNameSuffix":" (test): ","chatPreview":"Chat preview · messages are simulated","pauseActivity":"Pause activity","resumeActivity":"Resume activity","countdownTitle":"EVENT ENDS IN","previewTimer":"Preview timer · event date to be confirmed","eventDeadline":"Event deadline","eventEnded":"Event ended"}, ...window.communityText };
  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
  const layout = document.createElement('div');
  layout.className = 'community-layout';
  center.before(layout);
  // Local SVG interface icons, independent of an external library.
  const icon = name => {
    const shapes = {
      gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H8.5A3.5 3.5 0 1 1 12 4.5V8Zm0 0h3.5A3.5 3.5 0 1 0 12 4.5V8Z"/>',
      chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M7 9h9M7 13h6"/>',
      lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
    };
    return '<svg class="community-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + shapes[name] + '</svg>';
  };
  const panel = (title, body) => {
    const el = document.createElement('aside');
    el.className = 'community-panel';
    el.innerHTML = '<header><h2>' + title + '</h2><span class="demo-badge">' + escapeText(wording.demoBadge) + '</span></header><p class="community-caption">' + escapeText(wording.panelCaption) + '</p>' + body;
    return el;
  };
  const feed = panel(icon('gift') + escapeText(wording.feedTitle), '<div class="winner-list"></div>');
  const chat = panel(icon('chat') + escapeText(wording.chatTitle), '<div class="chat-list"></div><div class="chat-locked">' + icon('lock') + escapeText(wording.chatPreview) + '</div>');
  layout.append(feed, center, chat);
  const controls = document.createElement('button');
  controls.className = 'activity-toggle';
  controls.textContent = wording.pauseActivity;
  controls.type = 'button';
  let paused = false;
  controls.setAttribute('aria-pressed', 'false');
  controls.onclick = () => {
    paused = !paused;
    controls.textContent = paused ? wording.resumeActivity : wording.pauseActivity;
    controls.setAttribute('aria-pressed', String(paused));
    saveActivity();
  };
  chat.append(controls);

  const countdown = document.createElement('div');
  countdown.className = 'event-countdown';
  countdown.innerHTML = icon('clock') + '<div><strong>' + escapeText(wording.countdownTitle) + '</strong><time></time><small></small></div>';
  const wheelPanel = center.querySelector('.wheel-stage').parentElement;
  wheelPanel.classList.add('countdown-anchor');
  wheelPanel.append(countdown);
  // A looping demonstration, not an event deadline.
  const demoStorageKey = 'giveaway-demo-timer-v1:' + location.pathname;
  let demoState;
  try {
    demoState = JSON.parse(localStorage.getItem(demoStorageKey));
  } catch { /* Storage may be unavailable; use an in-memory preview. */ }
  if (!demoState || !Number.isSafeInteger(demoState.startedAt) || demoState.startedAt <= 0 ||
      !Number.isInteger(demoState.cycleSeconds) || demoState.cycleSeconds < 32400 || demoState.cycleSeconds >= 36000) {
    demoState = {
      startedAt: Date.now(),
      cycleSeconds: 9 * 3600 + Math.floor(Math.random() * 60) * 60 + Math.floor(Math.random() * 60)
    };
    try { localStorage.setItem(demoStorageKey, JSON.stringify(demoState)); }
    catch { /* Continue the demo even if storage is blocked. */ }
  }
  const demoStartedAt = demoState.startedAt;
  const demoCycleSeconds = demoState.cycleSeconds;
  countdown.querySelector('strong').textContent = wording.countdownTitle;
  countdown.querySelector('small').textContent = wording.previewTimer;
  const tick = () => {
    const elapsed = Math.max(0, Math.floor((Date.now() - demoStartedAt) / 1000));
    const seconds = 2 * 86400 + demoCycleSeconds - (elapsed % demoCycleSeconds);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
    countdown.querySelector('time').textContent = seconds ? values.map((n, i) => String(n).padStart(2, '0') + ['d', 'h', 'm', 's'][i]).join(' ') : wording.eventEnded;
  };
  tick();
  setInterval(tick, 1000);
  // User-supplied profiles: permission reported for the labelled test preview.
  const screenshotProfiles = [["ali","a",38],["babyjiggler1","a",72],["owin","a",105],["Donkeh","a",139],["Froggo","a",173],["Hazel <3","a",208],["LunarMoon","a",278],["pRotoxii","a",312],["Smefay Smefay","a",347],["Chaos (MOO)","b",70],["Dee PromptDervish","b",104],["Ember","b",139],["Enid Pinxit","b",174],["Eru","b",208],["fabian","b",243],["FailedStudent","b",277],["Fox","b",312],["Historian","b",346],["Hoxxonia","b",381],["joonbug","b",413],["K.I.ki","b",447],["Lisa","b",482],["Llama Floof","b",516],["Matt","b",551],["mx. curio","b",619],["nat","b",653],["noodlecake EU","b",687],["Roc","b",753],["rubberduckyturthel","b",786],["SamL","b",820],["Sloodz","b",889],["TueDank","b",923],["Dragon7108","b",957]];
  const importedProfiles = Array.isArray(window.discordTestProfiles) ? window.discordTestProfiles.filter(profile => {
    if (!profile || typeof profile.username !== 'string') return false;
    try { const url = new URL(profile.avatarUrl); return url.protocol === 'https:' && url.hostname === 'cdn.discordapp.com'; }
    catch { return false; }
  }) : [];
  const profiles = importedProfiles.length ? importedProfiles.map(profile => [profile.username, profile.avatarUrl, -1]) : screenshotProfiles;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const username = () => pick(profiles)[0];
  const winnerNames = [...new Set(profiles.map(profile => profile[0]))];
  let winnerCycle = [];
  const recentWinners = [];
  const nextWinner = () => {
    if (!winnerCycle.length) {
      winnerCycle = [...winnerNames];
      for (let i = winnerCycle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [winnerCycle[i], winnerCycle[j]] = [winnerCycle[j], winnerCycle[i]];
      }
    }
    const eligible = winnerCycle.findIndex(name => !recentWinners.includes(name));
    const name = winnerCycle.splice(eligible < 0 ? 0 : eligible, 1)[0];
    recentWinners.push(name);
    if (recentWinners.length > Math.min(10, winnerNames.length - 1)) recentWinners.shift();
    return name;
  };
  const makeAvatar = name => {
    const avatar = document.createElement('span');
    avatar.className = 'winner-avatar participant-avatar';
    const profile = profiles.find(profile => profile[0] === name);
    if (profile[2] === -1) {
      avatar.className = 'winner-avatar imported-avatar';
      const image = document.createElement('img');
      image.src = profile[1];
      image.alt = '';
      image.referrerPolicy = 'no-referrer';
      image.onerror = () => { image.remove(); avatar.textContent = name.slice(0, 2).toUpperCase(); };
      avatar.append(image);
      avatar.setAttribute('aria-hidden', 'true');
      return avatar;
    }
    const left = profile[1] === 'a' ? 3 : 10;
    avatar.style.backgroundImage = 'url("./assets/test-participants-' + profile[1] + '.png")';
    avatar.style.backgroundPosition = '-' + left + 'px -' + (profile[2] - 12) + 'px';
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  };
  const colors = {5:'#ff8795',10:'#f3ae7a',15:'#edcb7d',20:'#e2d984',30:'#b1db89',40:'#81ddb0',50:'#55e6a5'};
  const chatColors = ['#9eafff', '#e5a2ec', '#6cd9dd', '#ffd28c', '#b5e297', '#ffa0af'];
  const weighted = [5,10,10,10,15,15,15,20,20,20,20,30,30,30,40,50];
  const fallbackMessages = ['The $20 prize would make my day 🎉', 'Good luck everyone!', 'Those $50 rewards look amazing 👀', 'What would you pick with $30?', 'A little $10 treat sounds perfect', 'Love the purple wheel 💜', 'Crossing my fingers for $40!', 'Celebrating with the whole server 🎈', '$15 would go straight into game night', 'Team $50 🙌'];
  const messages = Array.isArray(window.testChatMessages) && window.testChatMessages.length ? window.testChatMessages.filter(message => typeof message === 'string' && message.trim()) : fallbackMessages;
  const winners = feed.querySelector('.winner-list');
  const lines = chat.querySelector('.chat-list');
  const activityKey = 'giveaway-demo-activity-v1:' + location.pathname;
  let feedEntries = [], chatEntries = [];
  function saveActivity() {
    try { localStorage.setItem(activityKey, JSON.stringify({version:1, feed:feedEntries, chat:chatEntries, cycle:winnerCycle, recent:recentWinners, roster:winnerNames, paused})); }
    catch { /* Keep working when browser storage is unavailable. */ }
  }
  function restoreActivity() {
    try {
      const saved = JSON.parse(localStorage.getItem(activityKey));
      if (!saved || saved.version !== 1 || !Array.isArray(saved.feed) || !Array.isArray(saved.chat)) return false;
      const known = new Set(winnerNames);
      const validFeed = saved.feed.filter(e => e && known.has(e.name) && Object.hasOwn(colors,e.amount)).slice(0,6);
      const validChat = saved.chat.filter(e => e && known.has(e.handle) && typeof e.text === 'string' && e.text.length <= 2000 && chatColors.includes(e.color)).slice(-10);
      if (!validFeed.length || !validChat.length) return false;
      if (Array.isArray(saved.roster) && JSON.stringify(saved.roster) === JSON.stringify(winnerNames) && Array.isArray(saved.cycle)) {
        winnerCycle = [...new Set(saved.cycle.filter(name => known.has(name)))];
      }
      if (Array.isArray(saved.recent)) recentWinners.push(...saved.recent.filter(name => known.has(name)).slice(-Math.min(10,winnerNames.length-1)));
      paused = saved.paused === true;
      controls.textContent = paused ? wording.resumeActivity : wording.pauseActivity;
      controls.setAttribute('aria-pressed',String(paused));
      [...validFeed].reverse().forEach(e => addWinner(e.amount, false, e));
      validChat.forEach(e => addMessage(e));
      return true;
    } catch { return false; }
  }
  window.addEventListener('pagehide',saveActivity);
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const burst = document.createElement('div');
    burst.className = 'feed-confetti';
    for (let i = 0; i < 32; i++) {
      const piece = document.createElement('i');
      piece.style.cssText = 'left:' + Math.random() * 100 + '%;background:' + pick(chatColors) + ';animation-delay:' + Math.random() * .35 + 's;--drift:' + (Math.random() * 100 - 50) + 'px';
      burst.append(piece);
    }
    feed.append(burst);
    setTimeout(() => burst.remove(), 2400);
  }
  function addWinner(amount = pick(weighted), animate = true, restored = null) {
    const name = restored ? restored.name : nextWinner();
    const row = document.createElement('div');
    row.className = 'winner-row';
    row.style.setProperty('--prize-color', colors[amount]);
    const avatar = makeAvatar(name);
    const text = document.createElement('div');
    const label = document.createElement('strong');
    label.textContent = name;
    label.title = name;
    const detail = document.createElement('p');
    detail.textContent = String(wording.winnerText).replaceAll('{amount}', String(amount));
    text.append(label, detail);
    const badge = document.createElement('span');
    badge.className = 'prize-badge';
    badge.textContent = '$' + amount;
    row.append(avatar, text, badge);
    winners.prepend(row);
    while (winners.children.length > 6) winners.lastElementChild.remove();
    feedEntries.unshift({name,amount});
    feedEntries = feedEntries.slice(0,6);
    if (!restored) saveActivity();
    if (amount === 50 && animate) confetti();
  }
  function addMessage(restored = null) {
    const line = document.createElement('p');
    const name = document.createElement('strong');
    const entry = restored || {handle:username(),text:pick(messages),color:pick(chatColors)};
    name.style.color = entry.color;
    const handle = entry.handle;
    name.textContent = handle;
    name.title = handle;
    const message = document.createElement('span');
    message.append(name, document.createTextNode(wording.chatNameSuffix + entry.text));
    line.append(makeAvatar(handle), message);
    lines.append(line);
    while (lines.children.length > 10) lines.firstElementChild.remove();
    lines.scrollTop = lines.scrollHeight;
    chatEntries.push(entry);
    chatEntries = chatEntries.slice(-10);
    if (!restored) saveActivity();
  }
  if (!restoreActivity()) {
    [10,30,5,20,15,50].forEach(amount => addWinner(amount, false));
    confetti();
    for (let i = 0; i < 9; i++) addMessage();
  }
  saveActivity();
  setInterval(() => { if (!paused && !document.hidden) addWinner(); }, 1000);
  setInterval(() => { if (!paused && !document.hidden) addMessage(); }, 400);
})();
