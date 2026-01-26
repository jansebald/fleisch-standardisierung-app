# 📐 Rechenformeln & Algorithmen - Fleisch-Standardisierungs-App

## Dokumentation für Meilenstein-Präsentation

Diese Dokumentation erklärt alle mathematischen Formeln und Algorithmen, die in der App verwendet werden, um die Berechnung nachvollziehbar und transparent zu machen.

---

## 1. Grundlegende Berechnungen

### 1.1 BEFFE-Berechnung (Bindegewebseiweißfreies Fleischeiweiß)

**Formel:**
```
BEFFE = Gesamteiweiß - Bindegewebseiweiß

wobei:
Bindegewebseiweiß (BE) = direkt gemessen oder berechnet
```

**Code-Referenz:** `script.js`, Funktion `calculateCurrentBEFFE()`

**Beispiel:**
- Gesamteiweiß: 17,2%
- Bindegewebseiweiß: 1,0%
- **BEFFE = 17,2% - 1,0% = 16,2%**

**Bedeutung:** BEFFE ist ein Qualitätsmerkmal für Fleischprodukte. Je höher der BEFFE-Wert, desto hochwertiger ist das Fleischeiweiß (weniger Bindegewebe, mehr Muskelfleisch).

---

## 2. Mischungsberechnungen

### 2.1 Gewichtete Durchschnittswerte

Wenn mehrere Rohstoffe gemischt werden, berechnen wir die Durchschnittswerte gewichtet nach Menge:

**Formel:**
```
Durchschnitt = Σ(Menge_i × Wert_i) / Σ(Menge_i)

wobei:
i = Index des Rohstoffs (1, 2, 3, ...)
Menge_i = Menge des Rohstoffs i in kg
Wert_i = Eigenschaft des Rohstoffs i (z.B. Eiweiß%, Fett%, Wasser%)
```

**Code-Referenz:** `script.js`, Funktion `updateTotalMixture()`

**Beispiel:**
- Rohstoff 1: 500 kg mit 17% Eiweiß
- Rohstoff 2: 300 kg mit 12% Eiweiß
- **Durchschn. Eiweiß = (500×17 + 300×12) / (500+300) = 15,1%**

---

## 3. Produktions-Verluste

### 3.1 Brätreste-Verlust

Bei der Produktion entstehen Verluste durch Brätreste beim Abfüllen.

**Formel:**
```
Brät-Menge (inkl. Gewürze) = Endprodukt-Menge / (1 - Brätverlust%)

wobei:
Brätverlust% = z.B. 0,02 für 2% Verlust
```

**Code-Referenz:** `script.js`, Funktion `calculateRequiredBraetAmount()`

**Beispiel:**
- Gewünschtes Endprodukt: 200 kg
- Brätverlust: 2%
- **Benötigte Brät-Menge = 200 / (1 - 0,02) = 204,08 kg**

### 3.2 Kappen/Schnitt-Verlust

Bei geschnittenen Produkten (z.B. Lyoner) entsteht zusätzlicher Verlust durch Kappen.

**Formel:**
```
Endprodukt = Slicing-Menge × (1 - Kappenverlust%)

wobei:
Kappenverlust% = z.B. 0,09 für 9% Verlust
```

**Code-Referenz:** `script.js`, Funktion `calculateRequiredBraetAmount()`

**Beispiel:**
- Gewünschtes Endprodukt: 200 kg
- Kappenverlust: 9%
- Brätverlust: 2%
- **Benötigte Brät-Menge = 200 / [(1 - 0,09) × (1 - 0,02)] = 224,47 kg**

---

## 4. Gewürz-Berechnung

### 4.1 Gewürz-Anteil

Gewürze werden als Prozentsatz der Gesamtmasse (Fleisch + Gewürze) berechnet.

**Formel:**
```
Fleischmenge = Brät-Menge / (1 + Gewürzfaktor)
Gewürzmenge = Brät-Menge - Fleischmenge

wobei:
Gewürzfaktor = z.B. 0,03 für 3% Gewürze
Brät-Menge = Fleisch + Gewürze + Eis/Wasser
```

**Code-Referenz:** `script.js`, Funktion `getSpiceSettings()`

**Beispiel:**
- Brät-Menge (inkl. Gewürze): 204 kg
- Gewürzfaktor: 3%
- **Fleischmenge = 204 / 1,03 = 198,06 kg**
- **Gewürzmenge = 204 - 198,06 = 5,94 kg**

### 4.2 Erweiterte Gewürz-Berechnung

Wenn einzelne Gewürze separat eingegeben werden:

**Formel:**
```
Gesamt-Gewürze% = Salz% + Pfeffer% + Andere%
Kosten = (Salz-Menge × Salz-Preis) + (Pfeffer-Menge × Pfeffer-Preis) + ...
```

**Code-Referenz:** `script.js`, Funktion `updateAdvancedSpices()`

---

## 5. Optimierungs-Algorithmen

### 5.1 Maximale Wasser-Schüttung

**Ziel:** Maximiere die Wasserzugabe unter Einhaltung der Leitsätze

**Algorithmus:**
1. Berechne maximales Wasser basierend auf Protein-Ziel:
   ```
   Max_Wasser = Protein_aktuell × Wasser_ziel / Protein_ziel - Wasser_aktuell
   ```

2. Prüfe Nebenbedingungen:
   - Fett muss im Zielbereich sein
   - BEFFE muss über Minimum liegen
   - BE muss unter Maximum liegen

3. Iterative Anpassung, bis alle Bedingungen erfüllt sind

**Code-Referenz:** `script.js`, Funktion `generateWaterOptimizations()`

**Beispiel:**
- Aktuelle Mischung: 17,2% Eiweiß, 67,3% Wasser
- Ziel: 12% Eiweiß
- **Max. Wasser = 17,2 × 62 / 12 - 67,3 = 21,7% zusätzliches Wasser**

### 5.2 Kostenoptimierung

**Ziel:** Minimiere die Rohstoffkosten unter Einhaltung aller Qualitätsparameter

**Algorithmus:**
1. Erstelle Rezeptur aus Standardrohstoffen
2. Berechne Kosten pro kg:
   ```
   Kosten_gesamt = Σ(Menge_i × Preis_i)
   Kosten_pro_kg = Kosten_gesamt / Gesamt_Menge
   ```

3. Optimiere Mischungsverhältnis durch:
   - Minimierung der Rohstoffkosten
   - Maximierung günstiger Rohstoffe (z.B. Wasser, Fett)
   - Einhaltung aller Leitsatz-Vorgaben

**Code-Referenz:** `script.js`, Funktion `calculateCostOptimization()`

**Beispiel:**
- S III: 5,50 €/kg
- S VIII: 3,20 €/kg
- Wasser: 0,05 €/kg
- Optimale Mischung minimiert Kosten bei gleichbleibender Qualität

---

## 6. Validierung & Leitsatz-Prüfung

### 6.1 Leitsatz-Anforderungen

Für Brühwurst (z.B. Lyoner) gelten folgende Anforderungen:

```
- Min. Eiweiß: 10-12%
- Max. Fett: 25-30%
- Min. BEFFE: 8-10%
- Max. BE: 3-4%
- Wasser/Eiweiß-Verhältnis: < 5,0
```

### 6.2 Validierungs-Algorithmus

**Code-Referenz:** `script.js`, Funktion `generateOptimizationSuggestions()`

Für jede Optimierung wird geprüft:

```javascript
if (protein < target.protein - tolerance) → FEHLER
if (fat > target.fat + tolerance) → FEHLER  
if (beffe < target.beffe) → FEHLER
if (be > target.be) → FEHLER
```

---

## 7. Wasser/Eiweiß-Verhältnis (W/EW-Koeffizient)

### 7.1 Berechnung

**Formel:**
```
W/EW = Wasser% / Eiweiß%
```

**Code-Referenz:** `script.js`, Funktion `updateTotalMixture()`

**Beispiel:**
- Wasser: 67,3%
- Eiweiß: 17,2%
- **W/EW = 67,3 / 17,2 = 3,91**

**Bedeutung:** Der W/EW-Koeffizient darf für Brühwürste maximal 5,0 betragen (Leitsatz-Vorgabe). Je niedriger, desto höher ist der Fleischanteil.

---

## 8. Fett/Protein-Verhältnis

### 8.1 Berechnung

**Formel:**
```
F/P = Fett% / Eiweiß%
```

**Code-Referenz:** `script.js`, Funktion `updateTotalMixture()`

**Beispiel:**
- Fett: 14,5%
- Eiweiß: 17,2%
- **F/P = 14,5 / 17,2 = 0,84**

**Bedeutung:** Dieses Verhältnis gibt Auskunft über die "Magerkeit" des Produkts. Für magere Produkte sollte es < 1,0 sein.

---

## 9. Toleranzen & Pufferzonen

### 9.1 Einstellbare Toleranzen

Die App verwendet Toleranzen, um realistische Produktionsbedingungen zu berücksichtigen:

```
- Eiweiß-Toleranz: ±0,5%
- Fett-Toleranz: ±1,0%
- BEFFE-Toleranz: ±0,5%
```

**Code-Referenz:** `script.js`, Settings Modal

**Beispiel:**
- Ziel Eiweiß: 12,0%
- Mit Toleranz: 11,5% - 12,5% ist akzeptabel

---

## 10. Performance-Optimierungen

### 10.1 Caching

Die App speichert Berechnungen im LocalStorage, um wiederholte Berechnungen zu vermeiden.

### 10.2 Lazy Calculation

Berechnungen werden nur durchgeführt, wenn sich Eingabewerte ändern (Event-basiert).

---

## 11. Mathematische Grundlagen - Zusammenfassung

### Lineare Mischungsrechnung
```
Eigenschaft_Mix = Σ(Anteil_i × Eigenschaft_i)
wobei: Σ Anteil_i = 100%
```

### Proportionale Skalierung
```
Neue_Menge = Basis_Menge × Skalierungsfaktor
```

### Prozent-zu-Masse-Umrechnung
```
Masse = Gesamt_Masse × (Prozent / 100)
```

---

## 12. Datenquellen & Standards

- **Leitsätze für Fleisch und Fleischerzeugnisse** (Deutsches Lebensmittelbuch)
- **FOSS FoodScan/MeatMaster** Messwerte (geplante Integration)
- **DIN-Normen** für Fleischanalyse
- **Hydroxyprolin-Methode** zur BE-Bestimmung

---

## 13. Qualitätssicherung

### 13.1 Validierungs-Checks

Die App führt bei jeder Berechnung folgende Checks durch:

1. **Summen-Check**: Eiweiß + Fett + Wasser + Asche ≈ 100% (±2%)
2. **Plausibilitäts-Check**: Alle Werte > 0 und < 100
3. **Leitsatz-Check**: Alle Leitsatz-Anforderungen erfüllt
4. **BEFFE-Check**: BEFFE < Gesamteiweiß

### 13.2 Error Handling

Bei Fehlern gibt die App detaillierte Diagnosen aus:
- Was ist das Problem?
- Welche Werte sind außerhalb des Bereichs?
- Welche Lösungsvorschläge gibt es?

---

## 14. Beispiel-Berechnung (End-to-End)

### Szenario: 200 kg Lyoner produzieren

**1. Eingaben:**
- Rohstoff: S III (17,2% Eiweiß, 14,5% Fett, 67,3% Wasser, 1,0% BE)
- Verfügbare Menge: 1000 kg
- Zielprodukt: Lyoner (12% Eiweiß, 25% Fett, 62% Wasser, max. 3% BE, min. 8% BEFFE)
- Gewünschte Endmenge: 200 kg

**2. Verlust-Berechnung:**
```
Brätverlust: 2%
Kappenverlust: 9%
Benötigte Brät-Menge = 200 / [(1-0,09) × (1-0,02)] = 224,47 kg
```

**3. Gewürz-Berechnung:**
```
Gewürzfaktor: 3%
Fleischmenge = 224,47 / 1,03 = 217,93 kg
Gewürzmenge = 6,54 kg
```

**4. Optimierung:**
```
Aktuelle Werte von S III:
- Eiweiß: 17,2% (zu hoch)
- Fett: 14,5% (zu niedrig)
- Wasser: 67,3% (zu hoch)

Lösung: Wasser-Schüttung
- Max. Wasser-Zugabe berechnen
- Fett-Zugabe (S VIII) für Fettgehalt
- Finale Rezeptur erstellen
```

**5. Ergebnis:**
```
Optimierte Rezeptur (für 217,93 kg Fleisch):
- 160 kg S III
- 25 kg S VIII (Fett)
- 32,93 kg Wasser/Eis
+ 6,54 kg Gewürze
= 224,47 kg Brät

Finale Zusammensetzung:
- Eiweiß: 12,1% ✅
- Fett: 25,2% ✅
- Wasser: 62,0% ✅
- BEFFE: 11,1% ✅
- BE: 1,8% ✅

Kosten: 4,85 €/kg
```

---

## 15. Gewürz-Kalibrierung (NEU!)

### 15.1 Problem-Erkennung

Bei der Validierung mit 3 Test-Chargen wurde festgestellt:
**Gewürze haben einen massiven Einfluss auf die Qualitätsparameter!**

**Test-Setup:**
- **Halbe Gewürze**: 1,87% Gewürzanteil
- **Standard**: 3,75% Gewürzanteil
- **Doppelte Gewürze**: 7,5% Gewürzanteil

**Gemessene Unterschiede (Food Scan):**

| Parameter | Halb | Standard | Doppelt | Veränderung |
|-----------|------|----------|---------|-------------|
| **BE%** | 1,64% | 1,94% | 2,76% | **+69%** |
| **FETT%** | 23,17% | 23,22% | 22,63% | -2% |
| **Wasser%** | 61,66% | 60,90% | 59,62% | -3% |
| **Eiweiß%** | 12,51% | 12,07% | 11,57% | -8% |
| **BEFFE** | 10,88% | 10,13% | 8,81% | **-19%** |

**Kritische Erkenntnisse:**
1. ⚠️ **BEFFE sinkt um 19%** bei doppeltem Gewürzanteil!
2. ⚠️ **BE% steigt um 69%** → Gewürze haben sehr hohes BE%!
3. ⚠️ Bei zu viel Gewürz: **Leitsatz-Grenze unterschritten**!

---

### 15.2 Rückrechnung der Gewürz-Eigenschaften

**Fleischmischung (ohne Gewürze):**
Basierend auf Standard-Rezeptur (62,9% S III + 17,5% S IX + 19,6% Eis):
```
BE%: 1,21%
FETT%: 23,85%
Wasser%: 62,99%
Eiweiß%: 12,65%
BEFFE%: 11,44%
```

**Formel:**
```
Brät = Fleisch × (1 - Gewürz%) + Gewürze × Gewürz%

Umgestellt:
Gewürze = (Brät - Fleisch × (1 - Gewürz%)) / Gewürz%
```

**Rückgerechnete Gewürz-Eigenschaften (Durchschnitt aus 3 Chargen):**
```
BE%: 22,10%  ← Sehr hoch! (Pökelsalz, Phosphate, Bindemittel)
FETT%: 0,57%  ← Fast kein Fett
Wasser%: 5,77%  ← Sehr trocken
Eiweiß%: 0,19%  ← Fast kein Eiweiß
BEFFE%: 0%  ← Kein Muskeleiweiß (korrekt)
```

---

### 15.3 Validierung der Gewürz-Eigenschaften

**Vergleich: Gemessen vs. Berechnet (mit kalibrierten Gewürz-Werten)**

#### Halbe Gewürze (1,87%):
| Parameter | Gemessen | Berechnet | Abweichung |
|-----------|----------|-----------|------------|
| BE% | 1,64 | 1,61 | -0,03 ✅ |
| FETT% | 23,17 | 23,42 | +0,25 ✅ |
| Wasser% | 61,66 | 61,92 | +0,26 ✅ |
| Eiweiß% | 12,51 | 12,42 | -0,09 ✅ |
| BEFFE% | 10,88 | 10,82 | -0,06 ✅ |

#### Standard (3,75%):
| Parameter | Gemessen | Berechnet | Abweichung |
|-----------|----------|-----------|------------|
| BE% | 1,94 | 2,00 | +0,06 ✅ |
| FETT% | 23,22 | 22,98 | -0,24 ✅ |
| Wasser% | 60,90 | 60,84 | -0,06 ✅ |
| Eiweiß% | 12,07 | 12,18 | +0,11 ✅ |
| BEFFE% | 10,13 | 10,19 | +0,06 ✅ |

#### Doppelte Gewürze (7,5%):
| Parameter | Gemessen | Berechnet | Abweichung |
|-----------|----------|-----------|------------|
| BE% | 2,76 | 2,78 | +0,02 ✅ |
| FETT% | 22,63 | 22,11 | -0,52 ✅ |
| Wasser% | 59,62 | 58,70 | -0,92 ⚠️ |
| Eiweiß% | 11,57 | 11,72 | +0,15 ✅ |
| BEFFE% | 8,81 | 8,95 | +0,14 ✅ |

**Fazit:** Maximale Abweichung < 1% → **Modell ist sehr genau!** ✅

---

### 15.4 Rückrechnungs-Funktion

**Von Brät (mit Gewürzen) auf Fleisch (ohne Gewürze) zurückrechnen:**

**Formel:**
```
Fleisch-Wert = (Brät-Wert - Gewürz-Wert × Gewürz%) / (1 - Gewürz%)
```

**Beispiel:**
```
Gemessen am Brät (mit 3,75% Gewürzen):
BE% = 1,94%

Rückrechnung auf Fleisch:
Fleisch-BE = (1,94 - 22,10 × 0,0375) / 0,9625
          = (1,94 - 0,83) / 0,9625
          = 1,11 / 0,9625
          = 1,15%
```

**Anwendung in der App:**
Die Rückrechnungs-Funktion `calculateMeatFromBraet()` ermöglicht:
1. Food Scan Messung vom fertigen Brät
2. Automatische Rückrechnung auf reine Fleisch-Werte
3. Korrekte Optimierung ohne Gewürz-Einfluss

**Code-Referenz:** `script.js`, Funktion `calculateMeatFromBraet()`

---

### 15.5 Praktische Bedeutung für die Produktion

**Vor der Kalibrierung:**
- ❌ Gewürze wurden mit falschen Werten modelliert
- ❌ BEFFE-Verdünnung nicht berücksichtigt
- ❌ BE-Anstieg durch Gewürze ignoriert
- ❌ Risiko: Leitsatz-Verstöße bei hohem Gewürzanteil

**Nach der Kalibrierung:**
- ✅ Gewürze mit korrekten, gemessenen Werten
- ✅ BEFFE-Verdünnung wird korrekt berechnet
- ✅ BE-Anstieg durch Gewürze einkalkuliert
- ✅ Warnung bei zu hohem Gewürzanteil
- ✅ Validierung mit realen Produktionsdaten

**Empfehlung:**
Gewürzanteil sollte zwischen **2-5%** liegen, um:
- BEFFE nicht zu stark zu verdünnen
- BE nicht zu stark ansteigen zu lassen
- Leitsatz-Anforderungen sicher einzuhalten

---

## 16. Validierungs-Tab in der App

In den Einstellungen der App gibt es jetzt einen **Validierungs-Tab (🧪)**:

**Features:**
1. Anzeige der 3 Test-Chargen
2. Vergleich gemessene vs. berechnete Werte
3. Farbkodierte Abweichungen (grün = gut, gelb = ok, rot = Abweichung)
4. Anzeige der kalibrierten Gewürz-Eigenschaften

**Verwendung:**
1. Einstellungen öffnen (⚙️ oder `Strg+,`)
2. Tab "🧪 Validierung" wählen
3. Button "Validierung durchführen" klicken
4. Ergebnisse prüfen

**Für die Präsentation ideal:**
- Zeigt wissenschaftliche Arbeitsweise
- Beweist Genauigkeit des Modells
- Dokumentiert den Kalibrierungs-Prozess

---

## 17. Weiterführende Informationen

### Code-Dateien
- `script.js` - Alle Berechnungen und Algorithmen
- `style.css` - UI und Visualisierung
- `index.html` - Struktur und Eingabefelder

### Dokumentation
- `README.md` - Projektübersicht
- `RECHENFORMELN.md` - Diese Datei
- Inline-Kommentare im Code für Details

---

## 16. BE-Korrektur für gewürzte Proben (NEU!)

### 16.1 Problem-Hintergrund

**Wissenschaftliche Erkenntnis aus Versuchsreihe:**
Wenn fertiges Brät (mit Standard-Gewürzen) im FOSS gemessen wird, zeigt das Gerät einen **systematisch zu hohen BE-Wert** an.

**Ursache:**
- Die Standard-Gewürzmischung hat einen hohen BE%-Gehalt (22,10%)
- Bei 3,75% Gewürzanteil (Standard-Dosis) ergibt das einen **Offset von +0,84%** im gemessenen BE-Wert
- Dies ist ein **Messfehler** (Fehlinterpretation), kein realer BE-Gehalt!

**Berechnung des Offsets:**
```
Gewürz-BE-Beitrag = Gewürz% × BE%_Gewürz
                  = 3,75% × 22,10%
                  = 0,8287% ≈ 0,84%
```

---

### 16.2 Korrektur-Formel

**Wenn "Standard-Gewürze enthalten?" aktiviert:**

```
BE_korrigiert = BE_gemessen - 0,84

wobei:
BE_gemessen = Wert aus FOSS-Messung
0,84 = Gewürz-Offset (empirisch ermittelt)
BE_korrigiert = "Wahrer" BE-Wert des Fleisches
```

**BEFFE wird mit korrigiertem BE neu berechnet:**
```
BEFFE_korrigiert = Protein% - BE_korrigiert
```

**Code-Referenz:** `script.js`, Funktionen `applyGewuerzKorrektur()` und `calculateCurrentBEFFE()`

---

### 16.3 Wichtig: Protein wird NICHT korrigiert!

**Wissenschaftliche Begründung:**

| Parameter | Korrektur? | Grund |
|-----------|-----------|-------|
| **BE%** | ✅ JA | Messfehler (Fehlinterpretation) |
| **Protein%** | ❌ NEIN | Realer Verdrängungseffekt! |
| **BEFFE%** | ✅ JA | Folgeberechnung aus korrigiertem BE |

**Erklärung:**
- **BE-Erhöhung**: Das FOSS interpretiert Gewürz-Bestandteile fälschlicherweise als Bindegewebe
- **Protein-Senkung**: Gewürze verdrängen echtes Fleisch → weniger Protein ist real vorhanden

**Beispiel:**
```
Messung (mit Gewürzen):
- BE%: 2,50%
- Protein%: 12,0%
- BEFFE%: 9,50%

Nach Korrektur:
- BE%: 2,50% - 0,84% = 1,66% ✅ korrigiert
- Protein%: 12,0% ❌ bleibt gleich!
- BEFFE%: 12,0% - 1,66% = 10,34% ✅ neu berechnet
```

---

### 16.4 Anwendungsfälle

**Wann Checkbox AKTIVIEREN:**
- ✅ Messung von fertigem Brät (nach Gewürzzugabe)
- ✅ Probe enthält Standard-Gewürzmischung (3,75%)
- ✅ Du willst den "wahren" Fleisch-BE-Wert wissen

**Wann Checkbox DEAKTIVIEREN:**
- ❌ Messung von reinem Fleisch (vor Gewürzzugabe)
- ❌ Andere Gewürzdosierung als Standard
- ❌ Manuelle FOSS-Kalibrierung wurde bereits durchgeführt

---

### 16.5 Visualisierung in der App

Die App zeigt die Korrektur transparent an:

```
☑ Standard-Gewürze enthalten? (BE-Korrektur: -0,84%)

┌─────────────────────────────────────────┐
│ Original: 2,50%  →  Korrigiert: 1,66%  │
└─────────────────────────────────────────┘
```

**Vorteile:**
- ✅ Sofortige Live-Korrektur beim Aktivieren
- ✅ Klare Visualisierung: Original → Korrigiert
- ✅ Gilt automatisch für alle Berechnungen (Optimierung, Validierung, etc.)
- ✅ Pro Rohstoff einzeln aktivierbar (flexibel!)

---

### 16.6 Auswirkung auf Berechnungen

**Die Checkbox-Korrektur wird automatisch berücksichtigt in:**

1. **BEFFE-Berechnung** (`calculateCurrentBEFFE()`)
2. **Mischungs-Berechnung** (`getAllMaterials()`)
3. **Optimierung** (alle Optimierungs-Algorithmen)
4. **Leitsatz-Compliance** (Grenzwert-Prüfungen)
5. **W/EW-Koeffizient** (indirekt über BEFFE)

**Implementierung:**
```javascript
// In getAllMaterials()
let beValue = parseFloat(beElement.value) || 0;
const gewuerzToggle = document.getElementById(`gewuerz-toggle-${index}`);
if (gewuerzToggle && gewuerzToggle.checked) {
    beValue = beValue - 0.84; // Gewürz-Offset abziehen
}
```

---

### 16.7 Validierung & Qualitätssicherung

**Kontrolle ob Korrektur sinnvoll ist:**

Nach Korrektur sollte gelten:
```
BEFFE_korrigiert > BEFFE_original
BE_korrigiert < BE_original
```

**Beispiel:**
```
Vorher: BE=2,50%, BEFFE=9,50%
Nachher: BE=1,66%, BEFFE=10,34% ✅

→ Plausibilitätsprüfung: OK!
```

Falls BEFFE sinkt → Korrektur wahrscheinlich falsch angewendet!

---

## 17. Kombinations-Algorithmus für Brät-Korrektur (NEU!)

### 17.1 Problem: Ein Material reicht nicht!

**Mathematisches Grundproblem:**
Mit **einem** Material kannst du **nicht** alle 5 Parameter gleichzeitig optimieren!

**Beispiel:**
```
Ist:   BE=1,91%  BEFFE=11,0%  Protein=12,12%  Fett=25,3%  Wasser=59%
Ziel:  BE=3,0%   BEFFE=8,0%   Protein=12,0%   Fett=20,0%  Wasser=62%

Wenn du nur S III hinzufügst:
✅ Protein passt besser
✅ BEFFE sinkt
❌ Aber: Fett steigt auch (unerwünscht!)
❌ BE steigt zu wenig
❌ Wasser passt nicht

→ Nur 1-2 von 5 Zielen erreicht!
```

**Lösung:** Kombiniere **mehrere** Materialien!

---

### 17.2 Kombinations-Algorithmus

**Idee:** Teste **alle** möglichen Kombinationen von S III + S IX

**Pseudo-Code:**
```
Für jede S III Menge (0 bis 5%, Schritt 0,25%):
    Für jede S IX Menge (0 bis 5%, Schritt 0,25%):
        
        1. Berechne neue Werte:
           BE_neu = (Brät×BE_brät + S3×BE_s3 + S9×BE_s9) / (Brät+S3+S9)
           BEFFE_neu = ... (analog)
           Protein_neu = ...
           Fett_neu = ...
           Wasser_neu = ...
        
        2. Bewerte Zielerreichung:
           Für jeden Parameter:
               Abweichung = |Ist - Ziel|
               Erreicht? = Abweichung ≤ 0,5%
               Score += Wichtung × (100 - Abweichung×20)
        
        3. Speichere wenn Score > 25%

Sortiere alle Optionen nach:
1. Anzahl erreichter Ziele (wichtigster Faktor!)
2. Gesamt-Score
3. Bevorzuge Kombinationen
4. Geringere Menge

Zeige beste 5 Optionen
```

---

### 17.3 Scoring-System

**Wichtung der Parameter:**

| Parameter | Wichtung | Begründung |
|-----------|----------|------------|
| **BE%** | 3 | Kritisch für Leitsatz-Compliance |
| **BEFFE%** | 3 | Kritisch für Leitsatz-Compliance |
| **Protein%** | 2 | Wichtig für Nährwert |
| **Fett%** | 2 | Wichtig für Nährwert & Textur |
| **Wasser%** | 1 | Weniger kritisch |

**Score-Berechnung:**
```
Für jeden Parameter:
    Max-Score = Wichtung × 100
    
    Wenn Ziel erreicht (Abweichung ≤ 0,5%):
        Score += Max-Score  (volle Punkte!)
    
    Sonst:
        Teilpunkte = max(0, 100 - Abweichung × 20)
        Score += Wichtung × Teilpunkte

Gesamt-Score = (Score / Max-möglich) × 100%
```

**Beispiel:**
```
BE:     Abweichung 0,10% → erreicht! → 3 × 100 = 300 Punkte
BEFFE:  Abweichung 0,05% → erreicht! → 3 × 100 = 300 Punkte
Protein: Abweichung 0,15% → erreicht! → 2 × 100 = 200 Punkte
Fett:   Abweichung 1,2%  → nicht erreicht → 2 × 76 = 152 Punkte
Wasser: Abweichung 2,5%  → nicht erreicht → 1 × 50 = 50 Punkte

Gesamt: 1002 / 1100 = 91% Score
Erreicht: 3/5 Ziele
```

---

### 17.4 Performance-Optimierung

**Problem:** Viele Kombinationen = lange Rechenzeit?

**Lösung:**
```
Schrittweite: 0,25% (nicht 0,01%)
Max-Addition: 5% pro Material
Max-Gesamt: 10% 

→ Anzahl Tests: ~21 × 21 = ~441 pro Material
→ Mit Filter: ~1600 Kombinationen
→ Rechenzeit: < 100ms ✅
```

**Optimierungen:**
1. Skip wenn beide = 0
2. Skip wenn Gesamt > 10%
3. Nur speichern wenn Score > 25%
4. Frühzeitig abbrechen bei perfektem Score

---

### 17.5 Ausgabe & Visualisierung

**Sortier-Logik:**
```
1. Anzahl erreichter Ziele (5/5 vor 4/5 vor 3/5 ...)
2. Gesamt-Score (bei gleicher Anzahl)
3. Kombinationen bevorzugen (S III + S IX vor nur S III/S IX)
4. Geringere Menge (weniger Zugabe = besser)
```

**Anzeige:**
```
🌟 Option 1: S III + S IX  [EMPFOHLEN] [🌟 KOMBINATION]
   HINZUFÜGEN: 0,08 kg S III + 0,12 kg S IX
   
   ZIELERREICHUNG: 4/5 Ziele (85% Match)
   
   ✅ BE%:      1,91% → 3,02% (Ziel: 3,0%)
   ✅ BEFFE%:   11,0% → 8,05% (Ziel: 8,0%)
   ✅ Protein%: 12,1% → 12,03% (Ziel: 12,0%)
   ✅ Fett%:    25,3% → 20,15% (Ziel: 20,0%)
   ⚠️ Wasser%:  59,0% → 61,80% (Ziel: 62,0%)
   
   NEUE GESAMT-MENGE: 20,20 kg (+1,0%)
```

---

### 17.6 Vergleich: Vorher vs. Nachher

**VORHER (nur einzelne Materialien):**
```
Option 1: + 0,10 kg S III
   Zielerreichung: 1/5 Ziele (32% Match) ❌
   ✅ Protein: OK
   ❌ BE, BEFFE, Fett, Wasser: Nicht erreicht
```

**NACHHER (Kombinationen):**
```
Option 1: + 0,08 kg S III + 0,12 kg S IX
   Zielerreichung: 4/5 Ziele (85% Match) ✅
   ✅ BE, BEFFE, Protein, Fett: OK
   ⚠️ Wasser: Fast erreicht (61,8% statt 62%)
```

**Verbesserung:** Von 20% auf 80% Zielerreichung! 🎯

---

**Version:** 1.2.0  
**Stand:** Januar 2025 (BE-Korrektur + Kombinations-Algorithmus)  
**Erstellt für:** Meilenstein-Präsentation  
**Autoren:** Jan Sebald, Jonas Gagesch
