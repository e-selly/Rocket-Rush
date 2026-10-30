# Rocket-Rush – Hinweise für Claude

Antworte immer auf Deutsch. Videos sind TikTok/Reels im Format 9:16, 1080×1920.

## Videos schneiden, die der Nutzer schickt: Originalfarben NIEMALS verändern

Wenn der Nutzer ein eigenes Video zum Schneiden schickt, muss das Ergebnis exakt die Originalfarben behalten.

- Kein Color Grading, keine LUTs, keine Filter für Helligkeit, Kontrast, Sättigung, Gamma, Schärfe oder Entrauschen, keine „Looks“. Auch nicht „nur leicht“ und auch nicht, wenn es besser aussehen würde. Nur auf ausdrücklichen Wunsch des Nutzers.
- Wenn möglich ohne Neukodierung schneiden (`-c copy`, ggf. Schnitt auf Keyframes) oder mit verlustfreiem Concat.
- Wenn neu kodiert werden muss (Schnitt auf Frame, Overlays, Untertitel einbrennen):
  - Farbmetadaten der Quelle per `ffprobe -show_streams` auslesen (`color_primaries`, `color_transfer`, `color_space`, `color_range`, `pix_fmt`) und im Ausgang identisch setzen (`-color_primaries`, `-color_trc`, `-colorspace`, `-color_range`, gleiches `-pix_fmt`).
  - HDR/10-Bit-Quellen (z. B. iPhone HLG/Dolby Vision, `pix_fmt` yuv420p10le) nicht nach SDR/8-Bit wandeln, sondern mit 10-Bit-Encoder (libx265 `-pix_fmt yuv420p10le` + Tags) ausgeben.
  - Beim Skalieren keine Matrix-/Range-Umwandlung (z. B. `scale=...:in_range=tv:out_range=tv`, Matrix explizit gleich lassen).
  - Hohe Qualität (CRF ≤ 18, preset slow), damit keine sichtbaren Verluste entstehen.
- Text, Untertitel und Grafiken dürfen darübergelegt werden, aber das Videobild selbst wird farblich nicht verändert.
- Nach dem Export prüfen: Farbmetadaten von Quelle und Ergebnis vergleichen und ein Standbild aus beiden Dateien auf Farbabweichung prüfen (z. B. mittlere RGB-Werte am gleichen Zeitpunkt).

## Werkzeuge

- Neue Cloud-Sitzung: `bash tools/setup-video-tools.sh` installiert ffmpeg, Whisper (`transkribiere`), auto-editor, PySceneDetect, sox usw.
- Untertitel/Transkript: `transkribiere video.mp4` → .srt/.txt/.json
