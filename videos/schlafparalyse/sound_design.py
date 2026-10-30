import numpy as np, soundfile as sf, subprocess, io, json, sys
SR = 48000; FPS = 30; TOTAL = 1340
EL = "--el" in sys.argv  # retime onto the ElevenLabs narration
if EL:
    WARP = json.load(open("src/warp.json")); TOTAL = WARP["total"]
N = int(TOTAL / FPS * SR) + SR
L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(7)
SFX = "/root/.claude/plugins/cache/hyperframes/hyperframes/0.8.195/skills/media-use/audio/assets/sfx/"
fr = (lambda f: int(np.interp(f, WARP['old'], WARP['new']) / FPS * SR)) if EL else (lambda f: int(f / FPS * SR))
t_all = np.arange(N) / SR

def add(sig, at, gain=1.0, pan=0.0):
    i = fr(at); sig = sig[: max(0, N - i)]
    L[i:i + len(sig)] += sig * gain * (1 - max(0, pan)); Rr[i:i + len(sig)] += sig * gain * (1 + min(0, pan))

def env(n, a, r):
    e = np.ones(n); ai = int(a * SR); ri = int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e

def lowpass(x, fc):
    k = 1 - np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def bandnoise(n, fc, q=4):
    # resonant band via two one-pole filters difference (cheap)
    x = rng.standard_normal(n)
    return lowpass(x, fc * 1.4) - lowpass(x, fc / 1.4)

def load(name):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", SFX + name, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).astype(np.float64)

# 1) night drone + room tone (0 .. 1184)
n = fr(1184)
t = np.arange(n) / SR
drone = 0.5 * np.sin(2 * np.pi * 43.65 * t) + 0.35 * np.sin(2 * np.pi * 65.4 * t + 0.4 * np.sin(2 * np.pi * 0.07 * t)) + 0.15 * np.sin(2 * np.pi * 87.3 * t * (1 + 0.002 * np.sin(2 * np.pi * 0.2 * t)))
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t) ** 2
room = lowpass(rng.standard_normal(n), 400) * 0.5
fear = np.interp(np.arange(n), [0, fr(300), fr(445), fr(556), fr(623), fr(919), fr(1060), fr(1184)], [0.35, 0.45, 0.6, 0.15, 0.25, 0.3, 0.12, 0.0])
add((drone * 0.22 + room * 0.25) * fear * env(n, 1.5, 2.0), 0)
# eerie high cluster during the figure
n2 = fr(566 - 440); t2 = np.arange(n2) / SR
eerie = sum(np.sin(2 * np.pi * f0 * t2 * (1 + 0.003 * np.sin(2 * np.pi * 0.3 * t2 + k))) for k, f0 in enumerate([880, 932.3, 987.8, 1318.5]))
add(eerie * np.linspace(0, 1, n2) ** 2 * 0.012, 440)

# 2) clock ticks
tick = bandnoise(int(0.025 * SR), 3500) * np.exp(-np.linspace(0, 1, int(0.025 * SR)) * 8)
for k, f0 in enumerate(range(20, 366, 30)):
    add(tick, f0, 0.05 if f0 < 300 else 0.12, pan=0.5)
    add(tick, f0 + 15, 0.035 if f0 < 300 else 0.08, pan=0.5)

# 3) door creak (Geräusche) + distant whisper (Gestalt)
cn = int(1.6 * SR); ct = np.arange(cn) / SR
creak = np.sin(2 * np.pi * np.cumsum(260 + 120 * np.sin(2 * np.pi * 2.3 * ct) + 80 * ct) / SR) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * ct)))
creak = lowpass(creak, 1800) * env(cn, 0.15, 0.5)
add(creak, 322, 0.06, pan=0.6)
wn = int(2.4 * SR)
wh = bandnoise(wn, 2600) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.1 * np.arange(wn) / SR))) * env(wn, 0.6, 0.8)
add(wh, 470, 0.03, pan=-0.3); add(wh, 505, 0.025, pan=0.4)

# 4) heartbeat 365..622 accelerating
def thump(g):
    m = int(0.18 * SR); tt = np.arange(m) / SR
    return (np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 22) + 0.3 * lowpass(rng.standard_normal(m), 200) * np.exp(-tt * 40)) * g
f0 = 365.0
while f0 < 552:
    bpm = np.interp(f0, [365, 560], [70, 120]); g = np.interp(f0, [365, 420, 560, 600], [0.35, 0.6, 1.0, 0.7])
    add(thump(g), f0, 0.55); add(thump(g * 0.6), f0 + 0.18 * FPS, 0.55)
    f0 += 60 / bpm * FPS

# 5) jump scare + title
add(load("riser.mp3"), 556 - 46, 0.12)
sn = int(1.2 * SR); st = np.arange(sn) / SR
sting = (rng.standard_normal(sn) * np.exp(-st * 6) * 0.6 + np.sin(2 * np.pi * 38 * st) * np.exp(-st * 2.5) + 0.25 * np.sin(2 * np.pi * 1760 * st * (1 - 0.3 * st)) * np.exp(-st * 4))
add(sting, 556, 0.3)
add(load("impact-bass-1.mp3"), 563, 0.28)

# 6) brain: digital pulses + soft pad
bn = fr(919 - 623); bt = np.arange(bn) / SR
pad = sum(np.sin(2 * np.pi * f * bt + np.sin(2 * np.pi * 0.2 * bt) * 0.5) for f in [110, 164.8, 220, 261.6]) * env(bn, 1.0, 1.0)
add(lowpass(pad, 900) * 0.05, 623)
blip = lambda f: np.sin(2 * np.pi * f * np.arange(int(0.09 * SR)) / SR) * np.exp(-np.arange(int(0.09 * SR)) / SR * 40)
for k in range(28):
    at = 630 + k * 10 + (k * 37 % 7)
    add(blip(900 + (k * 173 % 600)), at, 0.035, pan=((k * 13) % 9 - 4) / 5)
for k in range(5):  # red block pulses
    add(thump(0.8), 703 + k * 18, 0.35)
add(load("sparkle.mp3"), 811, 0.2)
add(load("whoosh-short.mp3"), 619, 0.15); add(load("whoosh-short.mp3"), 787, 0.12)

# 7) dawn: warm pad + birds + rustle + relieved exhale
dn = fr(TOTAL - 960); dt = np.arange(dn) / SR
warm = sum(np.sin(2 * np.pi * f * dt) * a for f, a in [(130.8, 1), (196, 0.8), (261.6, 0.6), (329.6, 0.5), (392, 0.35), (587.3, 0.2)])
warm = lowpass(warm, 1400) * env(dn, 3.0, 2.5)
add(warm * 0.06, 960)
def chirp(f0, f1, d):
    m = int(d * SR); tt = np.arange(m) / SR
    return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, m)) / SR) * np.sin(np.pi * tt / d) ** 2
for k, at in enumerate([1000, 1012, 1040, 1046, 1080, 1120, 1128, 1150, 1200, 1210, 1260]):
    add(chirp(3200 + k * 90, 4300 - k * 50, 0.09), at, 0.03, pan=0.5 if k % 2 else -0.4)
    add(chirp(4100, 3600, 0.07), at + 4, 0.02, pan=0.5 if k % 2 else -0.4)
rn = int(0.8 * SR); add(lowpass(rng.standard_normal(rn), 2500) * env(rn, 0.1, 0.5), 1010, 0.05)
en = int(1.4 * SR); et = np.arange(en) / SR
exhale = (lowpass(rng.standard_normal(en), 1200) - lowpass(rng.standard_normal(en), 300)) * np.sin(np.pi * et / 1.4) ** 1.5
add(exhale, 1092, 0.12)
rn2 = int(1.6 * SR); add(lowpass(rng.standard_normal(rn2), 1800) * env(rn2, 0.3, 0.8), 1066, 0.06)

# 8) subliminal flash + end card
add(sting[: int(0.35 * SR)], 1160, 0.22)
add(load("whoosh-short.mp3"), 1180, 0.15)
add(load("impact-bass-1.mp3"), 1184, 0.22)
add(load("click-soft.mp3"), 1220, 0.4)

# duck everything under the narrator (voice starts 0.3 s in)
vo = subprocess.run(["ffmpeg", "-v", "error", "-i", "public/voice_el.mp3" if EL else "public/voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
vo = np.abs(np.frombuffer(vo, dtype=np.float32).astype(np.float64))
ve = np.zeros(N); o = int(0.3 * SR); ve[o:o + len(vo)] = vo[: N - o]
win = int(0.08 * SR); ve = np.convolve(ve, np.ones(win) / win, mode="same")
ve = np.clip(ve / 0.06, 0, 1)
ve = np.convolve(ve, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
duck = 1 - 0.6 * np.clip(ve, 0, 1)
L *= duck; Rr *= duck
mix = np.stack([L, Rr], 1)[: int(TOTAL / FPS * SR)]
mix /= max(1e-9, np.abs(mix).max()) / 0.7
sf.write("/home/user/Rocket-Rush/videos/schlafparalyse/public/" + ("sound_el.wav" if EL else "sound.wav"), mix.astype(np.float32), SR)
print("ok", mix.shape[0] / SR)
