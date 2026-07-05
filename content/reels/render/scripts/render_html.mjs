// Builds the self-contained scene HTML for one reel: a vertical (1080x1920)
// kinetic-typography + screenshot timeline whose scene durations are driven
// by the exact length of each pre-generated narration clip (injected by
// build_all.mjs as beat.dur, in seconds), so video and voiceover always land
// in sync regardless of how fast/slow the TTS reads a given line.

export function renderReelHtml(reel, brand) {
  const scenes = reel.beats.map((b, i) => ({
    i,
    dur: b.dur,
    caption: b.caption,
    visual: b.visual
  }));

  const sceneNodes = scenes.map((s) => sceneHtml(s)).join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root{
    --cream:${brand.cream}; --black:${brand.black}; --green:${brand.green};
    --green-deep:${brand.greenDeep}; --t2:${brand.t2};
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:1080px;height:1920px;overflow:hidden;background:var(--black);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
  .stage{position:relative;width:1080px;height:1920px;overflow:hidden;}
  .scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    opacity:0;transition:opacity .35s ease;}
  .scene.active{opacity:1;}
  .scene.bg-black{background:var(--black);color:#F4F1EA;}
  .scene.bg-cream{background:var(--cream);color:#15150F;}
  .scene.bg-green{background:linear-gradient(160deg,var(--green-deep),#123f2e 70%);color:#F4F1EA;}

  .headline{font-size:92px;font-weight:800;letter-spacing:-2px;line-height:1.08;
    text-align:center;padding:0 80px;white-space:pre-line;}
  .sub{margin-top:28px;font-size:40px;font-weight:600;opacity:.8;text-align:center;padding:0 90px;}
  .accent-line{width:110px;height:8px;border-radius:99px;background:var(--green);margin:0 auto 40px;}
  .bg-cream .accent-line{background:var(--green-deep);}

  .shotwrap{display:flex;flex-direction:column;align-items:center;justify-content:center;
    width:100%;height:100%;background:var(--cream);}
  .chip{background:var(--black);color:var(--cream);font-size:26px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;padding:14px 26px;border-radius:999px;margin-bottom:26px;}
  .frame{width:940px;border-radius:20px;overflow:hidden;background:#fff;
    box-shadow:0 30px 80px rgba(10,10,8,.25);border:2px solid rgba(10,10,8,.08);position:relative;}
  .chrome{height:40px;background:#EDEAE0;display:flex;align-items:center;gap:8px;padding:0 18px;}
  .chrome i{width:12px;height:12px;border-radius:50%;background:#D8D3C2;display:block;}
  .frame .shotimg-wrap{width:100%;aspect-ratio:1600/1000;overflow:hidden;position:relative;}
  .frame img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:top center;
    animation-name:kenburns;animation-timing-function:linear;animation-fill-mode:forwards;transform-origin:top center;}
  @keyframes kenburns{ from{transform:scale(1.0) translateY(0);} to{transform:scale(1.055) translateY(-1%);} }

  .brandtag{position:absolute;top:56px;left:56px;display:flex;align-items:center;gap:14px;z-index:5;
    background:rgba(10,10,8,.55);backdrop-filter:blur(6px);padding:14px 24px 14px 18px;border-radius:999px;}
  .brandtag .dot{width:16px;height:16px;border-radius:50%;background:var(--green);}
  .brandtag span{font-size:28px;font-weight:800;letter-spacing:-.5px;color:#F4F1EA;}

  /* ——— STAT (before/after reveal) ——— */
  .statwrap{display:flex;flex-direction:column;align-items:center;gap:26px;}
  .statcard{width:820px;border-radius:24px;padding:38px 44px;text-align:center;}
  .statcard.before{background:rgba(244,241,234,.06);border:2px solid rgba(244,241,234,.18);}
  .statcard.after{background:rgba(78,155,120,.14);border:2px solid var(--green);}
  .statlbl{font-size:28px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.6;margin-bottom:14px;}
  .statval{font-size:88px;font-weight:800;letter-spacing:-2px;font-family:'IBM Plex Mono',monospace,-apple-system;}
  .statcard.after .statval{color:var(--green);}
  .statarrow{font-size:56px;color:var(--green);}

  /* ——— CHAT (DM mockup) ——— */
  .chatouter{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--black);}
  .phonecard{width:860px;border-radius:32px;background:#0F1410;border:2px solid rgba(244,241,234,.12);
    padding:40px 36px;box-shadow:0 30px 90px rgba(0,0,0,.5);}
  .phonehd{font-size:24px;font-weight:700;color:rgba(244,241,234,.4);text-transform:uppercase;letter-spacing:2px;
    margin-bottom:26px;text-align:center;}
  .bubblerow{display:flex;margin-bottom:20px;}
  .bubblerow.out{justify-content:flex-end;}
  .bubblerow.in{justify-content:flex-start;}
  .bubble{max-width:640px;padding:22px 28px;border-radius:26px;font-size:34px;line-height:1.4;font-weight:600;}
  .bubblerow.out .bubble{background:var(--green-deep);color:#F4F1EA;border-bottom-right-radius:6px;}
  .bubblerow.in .bubble{background:rgba(244,241,234,.1);color:#F4F1EA;border-bottom-left-radius:6px;}
  .bubblerow.latest .bubble{animation:popin .35s cubic-bezier(.16,1,.3,1);}
  @keyframes popin{from{opacity:0;transform:scale(.85) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}

  /* ——— QUOTE (personal story) ——— */
  .quotewrap{max-width:900px;padding:0 70px;text-align:center;position:relative;}
  .quotemark{font-family:Georgia,'Times New Roman',serif;font-size:220px;line-height:1;color:var(--green);
    opacity:.28;position:absolute;top:-70px;left:50%;transform:translateX(-50%);}
  .quotetext{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:62px;line-height:1.32;
    font-weight:600;position:relative;z-index:1;}
  .quotetag{margin-top:30px;font-size:28px;font-weight:700;letter-spacing:1px;opacity:.55;
    text-transform:uppercase;font-family:-apple-system,sans-serif;font-style:normal;}

  /* ——— NUMBERED (countdown 1-7) ——— */
  .numwrap{display:flex;flex-direction:column;align-items:center;gap:34px;}
  .numbadge{width:190px;height:190px;border-radius:50%;background:rgba(78,155,120,.14);border:3px solid var(--green);
    display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace,-apple-system;
    font-size:84px;font-weight:800;color:var(--green);}
  .bg-black .numbadge, .bg-green .numbadge{color:#F4F1EA;background:rgba(244,241,234,.1);border-color:rgba(244,241,234,.35);}
  .numdots{display:flex;gap:12px;margin-top:10px;}
  .numdot{width:16px;height:16px;border-radius:50%;background:rgba(244,241,234,.18);}
  .bg-cream .numdot{background:rgba(21,21,15,.14);}
  .numdot.on{background:var(--green);}

  /* ——— CHECKLIST (offer breakdown) ——— */
  .checkwrap{width:880px;}
  .checkrow{display:flex;align-items:flex-start;gap:22px;padding:18px 0;border-bottom:1px solid rgba(21,21,15,.1);}
  .checkrow:last-child{border-bottom:none;}
  .checkmk{width:44px;height:44px;border-radius:50%;background:var(--green-deep);color:#F4F1EA;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;margin-top:2px;}
  .checktxt{font-size:36px;font-weight:700;line-height:1.3;}
  .checkrow.latest{animation:popin .3s cubic-bezier(.16,1,.3,1);}
  .pricetag{margin-top:28px;text-align:center;font-family:'IBM Plex Mono',monospace,-apple-system;
    font-size:52px;font-weight:800;color:var(--green-deep);}

  /* ——— COMPARE (myth vs reality, top/bottom split) ——— */
  .comparewrap{width:100%;height:100%;display:flex;flex-direction:column;}
  .comparehalf{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;text-align:center;}
  .comparehalf.top{background:rgba(163,67,47,.1);}
  .comparehalf.bottom{background:rgba(78,155,120,.14);}
  .comparelbl{font-size:26px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;}
  .comparehalf.top .comparelbl{color:#C25B45;}
  .comparehalf.bottom .comparelbl{color:var(--green-deep);}
  .comparetxt{font-size:52px;font-weight:800;line-height:1.22;color:#15150F;}
  .comparevs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5;
    background:var(--black);color:#F4F1EA;font-weight:800;font-size:30px;padding:16px 26px;border-radius:999px;
    border:3px solid var(--cream);}

  .capbar{position:absolute;left:0;right:0;bottom:170px;z-index:6;display:flex;justify-content:center;padding:0 60px;}
  .capbar .inner{background:rgba(10,10,8,.72);backdrop-filter:blur(6px);border-radius:20px;
    padding:22px 34px;max-width:900px;}
  .capbar .inner p{color:#F4F1EA;font-size:34px;font-weight:700;text-align:center;line-height:1.3;}
  .capbar .dotline{width:52px;height:6px;background:var(--green);border-radius:99px;margin:0 auto 12px;}

  #render-done{position:absolute;top:0;left:0;opacity:0;pointer-events:none;}
</style>
</head>
<body>
  <div class="stage" id="stage">
    <div class="brandtag"><div class="dot"></div><span>GrowthStack OS</span></div>
    ${sceneNodes}
    <div class="capbar"><div class="inner"><div class="dotline"></div><p id="capline"></p></div></div>
    <div id="render-done">not-done</div>
  </div>
<script>
  const scenes = ${JSON.stringify(scenes)};
  let starts = [];
  (function(){ let acc=0; scenes.forEach(s=>{ starts.push(acc); acc += s.dur; }); window.__TOTAL__ = acc; })();
  const capEl = document.getElementById('capline');
  const sceneEls = scenes.map(s => document.getElementById('scene-'+s.i));
  let current = -1;
  const t0 = performance.now();
  function frame(){
    const elapsed = (performance.now() - t0) / 1000;
    let idx = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
      if (elapsed < starts[i] + scenes[i].dur) { idx = i; break; }
    }
    if (idx !== current) {
      if (current >= 0) sceneEls[current].classList.remove('active');
      sceneEls[idx].classList.add('active');
      const img = sceneEls[idx].querySelector('img');
      if (img) { img.style.animationDuration = scenes[idx].dur + 's'; }
      capEl.textContent = scenes[idx].caption || '';
      current = idx;
    }
    if (elapsed >= window.__TOTAL__) {
      document.getElementById('render-done').textContent = 'done';
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
</script>
</body>
</html>`;
}

function sceneHtml(s) {
  const v = s.visual;

  if (v.type === 'title') {
    return `<div class="scene bg-${v.bg}" id="scene-${s.i}">
      <div>
        <div class="accent-line"></div>
        <div class="headline">${escapeHtml(v.headline)}</div>
        ${v.sub ? `<div class="sub">${escapeHtml(v.sub)}</div>` : ''}
      </div>
    </div>`;
  }

  if (v.type === 'shot') {
    return `<div class="scene bg-cream" id="scene-${s.i}">
      <div class="shotwrap">
        <div class="chip">${escapeHtml(v.label || '')}</div>
        <div class="frame">
          <div class="chrome"><i></i><i></i><i></i></div>
          <div class="shotimg-wrap"><img src="../assets/screenshots/${v.image}.png"></div>
        </div>
      </div>
    </div>`;
  }

  if (v.type === 'stat') {
    const hasAfter = v.after && v.after.value;
    return `<div class="scene bg-black" id="scene-${s.i}">
      <div class="statwrap">
        <div class="statcard before"><div class="statlbl">${escapeHtml(v.before.label)}</div><div class="statval">${escapeHtml(v.before.value)}</div></div>
        ${hasAfter ? `<div class="statarrow">&#8595;</div>
        <div class="statcard after"><div class="statlbl">${escapeHtml(v.after.label)}</div><div class="statval">${escapeHtml(v.after.value)}</div></div>` : ''}
      </div>
    </div>`;
  }

  if (v.type === 'chat') {
    const rows = v.bubbles.map((b, bi) => {
      const isLast = bi === v.bubbles.length - 1;
      return `<div class="bubblerow ${b.from === 'out' ? 'out' : 'in'} ${isLast ? 'latest' : ''}"><div class="bubble">${escapeHtml(b.text)}</div></div>`;
    }).join('');
    return `<div class="scene bg-black" id="scene-${s.i}">
      <div class="chatouter"><div class="phonecard">
        <div class="phonehd">${escapeHtml(v.header || 'Instagram DM')}</div>
        ${rows}
      </div></div>
    </div>`;
  }

  if (v.type === 'quote') {
    return `<div class="scene bg-${v.bg || 'cream'}" id="scene-${s.i}">
      <div class="quotewrap">
        <div class="quotemark">&#8220;</div>
        <div class="quotetext">${escapeHtml(v.text)}</div>
        ${v.tag ? `<div class="quotetag">${escapeHtml(v.tag)}</div>` : ''}
      </div>
    </div>`;
  }

  if (v.type === 'numbered') {
    const total = v.total || 7;
    const dots = Array.from({ length: total }, (_, i) => `<div class="numdot ${i < v.num ? 'on' : ''}"></div>`).join('');
    return `<div class="scene bg-${v.bg || 'cream'}" id="scene-${s.i}">
      <div class="numwrap">
        <div class="numbadge">${String(v.num).padStart(2, '0')}</div>
        <div class="headline" style="font-size:64px;">${escapeHtml(v.headline)}</div>
        ${v.sub ? `<div class="sub" style="font-size:32px;margin-top:6px;">${escapeHtml(v.sub)}</div>` : ''}
        <div class="numdots">${dots}</div>
      </div>
    </div>`;
  }

  if (v.type === 'checklist') {
    const rows = v.items.map((item, ii) => {
      const isLast = ii === v.items.length - 1;
      return `<div class="checkrow ${isLast ? 'latest' : ''}"><div class="checkmk">&#10003;</div><div class="checktxt">${escapeHtml(item)}</div></div>`;
    }).join('');
    return `<div class="scene bg-cream" id="scene-${s.i}">
      <div class="checkwrap">
        ${rows}
        ${v.priceTag ? `<div class="pricetag">${escapeHtml(v.priceTag)}</div>` : ''}
      </div>
    </div>`;
  }

  if (v.type === 'compare') {
    return `<div class="scene bg-cream" id="scene-${s.i}" style="align-items:stretch;">
      <div class="comparewrap">
        <div class="comparehalf top"><div class="comparelbl">${escapeHtml(v.topLabel)}</div><div class="comparetxt">${escapeHtml(v.topText)}</div></div>
        <div class="comparehalf bottom"><div class="comparelbl">${escapeHtml(v.bottomLabel)}</div><div class="comparetxt">${escapeHtml(v.bottomText)}</div></div>
      </div>
      <div class="comparevs">VS</div>
    </div>`;
  }

  return `<div class="scene bg-black" id="scene-${s.i}"></div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
