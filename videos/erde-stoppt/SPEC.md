# Was wäre, wenn die Erde aufhört, sich zu drehen?

GOAL:    Der Zuschauer staunt über die Folgen des Gedankenexperiments und bleibt bis zur Schlussfrage „Würdest du das überleben?“.
OUTPUT:  HyperFrames, 1080 x 1920 (9:16), 30 fps
TIME:    64 s x 30 = 1920 Frames. Uhr = deutsche Sprecherstimme (ElevenLabs „Thomas“, eleven_v4), 60,5 s.

LOOK:    Grund: tiefes Weltall #02040A mit 4.000 geseedeten Sternen (0,6–2,2 px), keine Farbverläufe.
         Medium: echte NASA-Blue-Marble-Texturen (Tag 4K, Nachtlichter 4K, Wolken 4K) auf einer Three.js-Kugel,
         Atmosphäre als Rayleigh-Rand (#4FA3FF innen, #9FD4FF Rand), Sonnenlicht als einziges Key-Light von schräg oben links.
         Tinte: Weiß #FFFFFF für jedes gelesene Wort; Akzent A Bernstein #FFB547 nur für Zahlen und Gefahrenwörter;
         Akzent B Eisblau #8FDBFF nur für Schlüsselbegriffe. Pro Untertitel-Gruppe höchstens ein farbiges Wort.
         Schrift: Inter 900, Untertitel 76 px, Zahl „1.670 km/h“ 190 px, Tracking -2 %.
         Tiefe: Vignette 35 % an den Rändern, keine Glas-Karten, keine Chips.

OBJECTS: Erde (Kontinente unverzerrt aus der NASA-Equirectangular-Karte), Wolkenschicht 0,8 % über dem Boden,
         Atmosphärensaum, Stadtlichter Europas, Ozean (Specular-Maske), Sonne, Mond, sturmgepeitschter Ozean (Raymarching).

MOTION:  Kamera: power2.inOut für Fahrten, expo.out für Stopp-Schock (3 Frames Weißblitz, 0,35 s Shake mit 18 px Amplitude).
         Text: Eintritt 9 Frames power3.out (y 24 px → 0, opacity), Austritt 4 Frames power2.in.
         Zahlen zählen über 1,4 s hoch, synchron zum gesprochenen „1.670“.

SHOTS:
  0,00–1,00  A  Erde im All, schnelle Rotation, langsamer Push-in. Hook-Zeile oben.            whoosh
  1,00–2,00  B  Schnitt: Rand mit Stadtlichtern und Terminator.                                   whoosh
  2,00–5,20  C  Push-in; bei 3,25 s „drehen“ STOPP: Rotation friert ein, Blitz + Shake + Schockring. impact
  5,20–8,50  D  Leuchtende Rotationslinien um die Breitenkreise, Orbit.                            whoosh
  8,50–13,0  E  Äquator-Blick, „1.670 km/h“ landet bei 9,68 s.
  13,0–16,4  F  Sturzflug Richtung Europa bei Nacht (Stadtlichter).                                whoosh
  16,4–20,4  G  Boden steht, Wolken/Atmosphäre ziehen mit Schlieren weiter nach Osten.             wind
  20,4–24,5  H  Tiefer Orbit über Sturmwolken mit Blitzen.
  24,5–26,7  I1 Orbit: Flutfront rollt über den Atlantik auf die Küsten.                          wave
  26,7–29,8  I2 Bodennah: sturmgepeitschter Ozean, riesige Welle.
  29,8–36,0  J  Wasser wandert vom Äquator zu den Polen (Gleichgewicht ohne Fliehkraft).          whoosh
  36,0–39,1  K1 Blick auf den Nordpol-Ozean.
  39,1–42,6  K2 Überflug über den neuen Äquator-Kontinent.
  42,6–45,5  L1 Sonnenaufgang über dem Erdrand, extrem langsam.                                   whoosh
  45,5–51,0  L2 Halb Tag (glühend) / halb Nacht (vereist), Terminator wandert.
  51,0–64,0  M  Rückzug in den dunklen Raum, Erde dreht sich wieder, Mond; Schlussfrage ab 58,9.   riser→boom

BANNED:  Comic-Optik, Wasserzeichen, zufälliger Text, verzerrte Kontinente, Ecken-Labels, Chips, alles gleichzeitig einblenden,
         Text der sich beim Lesen bewegt, Lens-Flares, Partikel-Deko. Folgen immer als Gedankenexperiment kennzeichnen.

QA:      0,0 s Hook lesbar; 3,3 s Stopp-Schock; 10,5 s Zahl; 18 s Wolkenschlieren; 28 s Welle; 34 s Umverteilung;
         47 s Tag/Nacht; 61 s Schlussfrage. Untertitel immer zwischen 168 und 1330 px.
