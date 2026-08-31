/**
 * Canvas + MediaRecorder video generator for invitation templates.
 * Produces a 720×1280 animated WebM with Ken Burns, particles, text animation.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { VIDEO_WIDTH, VIDEO_HEIGHT } from './customizeConstants';
import { generateBackgroundMusic } from './musicEngine';

export interface VideoTextBlock {
  key: string;
  text: string;
  size: number;
  font: string;
  weight: number;
  opacity: number;
  letterSpacing: string;
  gap: number;
  lines: number;
  yPx: number;
  fontPx: number;
}

export interface VideoOptions {
  templateImage: string;
  category: string;
  blocks: VideoTextBlock[];
  textColor: string;
  textHalo: string;
  textOutline: string;
  textIsLight: boolean;
  boardStyle: { fill: string; stroke: string; dark: boolean } | null;
  textBand: { start: number; end: number };
  includeAudio: boolean;
  musicStyle: string;
  withWatermark: boolean;
}

export function generateAnimatedVideo(opts: VideoOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = VIDEO_WIDTH, H = VIDEO_HEIGHT;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.position = 'fixed'; canvas.style.left = '-9999px';
    canvas.style.top = '-9999px'; canvas.style.width = '1px'; canvas.style.height = '1px';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = opts.templateImage;

    img.onload = () => {
      const { blocks, textColor: color, textHalo, textOutline, textIsLight, boardStyle, category } = opts;
      const DURATION = 9000;
      const FPS = 30;

      const getParticlePalette = () => {
        switch (category) {
          case 'diwali': return ['#ff9f43','#feca57','#ff6b6b','#48dbfb'];
          case 'holi': return ['#ff9ff3','#feca57','#54a0ff','#5f27cd','#ff6b6b'];
          case 'birthday': return ['#ff9ff3','#feca57','#54a0ff','#5f27cd'];
          case 'ganpati': return ['#feca57','#ff9f43','#e8a0a8','#f5c9a0'];
          case 'navratri': return ['#ff6b6b','#feca57','#48dbfb','#1dd1a1'];
          case 'mehndi': return ['#e8a0a8','#f5c9a0','#d63031','#b8860b'];
          case 'haldi': return ['#feca57','#f5c9a0','#e8a0a8','#b8860b'];
          case 'wedding': case 'engagement': case 'reception': return ['#e8a0a8','#f5c9a0','#ffffff','#b8860b'];
          default: return ['#e8a0a8','#f5c9a0','#ffffff'];
        }
      };
      const palette = getParticlePalette();
      const petals = Array.from({ length: 34 }, () => ({ x: Math.random()*W, y: Math.random()*-H, r: 5+Math.random()*11, speed: 1+Math.random()*2.4, sway: Math.random()*Math.PI*2, swaySpeed: 0.01+Math.random()*0.025, color: palette[Math.floor(Math.random()*palette.length)], rotation: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.08 }));
      const floaters = Array.from({ length: 10 }, () => ({ x: Math.random()*W, y: H+Math.random()*200, r: 8+Math.random()*12, speed: 0.6+Math.random()*1.2, sway: Math.random()*Math.PI*2, swaySpeed: 0.02+Math.random()*0.03, alpha: 0.3+Math.random()*0.4 }));
      const sparkles = Array.from({ length: 18 }, () => ({ x: Math.random()*W, y: Math.random()*H, r: 1+Math.random()*2.5, phase: Math.random()*Math.PI*2, speed: 0.003+Math.random()*0.004 }));

      const videoStream = canvas.captureStream(FPS);
      const tracks = [...videoStream.getVideoTracks()];
      let audioCtx: AudioContext | null = null;
      if (opts.includeAudio) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const musicDest = audioCtx.createMediaStreamDestination();
            generateBackgroundMusic(audioCtx, DURATION / 1000, category, musicDest, opts.musicStyle);
            musicDest.stream.getAudioTracks().forEach(t => tracks.push(t));
          }
        } catch (e) { console.warn('Audio generation failed:', e); }
      }
      const combinedStream = new MediaStream(tracks);
      let recorder: MediaRecorder;
      const mimeCandidates = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
      const mime = mimeCandidates.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
      try { recorder = new MediaRecorder(combinedStream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined); }
      catch { recorder = new MediaRecorder(combinedStream); }
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (audioCtx && audioCtx.state !== 'closed') { try { audioCtx.close(); } catch { /* ignore */ } }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        if (blob.size === 0) reject(new Error('Video recording produced an empty file.'));
        else resolve(blob);
      };
      recorder.onerror = () => { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); reject(new Error('MediaRecorder error')); };

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
        const rr = Math.min(r, w / 2, h / 2); ctx.beginPath();
        ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y); ctx.closePath();
      };

      let boardRect: { x: number; y: number; w: number; h: number } | null = null;
      if (boardStyle && blocks.length) {
        let top = Infinity, bottom = -Infinity, maxW = 0;
        blocks.forEach(b => {
          ctx.font = `${b.weight} ${Math.round(b.fontPx)}px '${b.font}', 'Tiro Devanagari Hindi', serif`;
          String(b.text).split('\n').forEach(line => { maxW = Math.max(maxW, ctx.measureText(line).width); });
          const h = b.lines * b.fontPx * 1.32; top = Math.min(top, b.yPx - h / 2); bottom = Math.max(bottom, b.yPx + h / 2);
        });
        const padX = Math.max(26, Math.min(54, W * 0.1)), padY = 30, halfW = Math.min(maxW, W * 0.84) / 2 + padX;
        boardRect = { x: Math.max(14, W / 2 - halfW), y: Math.max(14, top - padY), w: Math.min(W - 28, halfW * 2), h: Math.min(H - 28, (bottom - top) + padY * 2) };
      }

      const drawVignette = () => {
        const grad = ctx.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.85);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.7, 'rgba(0,0,0,0.08)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      };

      const drawFrame = (elapsed: number) => {
        const zoomProgress = elapsed / DURATION;
        const zoom = 1.03 + 0.05 * Math.sin(zoomProgress * Math.PI);
        const panX = 6 * Math.sin(zoomProgress * Math.PI * 2), panY = 4 * Math.cos(zoomProgress * Math.PI * 2);
        const dw = W * zoom, dh = H * zoom;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, (W - dw) / 2 + panX, (H - dh) / 2 + panY, dw, dh);
        const rayGrad = ctx.createLinearGradient(W/2, -100, W/2, H*0.65);
        rayGrad.addColorStop(0, `rgba(255,248,220,${0.12+0.08*Math.sin(elapsed*0.002)})`); rayGrad.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = rayGrad; ctx.beginPath(); ctx.moveTo(W*0.2,-50); ctx.lineTo(W*0.8,-50); ctx.lineTo(W*0.55,H*0.7); ctx.lineTo(W*0.45,H*0.7); ctx.closePath(); ctx.fill();
        drawVignette();
        floaters.forEach(f => { f.y -= f.speed; f.sway += f.swaySpeed; const fx = f.x + Math.sin(f.sway)*25; if (f.y < -40) { f.y = H+40; f.x = Math.random()*W; } ctx.save(); ctx.globalAlpha = f.alpha*(0.7+0.3*Math.sin(f.sway)); const glow = ctx.createRadialGradient(fx,f.y,0,fx,f.y,f.r*3); glow.addColorStop(0,'rgba(255,200,100,0.55)'); glow.addColorStop(1,'rgba(255,200,100,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx,f.y,f.r*3,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffcc66'; ctx.beginPath(); ctx.arc(fx,f.y,f.r,0,Math.PI*2); ctx.fill(); ctx.restore(); });
        petals.forEach(p => { p.y += p.speed; p.sway += p.swaySpeed; p.rotation += p.rotSpeed; const px = p.x + Math.sin(p.sway)*35; if (p.y > H+20) { p.y = -20; p.x = Math.random()*W; } ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(px, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2); ctx.fill(); ctx.restore(); });
        sparkles.forEach(s => { const alpha = 0.4+0.6*Math.sin(elapsed*s.speed+s.phase); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); ctx.restore(); });

        const breathe = 1 + 0.003 * Math.sin(elapsed * 0.0012);
        ctx.save(); ctx.translate(W/2, H/2); ctx.scale(breathe, breathe); ctx.translate(-W/2, -H/2);
        if (boardRect && boardStyle) {
          const bt = easeOut(Math.min(Math.max(elapsed / 650, 0), 1)); ctx.save(); ctx.globalAlpha = bt;
          const bh = boardRect.h * bt, by = boardRect.y + (boardRect.h - bh) / 2;
          roundRectPath(boardRect.x, by, boardRect.w, bh, 24); ctx.fillStyle = boardStyle.fill; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = boardStyle.stroke; ctx.stroke();
          if (bt > 0.55) { ctx.globalAlpha = (bt-0.55)/0.45*0.75; roundRectPath(boardRect.x+8,by+8,Math.max(0,boardRect.w-16),Math.max(0,bh-16),16); ctx.lineWidth = 1; ctx.strokeStyle = boardStyle.stroke; ctx.stroke(); }
          ctx.restore();
        }
        const perBlock = (DURATION * 0.5) / Math.max(blocks.length, 1);
        blocks.forEach((b, i) => {
          const start = (boardRect ? 520 : 300) + i * perBlock * 0.5;
          const t = Math.min(Math.max((elapsed - start) / 750, 0), 1); if (t <= 0) return;
          const alpha = easeOut(t) * b.opacity, offsetY = (1 - easeOut(t)) * 12, y = b.yPx + offsetY;
          ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const fontSize = Math.round(b.fontPx);
          ctx.font = `${b.weight} ${fontSize}px '${b.font}', 'Tiro Devanagari Hindi', serif`;
          const lines = String(b.text).split('\n'), lineH = fontSize * 1.32, startY = y - ((lines.length - 1) * lineH) / 2;
          ctx.shadowColor = textHalo; ctx.shadowBlur = boardRect ? 4 : 12; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
          ctx.lineWidth = boardRect ? 0 : Math.max(2, fontSize / 12); ctx.strokeStyle = textOutline;
          lines.forEach((line, li) => { const ly = startY + li * lineH; ctx.save(); ctx.translate(W/2, ly); if (!boardRect) ctx.strokeText(line, 0, 0, W*0.86); ctx.fillText(line, 0, 0, W*0.86); ctx.restore(); });
          ctx.restore();
        });
        ctx.restore();

        if (opts.withWatermark) {
          ctx.save(); const scrimH = Math.round(H * 0.10);
          const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H); scrim.addColorStop(0, 'rgba(24,6,12,0)'); scrim.addColorStop(0.5, 'rgba(24,6,12,0.28)'); scrim.addColorStop(1, 'rgba(24,6,12,0.55)');
          ctx.fillStyle = scrim; ctx.fillRect(0, H - scrimH, W, scrimH);
          const markSize = Math.round(18 * (W / 720));
          ctx.font = `600 ${markSize}px 'Inter',sans-serif`;
          const baseY = H - Math.round(28 * (W / 720));
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
          // Draw heart
          const heartX = W / 2 - Math.round(70 * (W / 720));
          const heartSize = Math.round(9 * (W / 720));
          ctx.fillStyle = '#FF6B7A';
          ctx.beginPath();
          const topCurveHeight = heartSize * 0.3;
          ctx.moveTo(heartX, baseY - heartSize + topCurveHeight);
          ctx.bezierCurveTo(heartX, baseY - heartSize, heartX - heartSize, baseY - heartSize, heartX - heartSize, baseY - heartSize + topCurveHeight);
          ctx.bezierCurveTo(heartX - heartSize, baseY - heartSize * 0.5, heartX, baseY - heartSize * 0.2, heartX, baseY);
          ctx.bezierCurveTo(heartX, baseY - heartSize * 0.2, heartX + heartSize, baseY - heartSize * 0.5, heartX + heartSize, baseY - heartSize + topCurveHeight);
          ctx.bezierCurveTo(heartX + heartSize, baseY - heartSize, heartX, baseY - heartSize, heartX, baseY - heartSize + topCurveHeight);
          ctx.fill();
          // "Made with AINOS" centered
          ctx.fillStyle = '#ffffff';
          const textX = W / 2 + Math.round(4 * (W / 720));
          ctx.fillText('Made with AINOS', textX, baseY);
          ctx.restore();
        }
      };

      let startTime: number | null = null, finished = false;
      const finish = () => { if (finished) return; finished = true; try { recorder.stop(); } catch { /* ignore */ } };
      recorder.onerror = () => { finished = true; reject(new Error('MediaRecorder error')); };
      recorder.start(100);
      const safetyTimeout = setTimeout(finish, DURATION + 3000);
      const frameInterval = 1000 / FPS;
      const tick = () => {
        if (finished) return; const now2 = performance.now();
        if (startTime === null) startTime = now2; const elapsed = now2 - startTime;
        drawFrame(elapsed);
        if (elapsed < DURATION) setTimeout(tick, frameInterval);
        else { clearTimeout(safetyTimeout); setTimeout(finish, 120); }
      };
      setTimeout(tick, frameInterval);
    };
    img.onerror = () => reject(new Error('Template image failed to load'));
  });
}
