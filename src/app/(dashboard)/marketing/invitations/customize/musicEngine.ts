/**
 * Rich, Indian-themed background music using Web Audio API.
 * Produces tanpura drone, sitar-like plucked melodies, tabla groove and temple bells.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Mood {
  scale: number[];
  drone: number;
  tempo: number;
  droneVol: number;
  melodyVol: number;
  tablaVol: number;
  bell: boolean;
}

const MOODS: Record<string, Mood> = {
  wedding: { scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], drone: 130.81, tempo: 0.55, droneVol: 0.28, melodyVol: 0.18, tablaVol: 0.22, bell: true },
  engagement: { scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], drone: 130.81, tempo: 0.52, droneVol: 0.26, melodyVol: 0.18, tablaVol: 0.22, bell: true },
  haldi: { scale: [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33], drone: 146.83, tempo: 0.42, droneVol: 0.24, melodyVol: 0.16, tablaVol: 0.24, bell: false },
  mehndi: { scale: [246.94, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33], drone: 123.47, tempo: 0.45, droneVol: 0.24, melodyVol: 0.17, tablaVol: 0.23, bell: false },
  sangeet: { scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], drone: 130.81, tempo: 0.38, droneVol: 0.22, melodyVol: 0.18, tablaVol: 0.25, bell: false },
  reception: { scale: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25], drone: 130.81, tempo: 0.50, droneVol: 0.25, melodyVol: 0.16, tablaVol: 0.22, bell: true },
  ganpati: { scale: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00], drone: 98.00, tempo: 0.36, droneVol: 0.30, melodyVol: 0.19, tablaVol: 0.24, bell: true },
  navratri: { scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25], drone: 110.00, tempo: 0.32, droneVol: 0.26, melodyVol: 0.18, tablaVol: 0.25, bell: true },
  'durga-puja': { scale: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00], drone: 98.00, tempo: 0.34, droneVol: 0.28, melodyVol: 0.18, tablaVol: 0.24, bell: true },
  diwali: { scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], drone: 130.81, tempo: 0.40, droneVol: 0.24, melodyVol: 0.18, tablaVol: 0.24, bell: true },
  holi: { scale: [246.94, 261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88], drone: 123.47, tempo: 0.34, droneVol: 0.22, melodyVol: 0.18, tablaVol: 0.25, bell: false },
  janmashtami: { scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25], drone: 110.00, tempo: 0.44, droneVol: 0.28, melodyVol: 0.17, tablaVol: 0.22, bell: true },
  birthday: { scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], drone: 130.81, tempo: 0.40, droneVol: 0.20, melodyVol: 0.18, tablaVol: 0.23, bell: false },
  'griha-pravesh': { scale: [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25], drone: 130.81, tempo: 0.48, droneVol: 0.26, melodyVol: 0.16, tablaVol: 0.22, bell: true },
  'maha-shivratri': { scale: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00], drone: 98.00, tempo: 0.44, droneVol: 0.30, melodyVol: 0.15, tablaVol: 0.20, bell: true },
  dussehra: { scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25], drone: 110.00, tempo: 0.40, droneVol: 0.26, melodyVol: 0.17, tablaVol: 0.24, bell: true },
};

const MOOD_ALIASES: Record<string, string> = {
  'ram-navami': 'ganpati', 'makar-sankranti': 'diwali', pongal: 'diwali', onam: 'haldi',
  vaisakhi: 'navratri', gurpurab: 'ganpati', 'buddha-purnima': 'maha-shivratri',
  'mahavir-jayanti': 'ganpati', paryushan: 'maha-shivratri', 'eid-ul-fitr': 'haldi',
  'eid-ul-adha': 'haldi', muharram: 'maha-shivratri', 'milad-un-nabi': 'maha-shivratri',
  christmas: 'diwali', easter: 'birthday', 'good-friday': 'maha-shivratri',
  'karva-chauth': 'maha-shivratri', teej: 'janmashtami', 'bhai-dooj': 'diwali',
  chhath: 'maha-shivratri', 'gudi-padwa': 'ganpati', 'saraswati-puja': 'janmashtami',
  annaprashan: 'ganpati', dhanteras: 'diwali', 'raksha-bandhan': 'navratri',
  satyanarayan: 'ganpati', mundan: 'ganpati', naamkaran: 'ganpati',
  'thread-ceremony': 'ganpati', anniversary: 'reception', 'baby-shower': 'birthday',
  'baby-announcement': 'birthday', retirement: 'griha-pravesh', farewell: 'birthday',
  'new-year': 'sangeet',
};

interface LayerVolumes { drone: number; sitar: number; flute: number; tabla: number; bell: number; }
const LAYERS: Record<string, LayerVolumes> = {
  auto: { drone: 1, sitar: 1, flute: 0.55, tabla: 1, bell: 1 },
  flute: { drone: 0.9, sitar: 0, flute: 1.25, tabla: 0.45, bell: 0.35 },
  sitar: { drone: 1, sitar: 1.3, flute: 0, tabla: 0.7, bell: 0.4 },
  bells: { drone: 0.75, sitar: 0.35, flute: 0.3, tabla: 0.25, bell: 1.9 },
  tabla: { drone: 0.8, sitar: 0.9, flute: 0.4, tabla: 1.6, bell: 0.3 },
};

export function generateBackgroundMusic(
  audioCtx: AudioContext,
  durationSec: number,
  category = 'wedding',
  destinationNode: AudioNode | null = null,
  styleFilter = 'auto',
) {
  const mood = MOODS[category] || MOODS[MOOD_ALIASES[category]] || MOODS.wedding;
  const scale = mood.scale;
  const drone = mood.drone;
  const tempo = mood.tempo;
  const now = audioCtx.currentTime;
  const L = LAYERS[styleFilter] || LAYERS.auto;

  const createReverb = () => {
    const length = audioCtx.sampleRate * 1.8;
    const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2.2);
        data[i] = (Math.random() * 2 - 1) * decay * (ch === 0 ? 1 : 0.92);
      }
    }
    const convolver = audioCtx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  };

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.gain.linearRampToValueAtTime(0.22, now + 0.8);
  masterGain.gain.setValueAtTime(0.22, now + durationSec - 1.0);
  masterGain.gain.linearRampToValueAtTime(0, now + durationSec + 0.1);
  masterGain.connect(destinationNode || audioCtx.destination);

  const reverb = createReverb();
  const reverbGain = audioCtx.createGain();
  reverbGain.gain.value = 0.35;
  reverb.connect(reverbGain);
  reverbGain.connect(masterGain);

  const makeSend = (dryNode: AudioNode) => { dryNode.connect(masterGain); dryNode.connect(reverb); };

  // ── TANPURA DRONE ──
  const droneGroup = audioCtx.createGain();
  droneGroup.gain.value = mood.droneVol * L.drone;
  [{ f: drone, type: 'sine' as OscillatorType, vol: 1.0 }, { f: drone * 1.5, type: 'sine' as OscillatorType, vol: 0.55 }, { f: drone * 2, type: 'triangle' as OscillatorType, vol: 0.12 }].forEach(({ f, type, vol }) => {
    const o = audioCtx.createOscillator(); o.type = type; o.frequency.value = f + (Math.random() - 0.5) * 0.4;
    const g = audioCtx.createGain(); g.gain.value = vol; o.connect(g); g.connect(droneGroup); o.start(); o.stop(now + durationSec + 0.15);
  });
  const droneLfo = audioCtx.createOscillator(); droneLfo.frequency.value = 0.25;
  const droneLfoGain = audioCtx.createGain(); droneLfoGain.gain.value = 0.08;
  droneLfo.connect(droneLfoGain); droneLfoGain.connect(droneGroup.gain); droneLfo.start(); droneLfo.stop(now + durationSec + 0.15);
  makeSend(droneGroup);

  // ── SITAR-LIKE PLUCKED MELODY ──
  const playSitar = (freq: number, startTime: number, dur = 0.55, vol = 1) => {
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(mood.melodyVol * vol * L.sitar, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    const saw = audioCtx.createOscillator(); saw.type = 'sawtooth'; saw.frequency.setValueAtTime(freq, startTime);
    const bend = 1 + (Math.random() < 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.04);
    saw.frequency.exponentialRampToValueAtTime(freq * bend, startTime + 0.18);
    saw.frequency.exponentialRampToValueAtTime(freq, startTime + dur * 0.7);
    const tri = audioCtx.createOscillator(); tri.type = 'triangle'; tri.frequency.setValueAtTime(freq, startTime);
    const triGain = audioCtx.createGain(); triGain.gain.value = 0.18;
    const pluckFilter = audioCtx.createBiquadFilter(); pluckFilter.type = 'lowpass';
    pluckFilter.frequency.setValueAtTime(2400, startTime); pluckFilter.frequency.exponentialRampToValueAtTime(900, startTime + dur);
    saw.connect(pluckFilter); tri.connect(triGain); triGain.connect(pluckFilter); pluckFilter.connect(noteGain); makeSend(noteGain);
    saw.start(startTime); tri.start(startTime); saw.stop(startTime + dur + 0.05); tri.stop(startTime + dur + 0.05);
  };

  // ── BANSURI (flute) ──
  const playFlute = (freq: number, startTime: number, dur = 0.9, vol = 1) => {
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(mood.melodyVol * 0.95 * vol * L.flute, startTime + dur * 0.22);
    noteGain.gain.setValueAtTime(mood.melodyVol * 0.85 * vol * L.flute, startTime + dur * 0.7);
    noteGain.gain.exponentialRampToValueAtTime(0.0005, startTime + dur);
    const body = audioCtx.createOscillator(); body.type = 'sine'; body.frequency.setValueAtTime(freq, startTime);
    body.frequency.exponentialRampToValueAtTime(freq, startTime + dur * 0.3);
    const harm = audioCtx.createOscillator(); harm.type = 'triangle'; harm.frequency.value = freq * 2;
    const harmGain = audioCtx.createGain(); harmGain.gain.value = 0.07;
    const vib = audioCtx.createOscillator(); vib.frequency.value = 5.5;
    const vibGain = audioCtx.createGain(); vibGain.gain.value = freq * 0.006;
    vib.connect(vibGain); vibGain.connect(body.frequency);
    const tone = audioCtx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2200; tone.Q.value = 0.5;
    body.connect(tone); harm.connect(harmGain); harmGain.connect(tone); tone.connect(noteGain); makeSend(noteGain);
    body.start(startTime); harm.start(startTime); vib.start(startTime);
    body.stop(startTime + dur + 0.05); harm.stop(startTime + dur + 0.05); vib.stop(startTime + dur + 0.05);
  };

  // Compose melodic phrases
  const motifLength = tempo * 4;
  const motifs = Math.floor(durationSec / motifLength);
  const fluteAnswers = L.flute > 0 && L.sitar > 0;
  for (let m = 0; m < motifs; m++) {
    const motifStart = now + m * motifLength;
    const rootIndex = Math.floor(Math.random() * (scale.length - 4));
    const motif = [0, 2, 1, 3, 2, 4, 3, 1].map(off => (rootIndex + off) % scale.length);
    const useFlute = fluteAnswers ? m % 2 === 1 : L.flute > 0 && L.sitar === 0;
    motif.forEach((noteIdx, i) => {
      const time = motifStart + i * (motifLength / 8);
      const freq = scale[noteIdx];
      if (useFlute) { if (i % 2 === 0) playFlute(freq, time, motifLength / 4, 0.9 + Math.random() * 0.15); }
      else { playSitar(freq, time, tempo * (1.2 + Math.random() * 0.6), 0.9 + Math.random() * 0.2); }
    });
  }

  // ── TABLA PERCUSSION ──
  const playTablaBass = (startTime: number, vol = 1) => {
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.9 * mood.tablaVol * L.tabla * vol, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(130, startTime); o.frequency.exponentialRampToValueAtTime(48, startTime + 0.14);
    o.connect(g); makeSend(g); o.start(startTime); o.stop(startTime + 0.2);
  };
  const playTablaTone = (startTime: number, vol = 1) => {
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.7 * mood.tablaVol * L.tabla * vol, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(420, startTime); o.frequency.exponentialRampToValueAtTime(280, startTime + 0.10);
    o.connect(g); makeSend(g); o.start(startTime); o.stop(startTime + 0.14);
  };
  const playTablaSlap = (startTime: number, vol = 1) => {
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.6 * mood.tablaVol * L.tabla * vol, startTime + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
    const o = audioCtx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(250, startTime); o.frequency.exponentialRampToValueAtTime(120, startTime + 0.06);
    o.connect(g); makeSend(g); o.start(startTime); o.stop(startTime + 0.1);
  };
  const thekas = [['dha','tin','dha','dhin','na','dha','tin','na'],['dha','dhin','dha','dhin','dha','tin','dha','na'],['dha','na','dha','tin','na','dha','dhin','na']];
  const beats = L.tabla > 0 ? Math.floor(durationSec / tempo) : 0;
  for (let i = 0; i < beats; i++) {
    const t = now + i * tempo;
    const theka = thekas[i % thekas.length];
    const bol = theka[i % theka.length];
    if (bol === 'dha') playTablaBass(t, 1);
    else if (bol === 'tin') playTablaTone(t, 0.85);
    else if (bol === 'dhin') { playTablaBass(t, 0.6); playTablaTone(t, 0.5); }
    else if (bol === 'na') playTablaSlap(t, 0.9);
  }

  // ── TEMPLE BELLS ──
  if (mood.bell && L.bell > 0) {
    const bellTimes = Math.floor(durationSec / 1.6);
    for (let i = 0; i < bellTimes; i++) {
      const t = now + 0.4 + i * 1.6 + Math.random() * 0.2;
      const bellGain = audioCtx.createGain();
      bellGain.gain.setValueAtTime(0, t);
      bellGain.gain.linearRampToValueAtTime(0.06 * L.bell, t + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      [1, 1.5, 2.0, 2.5].forEach((mult, idx) => {
        const o = audioCtx.createOscillator(); o.type = 'sine';
        o.frequency.value = 880 * mult + (Math.random() - 0.5) * 3;
        const g = audioCtx.createGain(); g.gain.value = 1 / (idx + 1.5);
        o.connect(g); g.connect(bellGain); o.start(t); o.stop(t + 1.5);
      });
      makeSend(bellGain);
    }
  }
}
