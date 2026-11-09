(() => {
  'use strict';
  const page = document.querySelector('[data-music-page]');
  if (!page) return;
  const dialog = document.getElementById('music-warning-dialog');
  let pending = null;
  let warningAcknowledged = false;
  let warningTrigger = null;
  let restoreWarningFocus = true;
  const playerFrames = new Map([...page.querySelectorAll('[data-music-player]')].map(frame => [frame.dataset.musicPlayer, frame]));
  const originalFrames = new Map([...playerFrames].map(([orientation, frame]) => [orientation, frame.innerHTML]));

  function status(orientation, text) {
    page.querySelector(`[data-music-status="${orientation}"]`).textContent = text;
  }
  function closePlayer(orientation) {
    const frame = playerFrames.get(orientation);
    frame.querySelectorAll('video').forEach(video => video.pause());
    frame.innerHTML = originalFrames.get(orientation);
    status(orientation, 'The player is closed. Choose a playlist or song to load it.');
  }
  function stopOtherPlayer(orientation) {
    for (const other of playerFrames.keys()) if (other !== orientation) closePlayer(other);
  }
  function requestLoad(action, needsWarning, trigger) {
    if (!needsWarning || warningAcknowledged) { action(); return; }
    pending = action;
    warningTrigger = trigger;
    restoreWarningFocus = true;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (window.confirm('Severe language: Don’t Try to Fix Me is an angry song about big tech and contains frequent strong language. Continue?')) {
      warningAcknowledged = true;
      pending = null;
      action();
    } else pending = null;
  }
  function loadYouTube(orientation, id, playlist, title) {
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(id)) { status(orientation, 'This video reference is unavailable. Use the source catalogue link.'); return; }
    stopOtherPlayer(orientation);
    const frame = playerFrames.get(orientation);
    frame.querySelectorAll('video').forEach(video => video.pause());
    const iframe = document.createElement('iframe');
    const query = new URLSearchParams({autoplay:'0', playsinline:'1', rel:'0'});
    if (playlist) query.set('list', id);
    iframe.src = `https://www.youtube-nocookie.com/embed/${playlist ? 'videoseries' : encodeURIComponent(id)}?${query}`;
    iframe.title = title;
    iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
    status(orientation, `${title} loaded. Press play in the player to listen.`);
    frame.scrollIntoView({block:'center', behavior:'auto'});
    iframe.focus({preventScroll:true});
  }
  function trustedMediaUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'auraofintelligence.github.io' ? url.href : null; }
    catch { return null; }
  }
  function loadPortrait(videoValue, posterValue, title) {
    const videoUrl = trustedMediaUrl(videoValue);
    if (!videoUrl) { status('portrait', 'This portrait video reference is unavailable. Use the source catalogue link.'); return; }
    stopOtherPlayer('portrait');
    const frame = playerFrames.get('portrait');
    frame.querySelectorAll('video').forEach(video => video.pause());
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.src = videoUrl;
    const poster = trustedMediaUrl(posterValue);
    if (poster) video.poster = poster;
    video.setAttribute('aria-label', `${title}, portrait lyric video`);
    video.append('Your browser cannot display this video. Use the artist catalogue link.');
    frame.replaceChildren(video);
    status('portrait', `${title} loaded. Press play in the player to listen.`);
    frame.scrollIntoView({block:'center', behavior:'auto'});
    video.focus({preventScroll:true});
  }

  page.addEventListener('click', event => {
    const playlistButton = event.target.closest('[data-music-playlist]');
    if (playlistButton) {
      const orientation = playlistButton.dataset.musicPlaylist;
      requestLoad(() => loadYouTube(orientation, playlistButton.dataset.playlistId, true, `A Protopian Gambit ${orientation} playlist`), true, playlistButton);
      return;
    }
    const trackButton = event.target.closest('[data-music-track]');
    if (trackButton) {
      const action = trackButton.dataset.musicTrack === 'landscape'
        ? () => loadYouTube('landscape', trackButton.dataset.videoId, false, `${trackButton.dataset.trackTitle}, landscape lyric video`)
        : () => loadPortrait(trackButton.dataset.videoUrl, trackButton.dataset.posterUrl, trackButton.dataset.trackTitle);
      requestLoad(action, trackButton.dataset.severeLanguage === 'true', trackButton);
      return;
    }
    const stopButton = event.target.closest('[data-music-stop]');
    if (stopButton) { closePlayer(stopButton.dataset.musicStop); return; }
    const sheetButton = event.target.closest('[data-music-sheet]');
    if (sheetButton) requestLoad(() => {
      const template = document.getElementById('music-sheet-template');
      const container = page.querySelector('[data-music-pdf]');
      container.replaceChildren(template.content.cloneNode(true));
      sheetButton.textContent = 'Lyric sheet displayed';
      container.scrollIntoView({block:'start', behavior:'auto'});
      container.querySelector('#music-sheet-reader-title').focus({preventScroll:true});
    }, true, sheetButton);
  });
  dialog.querySelector('[data-music-warning-continue]').addEventListener('click', () => {
    warningAcknowledged = true;
    const action = pending;
    pending = null;
    restoreWarningFocus = false;
    dialog.close();
    if (action) action();
  });
  dialog.querySelector('[data-music-warning-cancel]').addEventListener('click', () => { pending = null; dialog.close(); });
  dialog.addEventListener('cancel', () => { pending = null; });
  dialog.addEventListener('close', () => { if (restoreWarningFocus && warningTrigger) warningTrigger.focus({preventScroll:true}); });
})();
