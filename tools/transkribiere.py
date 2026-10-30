#!/usr/bin/env python3
"""Transkribiert Video/Audio lokal mit Whisper Turbo (sherpa-onnx) und schreibt .srt, .txt und .json.

Aufruf:  transkribiere video.mp4 [--sprache de] [--max-woerter 6]
"""
import argparse, json, os, subprocess, sys
import numpy as np
import sherpa_onnx

MODELS = os.environ.get("WHISPER_MODELS", "/root/whisper-models")
SR = 16000


def load_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def speech_segments(audio):
    cfg = sherpa_onnx.VadModelConfig()
    cfg.silero_vad.model = f"{MODELS}/silero_vad.onnx"
    cfg.silero_vad.min_silence_duration = 0.3
    cfg.silero_vad.min_speech_duration = 0.2
    cfg.silero_vad.max_speech_duration = 12
    cfg.sample_rate = SR
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=max(60, len(audio) / SR + 5))
    win = cfg.silero_vad.window_size
    out = []
    for i in range(0, len(audio), win):
        vad.accept_waveform(audio[i:i + win])
        while not vad.empty():
            out.append((vad.front.start, np.array(vad.front.samples, dtype=np.float32))); vad.pop()
    vad.flush()
    while not vad.empty():
        out.append((vad.front.start, np.array(vad.front.samples, dtype=np.float32))); vad.pop()
    return out


def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("eingabe")
    ap.add_argument("--sprache", default="de")
    ap.add_argument("--max-woerter", type=int, default=6, help="Wörter pro Untertitel-Zeile")
    ap.add_argument("-o", "--ausgabe", help="Basisname der Ausgabedateien (Standard: wie Eingabe)")
    a = ap.parse_args()

    m = f"{MODELS}/sherpa-onnx-whisper-turbo"
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=f"{m}/turbo-encoder.int8.onnx", decoder=f"{m}/turbo-decoder.int8.onnx", tokens=f"{m}/turbo-tokens.txt",
        language=a.sprache, task="transcribe", num_threads=os.cpu_count() or 4)

    audio = load_audio(a.eingabe)
    segs = []
    pad = int(0.35 * SR)
    for start, samples in speech_segments(audio):
        a0, a1 = max(0, start - pad), min(len(audio), start + len(samples) + pad // 2)
        st = rec.create_stream(); st.accept_waveform(SR, audio[a0:a1]); rec.decode_stream(st)
        text = st.result.text.strip()
        if not text:
            continue
        s0, s1 = start / SR, (start + len(samples)) / SR
        # Wortzeiten proportional zur Zeichenlänge innerhalb des Sprachabschnitts
        words, pos, n = [], 0, len(text)
        for w in text.split():
            words.append({"wort": w, "start": round(s0 + (s1 - s0) * pos / n, 3), "ende": round(s0 + (s1 - s0) * (pos + len(w)) / n, 3)})
            pos += len(w) + 1
        segs.append({"start": round(s0, 3), "ende": round(s1, 3), "text": text, "woerter": words})
        print(f"[{ts(s0)}] {text}", file=sys.stderr)

    base = a.ausgabe or os.path.splitext(a.eingabe)[0]
    with open(base + ".json", "w") as f:
        json.dump(segs, f, ensure_ascii=False, indent=1)
    with open(base + ".txt", "w") as f:
        f.write("\n".join(s["text"] for s in segs) + "\n")
    with open(base + ".srt", "w") as f:
        i = 1
        for s in segs:
            ws = s["woerter"]
            for k in range(0, len(ws), a.max_woerter):
                grp = ws[k:k + a.max_woerter]
                f.write(f"{i}\n{ts(grp[0]['start'])} --> {ts(grp[-1]['ende'])}\n{' '.join(w['wort'] for w in grp)}\n\n"); i += 1
    print(f"Fertig: {base}.srt / .txt / .json", file=sys.stderr)


if __name__ == "__main__":
    main()
