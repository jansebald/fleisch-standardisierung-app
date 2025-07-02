# 🥩 Fleisch-Standardisierungs Web-App

**Automatisierte Rohstoffstandardisierung per App nach firmeninternen Vorgaben unter Berücksichtigung der Leitsätze**

Eine Web-Anwendung zur Optimierung von Fleischmischungen in der Fleischindustrie mit Fokus auf Eiweiß-, Fett- und Wassergehalt sowie Leitsatz-Compliance.

![App Screenshot](docs/screenshot.png)

## 🎯 Projektübersicht

### Problem
In der Fleischindustrie schwanken die Qualitätsparameter angelieferter BigBoxen erheblich. Statt der spezifizierten 70/30-Mischung (70% Magerfleisch, 30% Fett) werden oft 68/32 oder 72/28 geliefert. Dies führt zu:
- Leitsatz-Verstößen
- Suboptimalen Produktkosten
- Qualitätsschwankungen im Endprodukt

### Lösung
Diese Web-App optimiert Fleischmischungen basierend auf:
- **FOSS-Messwerten** (FoodScan/MeatMaster Integration geplant)
- **Leitsatz-Anforderungen** für Fleischerzeugnisse
- **Kostenoptimierung** bei gleichzeitiger Qualitätssicherung

## 🔬 Technische Features

### Berechnungen
- **BEFFE-Gehalt**: Bindegewebseiweißfreies Fleischeiweiß
- **W/EW-Koeffizient**: Wasser/Eiweiß-Verhältnis
- **BE/FE-Verhältnis**: Bindegewebe/Fleischeiweiß-Verhältnis
- **Leitsatz-Compliance**: Automatische Grenzwert-Prüfung

### Optimierung
- Kostenminimierung unter Nebenbedingungen
- Automatische Mischungsverhältnis-Berechnung
- Qualitätsparameter-Vorhersage
- Einsparungspotential-Analyse

## 🚀 Live-Demo

**[Demo hier ausprobieren](https://IhrUsername.github.io/fleisch-standardisierung-app)**

## 📋 Anforderungen

- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Keine Installation erforderlich
- Responsive Design (Desktop, Tablet, Smartphone)

## 🛠️ Installation & Entwicklung

### Lokale Entwicklung
```bash
# Repository klonen
git clone https://github.com/IhrUsername/fleisch-standardisierung-app.git
cd fleisch-standardisierung-app

# Mit Live Server öffnen (VS Code Extension)
# Oder einfach index.html im Browser öffnen
```

### Technologie-Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Responsive CSS Grid/Flexbox
- **Optimierung**: Linear Programming Algorithmus
- **Hosting**: GitHub Pages

## 📊 Anwendungsbeispiel

### Eingabe (FOSS-Messung):
```
BigBox 1 (Magerfleisch): 18,5% Eiweiß, 7,2% Fett, 0,085% Hydroxyprolin
BigBox 2 (Fettanteil):   1,8% Eiweiß, 82,5% Fett, 0,022% Hydroxyprolin
Zielprodukt (Lyoner):    12% Eiweiß, 25% Fett, min. 10% BEFFE
```

### Ausgabe (Optimierung):
```
Optimale Mischung: 73,2% BigBox 1 + 26,8% BigBox 2
Resultat: 12,1% Eiweiß, 25,3% Fett, 10,2% BEFFE ✅
Kosteneinsparung: +0,08 €/kg (2,1% günstiger als Standard-Rezeptur)
```

## 🎓 Projektkontext

**Schulprojekt** im Rahmen der Fleischtechnologie-Ausbildung
- **Fokus**: Praxisrelevante Digitalisierung der Fleischindustrie
- **Zielgruppe**: Fleischverarbeitende Betriebe, Qualitätskontrolle
- **Erweiterbarkeit**: FOSS-Geräte-Integration, KI-basierte Optimierung

## 🔮 Roadmap & Geplante Features

### Phase 1 (Aktuell)
- [x] Grundlegende BEFFE-Berechnungen
- [x] Zwei-Komponenten-Optimierung
- [x] Responsive Web-Interface
- [x] Kostenanalyse

### Phase 2 (In Entwicklung)
- [ ] FOSS MeatMaster/FoodScan API-Integration
- [ ] Mehrkomponenten-Optimierung (3+ Rohstoffe)
- [ ] Historische Datenauswertung
- [ ] PDF-Export für Produktionsprotokolle

### Phase 3 (Geplant)
- [ ] Machine Learning für Qualitätsprognosen
- [ ] Echzeit-Dashboard für Produktion
- [ ] Mobile App (PWA)
- [ ] ERP-System Integration

## 📚 Wissenschaftliche Grundlagen

### Formeln
```
BEFFE = Gesamteiweiß - Bindegewebseiweiß
Bindegewebseiweiß = Hydroxyprolin × 8
W/EW-Koeffizient = Wassergehalt / Eiweißgehalt
BE/FE-Verhältnis = Bindegewebseiweiß / (Gesamteiweiß - Bindegewebseiweiß)
```

### Leitsätze
Basierend auf den "Leitsätzen für Fleisch und Fleischerzeugnisse" des Deutschen Lebensmittelbuchs.

## 🤝 Mitwirkende

- **Entwicklung**: [Ihr Name]
- **Fachberatung**: [Lehrer/Betreuer]
- **Testing**: [Projektteam]

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt. Kommerzielle Nutzung nach Absprache möglich.

## 🔗 Weiterführende Links

- [Leitsätze für Fleisch und Fleischerzeugnisse](https://www.bmel.de/DE/themen/ernaehrung/lebensmittel-kennzeichnung/deutsches-lebensmittelbuch/leitsaetze-fleisch.html)
- [FOSS Analytical Solutions](https://www.foss.de/)
- [Projektdokumentation](docs/)

---

**Erstellt im Rahmen der Fleischtechnologie-Ausbildung | 2025**

*Bei Fragen oder Verbesserungsvorschlägen gerne ein Issue erstellen oder Pull Request einreichen!*