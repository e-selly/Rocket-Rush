#!/usr/bin/env bash
# Installiert alles für Videoschnitt, Untertitel und Remotion-Rendering in einer frischen Cloud-Sitzung.
set -e

# Systemwerkzeuge: ffmpeg (Schnitt/Encoding), sox (Audio), mediainfo, mkvtoolnix, ImageMagick
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg sox libsox-fmt-mp3 mediainfo mkvtoolnix imagemagick >/dev/null

# Python-Werkzeuge: Whisper (sherpa-onnx), Szenenerkennung, Stille-Schnitt, Downloads, Freisteller, Audioanalyse
pip install -q --break-system-packages sherpa-onnx openai-whisper "scenedetect[opencv-headless]" auto-editor yt-dlp "rembg[cpu]" librosa piper-tts "pillow>=12.2,<14"

# Whisper-Turbo-Modell + Sprach-Erkennung (über GitHub, da Hugging Face hier gesperrt ist)
M=/root/whisper-models
mkdir -p "$M"
if [ ! -f "$M/sherpa-onnx-whisper-turbo/turbo-encoder.int8.onnx" ]; then
  curl -sSLf https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-turbo.tar.bz2 | tar xj -C "$M"
fi
[ -f "$M/silero_vad.onnx" ] || curl -sSLf -o "$M/silero_vad.onnx" https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx

# Befehl "transkribiere" verfügbar machen, falls das Repo schon da ist
for r in /home/user/Rocket-Rush "$(pwd)"; do
  if [ -f "$r/tools/transkribiere.py" ]; then chmod +x "$r/tools/transkribiere.py"; ln -sf "$r/tools/transkribiere.py" /usr/local/bin/transkribiere; break; fi
done

echo "Video-Werkzeuge bereit."
