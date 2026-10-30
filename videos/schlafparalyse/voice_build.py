import subprocess, json, re, difflib, numpy as np, soundfile as sf, sherpa_onnx
W = "/root/whisper-models/sherpa-onnx-whisper-turbo"
REC = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{W}/turbo-encoder.int8.onnx", decoder=f"{W}/turbo-decoder.int8.onnx", tokens=f"{W}/turbo-tokens.txt", language="de", task="transcribe", num_threads=4)
norm = lambda t: re.sub(r"[^a-zäöüß0-9 ]", " ", t.lower().replace("-", " ")).split()
def heard(x):
    y = np.concatenate([np.zeros(8000), x[::3], np.zeros(16000)]).astype(np.float32)  # 48k -> 16k
    st = REC.create_stream(); st.accept_waveform(16000, y); REC.decode_stream(st); return st.result.text
M = "models/vits-piper-de_DE-thorsten-high/de_DE-thorsten-high.onnx"
# (text for TTS, display text, length-scale, pause after)
lines = [
 ("Ich wünschte, ich hätte das früher gewusst.", None, 1.12, 0.6),
 ("Es gibt einen Zustand, in dem du wach bist, aber deinen eigenen Körper nicht bewegen kannst.", None, 1.08, 0.6),
 ("Du öffnest die Augen.", None, 1.15, 0.4),
 ("Du erkennst dein Zimmer.", None, 1.12, 0.35),
 ("Du hörst vielleicht sogar Geräusche.", None, 1.12, 0.5),
 ("Doch du kannst weder sprechen noch deine Arme bewegen.", None, 1.16, 0.6),
 ("Manche Menschen berichten sogar, eine dunkle Gestalt im Zimmer zu sehen.", None, 1.1, 0.65),
 ("Das nennt sich Schlafparalyse.", None, 1.15, 0.6),
 ("Dabei wacht dein Bewusstsein auf, während die natürliche Muskelblockade des REM-Schlafs noch anhält.", None, 1.04, 0.4),
 ("Dein Gehirn kann dabei sogar Dinge wahrnehmen, die sich unglaublich real anfühlen.", None, 1.06, 0.5),
 ("Es ist meistens vorübergehend und ungefährlich, kann aber extrem beängstigend sein.", None, 1.06, 0.5),
 ("Und das verrückte. Es kann passieren, ohne dass du es vorher kommen siehst.", "Und das Verrückte: Es kann passieren, ohne dass du es vorher kommen siehst.", 1.1, 0.65),
 ("Folge Gedankenexperiment für mehr Dinge, die du vielleicht noch nicht wusstest.", None, 1.04, 0.0),
]
CHAIN = "aresample=48000,highpass=f=55,equalizer=f=120:t=q:w=1:g=5,equalizer=f=250:t=q:w=1:g=1.5,equalizer=f=2800:t=q:w=1.5:g=1.5,lowpass=f=11500,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=3"
out = []; marks = []; t = 0.0; SR = 48000
for i, (l, disp, ls, p) in enumerate(lines):
    target = norm(disp or l)
    best = None
    for attempt in range(8):
        subprocess.run(["python3", "-m", "piper", "-m", M, "-f", f"sp2/r{i:02d}.wav", "--length-scale", str(round(ls * 0.955 * (1 + 0.02 * (attempt % 3)), 3)), "--noise-scale", "0.45", "--noise-w-scale", "0.7"], input=l.encode(), check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"sp2/r{i:02d}.wav", "-af", CHAIN, "-ar", "48000", "-ac", "1", f"sp2/p{i:02d}.wav"], check=True)
        x, _ = sf.read(f"sp2/p{i:02d}.wav")
        idx = np.where(np.abs(x) > 0.004)[0]; x = x[max(idx[0] - 300, 0): idx[-1] + int(0.1 * SR)]
        h = heard(x); score = difflib.SequenceMatcher(None, norm(h), target).ratio()
        if best is None or score > best[0]: best = (score, x, h)
        if score >= 0.999: break
    score, x, h = best
    print(f"{i:02d} {score:.2f} ({attempt + 1}x) {h}")
    sf.write(f"sp2/p{i:02d}.wav", x, SR)
    marks.append((round(t, 3), round(t + len(x) / SR, 3), disp or l)); t += len(x) / SR
    out.append(x); out.append(np.zeros(int(p * 0.75 * SR))); t += p * 0.75
sf.write("sp2/dry.wav", np.concatenate(out), SR)
json.dump(marks, open("sp2/marks.json", "w"), ensure_ascii=False)
print("total", round(t, 2))
