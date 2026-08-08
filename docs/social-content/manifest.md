# Bonifatus Social Content Manifest

Generated: 2026-08-08  
Total assets: 15 (6 pins, 5 carousel slides, 2 videos, 2 video posters)

All static images: lossless PNG, sRGB.  
All videos: H.264 / yuv420p / 30 fps / no audio / CRF 18 / 1080×1920.  
Video strategy: 1080×2400 emulator recordings letterboxed to 1080×1920 — full phone screen visible, navy (#0F1E45) padding bands, no crop, no stretch.

---

## Asset table

| File                                       | Dimensions | Type                   | Platform                     | Topic                   | Headline (DE)                                 | Caption / Hashtags                                                                                       | Link target                             | Language | Status |
| ------------------------------------------ | ---------- | ---------------------- | ---------------------------- | ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------- | ------ |
| `pins/pin_taschengeldtabelle.png`          | 1000×1500  | Static pin             | Pinterest                    | Taschengeld-Tabelle     | Wie viel Taschengeld ist altersgerecht?       | Die offizielle DJI-Empfehlung als Übersicht 🗂️ #Taschengeld #Erziehung #Eltern #Bonus                    | bonifatus.com/tools/taschengeld-rechner | DE       | ready  |
| `pins/pin_zeugnisgeld_regeln.png`          | 1000×1500  | Static pin             | Pinterest                    | Zeugnisgeld-Regeln      | 5 Regeln für faires Zeugnisgeld               | Endlich ein System statt Willkür ✅ #Zeugnisgeld #Schulnoten #Belohnung #Eltern                          | bonifatus.com                           | DE       | ready  |
| `pins/pin_belohnungstafel_vorlage.png`     | 1000×1500  | Static pin             | Pinterest                    | Belohnungstafel         | Kostenlose Belohnungstafel-Vorlage            | Ausdrucken, ausfüllen, motivieren 🖨️ #Belohnungstafel #Erziehung #Kinder #Gratis                         | bonifatus.com                           | DE       | ready  |
| `pins/pin_einschulung_checkliste.png`      | 1000×1500  | Static pin             | Pinterest                    | Einschulung             | Checkliste für die Einschulung                | An alles gedacht? ✏️ #Einschulung #Schule #Erstklässler #Eltern                                          | bonifatus.com                           | DE       | ready  |
| `pins/pin_ba_diskussion.png`               | 1000×1500  | Static pin             | Pinterest                    | Before/After Diskussion | Vorher: Streit ums Zeugnis. Nachher: Ruhe.    | So klappt's mit Bonifatus 💡 #Zeugnisgeld #Notenrechner #Schulnoten #Eltern                              | bonifatus.com                           | DE       | ready  |
| `pins/pin_ba_motivation.png`               | 1000×1500  | Static pin             | Pinterest                    | Before/After Motivation | Vorher: schlechte Note. Nachher: mehr Punkte. | Noten fair in Belohnungen umrechnen 📈 #Zeugnisgeld #Bonus #Schulnoten #Eltern                           | bonifatus.com                           | DE       | ready  |
| `carousels/so-funktionierts/01.png`        | 1080×1350  | Carousel slide 1       | Instagram                    | Hook                    | Schluss mit Zeugnisgeld-Willkür               | Swipe → in 3 Schritten erklärt 👉 #Zeugnisgeld #Notenrechner #Eltern #Bonifatus                          | bonifatus.com                           | DE       | ready  |
| `carousels/so-funktionierts/02.png`        | 1080×1350  | Carousel slide 2       | Instagram                    | Schritt 1               | Fächer & Formel festlegen                     | #Zeugnisgeld #Schulnoten #Eltern #Bonifatus                                                              | bonifatus.com                           | DE       | ready  |
| `carousels/so-funktionierts/03.png`        | 1080×1350  | Carousel slide 3       | Instagram                    | Schritt 2               | Note eintragen — Punkte erscheinen sofort     | #Zeugnisgeld #Schulnoten #Eltern #Bonifatus                                                              | bonifatus.com                           | DE       | ready  |
| `carousels/so-funktionierts/04.png`        | 1080×1350  | Carousel slide 4       | Instagram                    | Schritt 3               | Punkte in Belohnung auszahlen                 | #Zeugnisgeld #Schulnoten #Eltern #Bonifatus                                                              | bonifatus.com                           | DE       | ready  |
| `carousels/so-funktionierts/05.png`        | 1080×1350  | Carousel slide 5 (CTA) | Instagram                    | CTA                     | Gratis starten auf bonifatus.com              | Jetzt kostenlos testen 🎯 #Zeugnisgeld #Notenrechner #GratisApp #Bonifatus                               | bonifatus.com                           | DE       | ready  |
| `videos/01_note_zu_belohnung.mp4`          | 1080×1920  | Reel / Short           | Instagram, TikTok, Pinterest | Note → Belohnung        | Zeugnis-Zeit? So läuft's jetzt ab.            | Note eintragen → Punkte erscheinen → fair berechnet 📊 #Zeugnisgeld #Schulnoten #Notenrechner #Bonifatus | bonifatus.com                           | DE       | ready  |
| `videos/02_familie_einrichten.mp4`         | 1080×1920  | Reel / Short           | Instagram, TikTok, Pinterest | Familie einrichten      | Bonifatus in 3 Schritten einrichten           | Fächer → Noten → Punkte — so einfach ist das 🚀 #Zeugnisgeld #Eltern #Notenrechner #Bonifatus            | bonifatus.com                           | DE       | ready  |
| `videos/posters/01_note_zu_belohnung.png`  | 1080×1350  | Video poster           | Instagram, TikTok            | Note → Belohnung        | —                                             | Thumbnail for video 01                                                                                   | —                                       | DE       | ready  |
| `videos/posters/02_familie_einrichten.png` | 1080×1350  | Video poster           | Instagram, TikTok            | Familie einrichten      | —                                             | Thumbnail for video 02                                                                                   | —                                       | DE       | ready  |

---

## Technical specs

### Videos

- **Container**: MP4 (faststart — index at front for streaming)
- **Video codec**: H.264 (libx264), CRF 18, preset slow
- **Pixel format**: yuv420p (iOS/Android/web compatible)
- **Frame rate**: 30 fps
- **Audio**: none (add music/voiceover in-app or in editing suite)
- **Letterbox method**: 1080×2400 scaled to 864×1920 (factor 0.8), 108 px navy padding each side
- **Overlays**: PIL-rendered, RGBA-composited via moviepy 2.1.2

### Static images

- **Format**: PNG, lossless, sRGB
- **Pins**: 1000×1500 px (2:3, Pinterest optimum)
- **Carousel / Poster**: 1080×1350 px (4:5, Instagram portrait)

---

## Caption templates

### Video 1 — Note zu Belohnung

```
Zeugnis-Zeit? Mit Bonifatus läuft das jetzt anders 📊

Note eintragen → Punkte erscheinen sofort → faire, automatische Belohnung.
Kein Streit mehr, kein Willkür-Zeugnisgeld.

Gratis ausprobieren: bonifatus.com

#Zeugnisgeld #Schulnoten #Notenrechner #Eltern #Bonifatus
```

### Video 2 — Familie einrichten

```
In 3 Schritten zum fairen Belohnungssystem für die ganze Familie 🚀

1️⃣ Fächer & Formel festlegen
2️⃣ Noten eintragen
3️⃣ Punkte & Belohnung sehen

Kostenlos starten: bonifatus.com

#Zeugnisgeld #Eltern #Notenrechner #Schulnoten #Bonifatus
```

### Carousel (Instagram)

```
Schluss mit Zeugnisgeld-Willkür! 👉 Swipe für unser 3-Schritte-System.

Kinder motivieren, Noten fair belohnen — gratis auf bonifatus.com

#Zeugnisgeld #Notenrechner #Eltern #Schulnoten #Bonifatus
```
