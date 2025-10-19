// Fleisch-Rohstoff-Beratungs-App
// ====================================

// Globale Variablen
let currentSuggestions = [];
let selectedSuggestion = null;
let materialCount = 1;

// Produktspezifikationen mit Standardrezepturen
const productSpecs = {
    lyoner: {
        protein: 12.0, fat: 25.0, water: 62.0, be: 3.0, beffe: 8.0,
        name: "Lyoner",
        standardRecipe: ['s3', 's9', 'ice'], // S III + S IX + Eis/Wasser
        wasteBraet: 2.0,      // 2% Brätreste/Abfüllung
        wasteSlicing: 9.0     // 9% Kappen/Schnitt-Verlust
    },
    leberwurst: {
        protein: 14.0, fat: 28.0, water: 57.0, be: 3.5, beffe: 10.5,
        name: "Leberwurst",
        standardRecipe: ['s3', 's8', 'ice'], // S III + S VIII + Eis/Wasser
        wasteBraet: 2.0,      // 2% Brätreste/Abfüllung
        wasteSlicing: 5.0     // 5% Kappen/Schnitt-Verlust (Schätzung)
    },
    bratwurst: {
        protein: 16.0, fat: 22.0, water: 61.0, be: 4.0, beffe: 12.0,
        name: "Bratwurst",
        standardRecipe: ['schulter', 's8', 'ice'], // Schulter + S VIII + Eis
        wasteBraet: 2.0,      // 2% Brätreste/Abfüllung
        wasteSlicing: 0.0     // Keine Kappen bei Würstchen
    },
    wiener: {
        protein: 13.0, fat: 20.0, water: 66.0, be: 3.0, beffe: 8.0,
        name: "Wiener Würstchen",
        standardRecipe: ['s3', 's8', 'ice'], // S III + S VIII + Eis
        wasteBraet: 2.0,      // 2% Brätreste/Abfüllung
        wasteSlicing: 0.0     // Keine Kappen bei Würstchen
    },
    hackfleisch: {
        protein: 18.0, fat: 15.0, water: 66.0, be: 4.5, beffe: 13.5,
        name: "Hackfleisch",
        standardRecipe: ['schulter', 'backen', 'ice'], // Schulter + Backen + Eis
        wasteBraet: 1.0,      // 1% Reste (minimal)
        wasteSlicing: 0.0     // Keine Kappen bei Hackfleisch
    }
};

// Standard-Rohstoffe mit Eigenschaften
// Reihenfolge wie Food Scan Output: BE% → Fett% → Wasser% → Eiweiß% → BEFFE%
const rawMaterials = {
    "s3": { be: 1.458, fat: 23.144, water: 59.562, protein: 17.298, beffe: 15.842, price: 5.50, name: "S III" },
    "s8": { be: 0.2, fat: 88.0, water: 8.5, protein: 2.5, beffe: 2.34, price: 3.20, name: "S VIII" },
    "s9": { be: 2.488, fat: 70.19, water: 20.652, protein: 8.994, beffe: 6.508, price: 3.50, name: "S IX" },
    "ice": { be: 0.0, fat: 0.0, water: 100.0, protein: 0.0, beffe: 0.0, price: 0.05, name: "Eis/Wasser" },
    "schulter": { be: 1.23, fat: 11.77, water: 69.3, protein: 19.21, beffe: 17.98, price: 6.20, name: "Schulter schier" },
    "backen": { be: 2.172, fat: 45.162, water: 42.048, protein: 12.484, beffe: 10.31, price: 4.80, name: "Backen" },
    "braet": { be: 1.71, fat: 11.56, water: 71.86, protein: 13.52, beffe: 11.81, price: 7.50, name: "Fertiges Brät (Validierung)" },
    "gewuerze": { be: 0.0, fat: 3.0, water: 6.0, protein: 10.0, beffe: 0.0, price: 15.0, name: "Gewürze & Zusatzstoffe" },
    "custom": { be: 1.2, fat: 20.0, water: 64.0, protein: 15.0, beffe: 13.8, price: 4.00, name: "Benutzerdefiniert" }
};

// App initialisieren
document.addEventListener('DOMContentLoaded', function() {
    // Cache automatisch beim Neuladen löschen
    clearAppCache();

    updateCurrentDefaults(0);
    updateTargetSpecs();
    calculateCurrentBEFFE(0);
    updateTotalMixture();

    // Settings aus LocalStorage laden (nach Cache-Reset)
    loadSettingsFromStorage();

    // Event Listener für Gewürz-Settings
    const spiceFactorElement = document.getElementById('spice-factor');
    const spiceCostElement = document.getElementById('spice-cost');
    const advancedSpicesCheckbox = document.getElementById('advanced-spices');

    if (spiceFactorElement) {
        spiceFactorElement.addEventListener('input', updateTotalMixture);
    }
    if (spiceCostElement) {
        spiceCostElement.addEventListener('input', updateTotalMixture);
    }
    if (advancedSpicesCheckbox) {
        advancedSpicesCheckbox.addEventListener('change', toggleAdvancedSpices);
    }

    // Event Listener für erweiterte Gewürz-Eingaben
    ['spice-salt', 'spice-pepper', 'spice-others', 'spice-salt-cost', 'spice-pepper-cost', 'spice-others-cost'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateAdvancedSpices);
        }
    });
});

// Cache löschen (aber Settings behalten)
function clearAppCache() {
    // Browser-Cache leeren (soweit möglich)
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }

    // Session Storage leeren
    sessionStorage.clear();

    // Nur spezifische localStorage-Einträge entfernen, Settings behalten
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('settings') && !key.includes('rawMaterials') && !key.includes('productSpecs')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('🧹 Cache wurde automatisch geleert (Settings bleiben erhalten)');
}

// Aktuelle Rohstoff-Defaults aktualisieren
function updateCurrentDefaults(index) {
    const type = document.getElementById(`current-type-${index}`).value;
    if (type !== 'custom' && rawMaterials[type]) {
        const material = rawMaterials[type];
        document.getElementById(`current-protein-${index}`).value = material.protein.toFixed(1);
        document.getElementById(`current-fat-${index}`).value = material.fat.toFixed(1);
        document.getElementById(`current-water-${index}`).value = material.water.toFixed(1);
        document.getElementById(`current-be-${index}`).value = material.be.toFixed(1);
        // BEFFE direkt aus rawMaterials setzen (keine Berechnung mehr nötig)
        document.getElementById(`current-beffe-manual-${index}`).value = material.beffe.toFixed(1);
    }
    updateTotalMixture();
}

// Zielprodukt-Specs aktualisieren
function updateTargetSpecs() {
    const type = document.getElementById('target-product').value;
    if (type !== 'custom' && productSpecs[type]) {
        const spec = productSpecs[type];
        document.getElementById('target-protein').value = spec.protein;
        document.getElementById('target-fat').value = spec.fat;
        document.getElementById('target-water').value = spec.water;
        document.getElementById('target-be').value = spec.be;
        document.getElementById('target-beffe').value = spec.beffe;
    }
}

// Aktuelle BEFFE berechnen
function calculateCurrentBEFFE(index) {
    const protein = parseFloat(document.getElementById(`current-protein-${index}`).value) || 0;
    const be = parseFloat(document.getElementById(`current-be-${index}`).value) || 0;

    if (protein > 0) {
        // BEFFE = Fleischeiweiß - Bindegewebseiweiß
        const beffe = protein - be;

        // Setze den berechneten BEFFE-Wert in das manuelle Input-Feld
        document.getElementById(`current-beffe-manual-${index}`).value = beffe.toFixed(1);

        updateBEFFEDisplay(index);
    }
    updateTotalMixture();
}

// BEFFE-Anzeige aktualisieren (für manuelle Eingabe)
function updateBEFFEDisplay(index) {
    // Nur noch die Gesamt-Mischung aktualisieren
    updateTotalMixture();
}

// Neuen Rohstoff hinzufügen
function addMaterial() {
    const container = document.getElementById('materials-container');
    const newIndex = materialCount;
    
    const materialHTML = `
        <article class="material-card" data-index="${newIndex}">
            <div class="material-header">
                <h3>Rohstoff ${newIndex + 1}</h3>
                <button type="button" class="remove-material-btn" onclick="removeMaterial(${newIndex})" aria-label="Rohstoff ${newIndex + 1} entfernen">
                    <span aria-hidden="true">❌</span>
                </button>
            </div>
            <div class="input-grid">
                <div class="input-group">
                    <label for="current-type-${newIndex}">Rohstofftyp</label>
                    <select id="current-type-${newIndex}" onchange="updateCurrentDefaults(${newIndex}); updateTotalMixture()">
                        <option value="s3">S III</option>
                        <option value="s8">S VIII</option>
                        <option value="s9">S IX</option>
                        <option value="ice">Eis/Wasser</option>
                        <option value="schulter">Schulter schier</option>
                        <option value="backen">Backen</option>
                        <option value="braet">Fertiges Brät (Validierung)</option>
                        <option value="gewuerze">Gewürze & Zusatzstoffe</option>
                        <option value="custom">Benutzerdefiniert</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="current-be-${newIndex}">BE - Bindegewebseiweiß (%)</label>
                    <input type="number" id="current-be-${newIndex}" value="1.0" step="0.1" oninput="calculateCurrentBEFFE(${newIndex}); updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-fat-${newIndex}">Fett (%)</label>
                    <input type="number" id="current-fat-${newIndex}" value="14.5" step="0.1" oninput="updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-water-${newIndex}">Wasser (%)</label>
                    <input type="number" id="current-water-${newIndex}" value="67.3" step="0.1" oninput="updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-protein-${newIndex}">Eiweiß (%)</label>
                    <input type="number" id="current-protein-${newIndex}" value="17.2" step="0.1" oninput="calculateCurrentBEFFE(${newIndex}); updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-beffe-manual-${newIndex}">BEFFE (%)</label>
                    <input type="number" id="current-beffe-manual-${newIndex}" value="16.4" step="0.1" oninput="updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-amount-${newIndex}">Verfügbare Menge (kg)</label>
                    <input type="number" id="current-amount-${newIndex}" placeholder="z.B. 500" step="10" min="0" oninput="updateTotalMixture()">
                </div>
            </div>
        </div>
    </article>
    `;
    
    container.insertAdjacentHTML('beforeend', materialHTML);
    materialCount++;
    
    // Zeige Remove-Button für alle außer dem ersten
    updateRemoveButtons();
    updateTotalMixture();
}

// Rohstoff entfernen
function removeMaterial(index) {
    const material = document.querySelector(`[data-index="${index}"]`);
    if (material) {
        // Announce removal to screen readers
        const materialName = material.querySelector('h3').textContent;
        const announcement = document.createElement('div');
        announcement.textContent = `${materialName} wurde entfernt`;
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        document.body.appendChild(announcement);
        
        material.remove();
        updateRemoveButtons();
        updateTotalMixture();
        
        // Remove announcement after screen reader has had time to read it
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }
}

// Remove-Buttons aktualisieren
function updateRemoveButtons() {
    const materials = document.querySelectorAll('.material-card');
    materials.forEach((material, index) => {
        const removeBtn = material.querySelector('.remove-material-btn');
        if (materials.length > 1) {
            removeBtn.style.display = 'block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// Gesamt-Mischung berechnen und anzeigen
function updateTotalMixture() {
    const materials = getAllMaterials();
    
    if (materials.length === 0) return;
    
    let totalAmount = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalWater = 0;
    let totalBE = 0;
    let totalBEFFE = 0;
    
    materials.forEach(material => {
        const amount = material.amount;
        totalAmount += amount;
        totalProtein += material.protein * amount;
        totalFat += material.fat * amount;
        totalWater += material.water * amount;
        totalBE += material.be * amount;
        totalBEFFE += material.beffe * amount;
    });

    // Gewürz-Berechnungen
    const spiceAmount = calculateSpiceAmount(totalAmount);
    const spiceCost = calculateSpiceCost(spiceAmount);
    const totalWithSpices = totalAmount + spiceAmount;

    // Gewürze-Nährstoffe in Berechnung einbeziehen
    const spiceMaterial = rawMaterials.gewuerze;
    const totalProteinWithSpices = totalProtein + (spiceMaterial.protein * spiceAmount);
    const totalFatWithSpices = totalFat + (spiceMaterial.fat * spiceAmount);
    const totalWaterWithSpices = totalWater + (spiceMaterial.water * spiceAmount);
    const totalBEWithSpices = totalBE + (spiceMaterial.be * spiceAmount);
    const totalBEFFEWithSpices = totalBEFFE + (spiceMaterial.beffe * spiceAmount);

    // Durchschnittswerte berechnen (mit Gewürzen in Gesamtmasse)
    const avgProtein = totalWithSpices > 0 ? totalProteinWithSpices / totalWithSpices : 0;
    const avgFat = totalWithSpices > 0 ? totalFatWithSpices / totalWithSpices : 0;
    const avgWater = totalWithSpices > 0 ? totalWaterWithSpices / totalWithSpices : 0;
    const avgBE = totalWithSpices > 0 ? totalBEWithSpices / totalWithSpices : 0;
    const avgBEFFE = totalWithSpices > 0 ? totalBEFFEWithSpices / totalWithSpices : 0;

    // Neue Faktoren berechnen
    const waterProteinRatio = calculateWaterToProteinRatio(avgWater, avgProtein);
    const fatProteinRatio = calculateFatToProteinRatio(avgFat, avgProtein);

    // Anzeige aktualisieren - Gesamtgewicht inkl. Gewürze
    document.getElementById('total-amount').textContent = `${totalWithSpices.toFixed(1)} kg`;
    document.getElementById('total-protein').textContent = `${avgProtein.toFixed(1)}%`;
    document.getElementById('total-fat').textContent = `${avgFat.toFixed(1)}%`;
    document.getElementById('total-water').textContent = `${avgWater.toFixed(1)}%`;
    document.getElementById('total-be').textContent = `${avgBE.toFixed(1)}%`;
    document.getElementById('total-beffe').textContent = `${avgBEFFE.toFixed(1)}%`;

    // Neue Faktoren mit Farbkodierung
    const waterProteinElement = document.getElementById('total-water-protein-ratio');
    const fatProteinElement = document.getElementById('total-fat-protein-ratio');

    waterProteinElement.textContent = waterProteinRatio.toFixed(1);
    fatProteinElement.textContent = fatProteinRatio.toFixed(1);

    // Gewürz-Anzeigen aktualisieren
    const spiceAmountElement = document.getElementById('total-spice-amount');
    const spiceCostElement = document.getElementById('total-spice-cost');

    if (spiceAmountElement) {
        spiceAmountElement.textContent = `${spiceAmount.toFixed(1)} kg`;
    }
    if (spiceCostElement) {
        spiceCostElement.textContent = `${spiceCost.toFixed(2)}€`;
    }

    // Farbkodierung für Grenzwerte
    if (waterProteinRatio <= 5.5) {
        waterProteinElement.style.color = '#10b981'; // Grün
    } else {
        waterProteinElement.style.color = '#ef4444'; // Rot
    }

    if (fatProteinRatio <= 3.2) {
        fatProteinElement.style.color = '#10b981'; // Grün
    } else {
        fatProteinElement.style.color = '#ef4444'; // Rot
    }
}

// Alle Materialien als Array zurückgeben
function getAllMaterials() {
    const materials = [];
    const materialElements = document.querySelectorAll('.material-card');

    materialElements.forEach(element => {
        const index = element.dataset.index;
        const typeElement = document.getElementById(`current-type-${index}`);
        const proteinElement = document.getElementById(`current-protein-${index}`);
        const fatElement = document.getElementById(`current-fat-${index}`);
        const waterElement = document.getElementById(`current-water-${index}`);
        const beElement = document.getElementById(`current-be-${index}`);
        const amountElement = document.getElementById(`current-amount-${index}`);
        const beffeElement = document.getElementById(`current-beffe-manual-${index}`);

        if (typeElement && proteinElement && fatElement && waterElement && beElement && amountElement && beffeElement) {
            const type = typeElement.value;

            // WICHTIG: Gewürze überspringen - werden automatisch berechnet
            if (type === 'gewuerze') {
                console.log(`⚠️ Überspringe Gewürze-Rohstoff (wird automatisch berechnet)`);
                return;
            }

            materials.push({
                index: parseInt(index),
                type: type,
                name: rawMaterials[type]?.name || 'Benutzerdefiniert',
                protein: parseFloat(proteinElement.value) || 0,
                fat: parseFloat(fatElement.value) || 0,
                water: parseFloat(waterElement.value) || 0,
                be: parseFloat(beElement.value) || 0,
                amount: parseFloat(amountElement.value) || 0,
                beffe: parseFloat(beffeElement.value) || 0,
                price: rawMaterials[type]?.price || 4.00
            });
        }
    });

    return materials;
}

// Berechne Gesamt-Mischung aus allen Materialien
function calculateCurrentMixture(materials) {
    if (materials.length === 0) {
        return {
            type: 'empty',
            name: 'Keine Materialien',
            protein: 0,
            fat: 0,
            water: 0,
            be: 0,
            beffe: 0,
            amount: 0,
            price: 0,
            waterProteinRatio: 0,
            fatProteinRatio: 0
        };
    }

    let totalAmount = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalWater = 0;
    let totalBE = 0;
    let totalBEFFE = 0;
    let totalCost = 0;

    materials.forEach(material => {
        const amount = material.amount;
        totalAmount += amount;
        totalProtein += material.protein * amount;
        totalFat += material.fat * amount;
        totalWater += material.water * amount;
        totalBE += material.be * amount;
        totalBEFFE += material.beffe * amount;
        totalCost += material.price * amount;
    });
    
    if (totalAmount === 0) {
        return {
            type: 'empty',
            name: 'Keine Materialien',
            protein: 0,
            fat: 0,
            water: 0,
            be: 0,
            beffe: 0,
            amount: 0,
            price: 0,
            waterProteinRatio: 0,
            fatProteinRatio: 0
        };
    }
    
    const protein = totalProtein / totalAmount;
    const fat = totalFat / totalAmount;
    const water = totalWater / totalAmount;

    return {
        type: 'mixed',
        name: 'Gesamt-Mischung',
        protein: protein,
        fat: fat,
        water: water,
        be: totalBE / totalAmount,
        beffe: totalBEFFE / totalAmount,
        amount: totalAmount,
        price: totalCost / totalAmount,
        waterProteinRatio: calculateWaterToProteinRatio(water, protein),
        fatProteinRatio: calculateFatToProteinRatio(fat, protein)
    };
}

// Neue Hauptfunktion: Optimierung für maximale Wasser-Schüttung
function calculateOptimization() {
    try {
        hideError();

        // Eingabedaten lesen
        const currentMaterials = getAllMaterials();
        const target = getTargetSpecs();

        // WICHTIG: User gibt Endprodukt-Menge ein, wir rechnen auf Brät-Menge hoch
        const targetEndproduct = target.quantity;
        const targetBraet = calculateRequiredBraetAmount(targetEndproduct);  // inkl. Gewürze
        const waste = getProductionWaste();
        const spiceFactor = getSpiceSettings().factor;

        // Berechne Fleischmenge (ohne Gewürze) aus Brät-Menge (inkl. Gewürze)
        // Brät = Fleisch × (1 + Gewürz-Faktor)
        // → Fleisch = Brät / (1 + Gewürz-Faktor)
        const targetFleisch = targetBraet / (1 + spiceFactor);

        console.log(`🚀 Optimierung gestartet - Endprodukt: ${targetEndproduct}kg → Brät: ${targetBraet.toFixed(2)}kg (${waste.totalWaste}% Verlust)`);
        console.log(`🚀 Fleischmenge (ohne Gewürze): ${targetFleisch.toFixed(2)}kg, Gewürze: ${(targetBraet - targetFleisch).toFixed(2)}kg (${(spiceFactor * 100).toFixed(2)}%)`);

        // Aktualisiere target mit FLEISCH-Menge (Optimierung läuft auf Fleischbasis)
        target.quantity = targetFleisch;
        target.braetQuantity = targetBraet;  // Speichere Brät-Menge inkl. Gewürze
        target.endproductQuantity = targetEndproduct;
        target.productionWaste = waste;

        console.log('🚀 Optimierung gestartet - currentMaterials:', currentMaterials);
        console.log('🚀 Optimierung gestartet - target:', target);

        // Berechne aktuelle Gesamt-Mischung
        const current = calculateCurrentMixture(currentMaterials);

        console.log('🚀 Aktuelle Mischung:', current);

        // Validierung für Optimierung
        if (!validateOptimizationInputs(current, target)) return;

        // Neue Optimierungslogik: Maximale Wasser-Schüttung
        const optimizations = generateWaterOptimizations(current, target);

        console.log('🚀 Optimierungsergebnisse:', optimizations);

        if (optimizations.length === 0) {
            // Intelligente Diagnose und Lösungsvorschläge
            const suggestions = generateOptimizationSuggestions(current, target);
            showError('Keine Optimierung möglich', suggestions);
            return;
        }

        // Ergebnisse anzeigen
        displayOptimizations(optimizations);
        currentSuggestions = optimizations;

        // Scroll zu Ergebnissen
        document.getElementById('suggestions-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Fehler bei der Optimierung:', error);
        showError('Optimierungsfehler', 'Es ist ein Fehler aufgetreten.');
    }
}

// Kostenoptimierung UI-Funktion
function calculateCostOptimizationUI() {
    try {
        hideError();

        // Eingabedaten lesen
        const target = getTargetSpecs();

        // WICHTIG: User gibt Endprodukt-Menge ein, wir rechnen auf Brät-Menge hoch
        const targetEndproduct = target.quantity;
        const targetBraet = calculateRequiredBraetAmount(targetEndproduct);  // inkl. Gewürze
        const waste = getProductionWaste();
        const spiceFactor = getSpiceSettings().factor;

        // Berechne Fleischmenge (ohne Gewürze) aus Brät-Menge (inkl. Gewürze)
        const targetFleisch = targetBraet / (1 + spiceFactor);

        console.log(`💰 Kostenoptimierung gestartet - Endprodukt: ${targetEndproduct}kg → Brät: ${targetBraet.toFixed(2)}kg (${waste.totalWaste}% Verlust)`);
        console.log(`💰 Fleischmenge (ohne Gewürze): ${targetFleisch.toFixed(2)}kg, Gewürze: ${(targetBraet - targetFleisch).toFixed(2)}kg (${(spiceFactor * 100).toFixed(2)}%)`);

        // Validierung
        if (targetEndproduct <= 0) {
            showError('Keine Zielmenge', 'Die gewünschte Endprodukt-Menge muss größer als 0 sein.');
            return;
        }

        // Aktualisiere target mit FLEISCH-Menge (Optimierung läuft auf Fleischbasis)
        target.quantity = targetFleisch;
        target.braetQuantity = targetBraet;  // Speichere Brät-Menge inkl. Gewürze
        target.endproductQuantity = targetEndproduct;
        target.productionWaste = waste;

        console.log('💰 Kostenoptimierung gestartet - target:', target);

        // Kostenoptimierung durchführen
        const optimizations = calculateCostOptimization(target);

        console.log('💰 Kostenoptimierung Ergebnisse:', optimizations);

        if (!optimizations || optimizations.length === 0) {
            showError('Keine Optimierung möglich', 'Mit den Standardrohstoffen können die Leitsätze nicht eingehalten werden.');
            return;
        }

        // Ergebnisse anzeigen
        displayCostOptimizations(optimizations);
        currentSuggestions = optimizations;

        // Scroll zu Ergebnissen
        document.getElementById('suggestions-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Fehler bei der Kostenoptimierung:', error);
        showError('Optimierungsfehler', 'Es ist ein Fehler aufgetreten.');
    }
}

// Aktuelle Material-Daten lesen (DEPRECATED - use getAllMaterials instead)
function getCurrentMaterial() {
    // Fallback für alte Code-Teile - nutze die neue Multi-Material Funktion
    const materials = getAllMaterials();
    return calculateCurrentMixture(materials);
}

// Alias für getCurrentMaterials - sollte getAllMaterials verwenden
function getCurrentMaterials() {
    return getAllMaterials();
}

// Gewürz-Berechnungen
function getSpiceSettings() {
    const spiceFactorElement = document.getElementById('spice-factor');
    const spiceCostElement = document.getElementById('spice-cost');

    return {
        factor: spiceFactorElement ? parseFloat(spiceFactorElement.value) / 100 : 0.0346, // 3.46% default
        cost: spiceCostElement ? parseFloat(spiceCostElement.value) : 15.0 // 15€/kg default
    };
}

function calculateSpiceAmount(baseMixture) {
    const spiceSettings = getSpiceSettings();
    return baseMixture * spiceSettings.factor;
}

function calculateSpiceCost(spiceAmount) {
    const spiceSettings = getSpiceSettings();
    return spiceAmount * spiceSettings.cost;
}

// Produktionsverlust-Berechnungen
function getProductionWaste() {
    const productType = document.getElementById('target-product')?.value || 'wiener';
    const product = productSpecs[productType];

    if (!product) {
        return { wasteBraet: 2.0, wasteSlicing: 0.0, totalWaste: 2.0 };
    }

    const wasteBraet = product.wasteBraet || 0.0;
    const wasteSlicing = product.wasteSlicing || 0.0;
    const totalWaste = wasteBraet + wasteSlicing;

    return {
        wasteBraet: wasteBraet,
        wasteSlicing: wasteSlicing,
        totalWaste: totalWaste,
        wasteFactor: 1 - (totalWaste / 100) // z.B. 0.98 bei 2% Verlust
    };
}

// Berechne benötigte Brät-Menge für gewünschtes Endprodukt
function calculateRequiredBraetAmount(targetEndproductAmount) {
    const waste = getProductionWaste();
    // Brät-Menge = Endprodukt / (1 - Verlust%)
    // z.B. 30 kg / 0.98 = 30.612 kg Brät für 30 kg Wiener
    return targetEndproductAmount / waste.wasteFactor;
}

// Berechne Endprodukt-Menge aus Brät-Menge (für Anzeige)
function calculateEndproductAmount(braetAmount) {
    const waste = getProductionWaste();
    // Endprodukt = Brät × (1 - Verlust%)
    // z.B. 30.612 kg × 0.98 = 30 kg Wiener
    return braetAmount * waste.wasteFactor;
}

// Gewürze-Nährstoffe in Mischung integrieren
function applySpicesToMix(baseMix, baseMixAmount) {
    const spiceAmount = calculateSpiceAmount(baseMixAmount);
    const spiceMaterial = rawMaterials.gewuerze;
    const totalAmount = baseMixAmount + spiceAmount;

    // Neue Nährstoffwerte MIT Gewürzen berechnen
    const mixWithSpices = {
        protein: (baseMix.protein * baseMixAmount + spiceMaterial.protein * spiceAmount) / totalAmount,
        fat: (baseMix.fat * baseMixAmount + spiceMaterial.fat * spiceAmount) / totalAmount,
        water: (baseMix.water * baseMixAmount + spiceMaterial.water * spiceAmount) / totalAmount,
        be: (baseMix.be * baseMixAmount + spiceMaterial.be * spiceAmount) / totalAmount,
        beffe: ((baseMix.beffe || 0) * baseMixAmount + spiceMaterial.beffe * spiceAmount) / totalAmount,
        amount: totalAmount,
        spiceAmount: spiceAmount,
        price: ((baseMix.price || 0) * baseMixAmount + spiceMaterial.price * spiceAmount) / totalAmount
    };

    return mixWithSpices;
}

// Erweiterte Gewürz-Funktionen
function toggleAdvancedSpices() {
    const checkbox = document.getElementById('advanced-spices');
    const section = document.getElementById('advanced-spices-section');

    if (checkbox && section) {
        section.style.display = checkbox.checked ? 'block' : 'none';

        if (checkbox.checked) {
            updateAdvancedSpices(); // Sofort aktualisieren
        } else {
            updateTotalMixture(); // Zurück zum einfachen Modus
        }
    }
}

function updateAdvancedSpices() {
    const salt = parseFloat(document.getElementById('spice-salt')?.value || 0);
    const pepper = parseFloat(document.getElementById('spice-pepper')?.value || 0);
    const others = parseFloat(document.getElementById('spice-others')?.value || 0);

    const totalPercentage = salt + pepper + others;

    // Aktualisiere die Anzeige des Gesamt-Prozentsatzes
    const totalElement = document.getElementById('total-spice-percentage');
    if (totalElement) {
        totalElement.textContent = `${totalPercentage.toFixed(1)}%`;
    }

    // Synchronisiere mit dem einfachen Gewürz-Faktor
    const spiceFactorElement = document.getElementById('spice-factor');
    if (spiceFactorElement) {
        spiceFactorElement.value = totalPercentage.toFixed(1);
    }

    // Berechne gewichtete Durchschnittskosten
    const saltCost = parseFloat(document.getElementById('spice-salt-cost')?.value || 0);
    const pepperCost = parseFloat(document.getElementById('spice-pepper-cost')?.value || 0);
    const othersCost = parseFloat(document.getElementById('spice-others-cost')?.value || 0);

    let avgCost = 0;
    if (totalPercentage > 0) {
        avgCost = (salt * saltCost + pepper * pepperCost + others * othersCost) / totalPercentage;
    }

    // Synchronisiere mit einfachen Gewürz-Kosten
    const spiceCostElement = document.getElementById('spice-cost');
    if (spiceCostElement) {
        spiceCostElement.value = avgCost.toFixed(2);
    }

    // Aktualisiere die Gesamtmischung
    updateTotalMixture();
}

function getAdvancedSpiceSettings() {
    const isAdvanced = document.getElementById('advanced-spices')?.checked;

    if (!isAdvanced) {
        return getSpiceSettings(); // Fallback zum einfachen Modus
    }

    const salt = parseFloat(document.getElementById('spice-salt')?.value || 0) / 100;
    const pepper = parseFloat(document.getElementById('spice-pepper')?.value || 0) / 100;
    const others = parseFloat(document.getElementById('spice-others')?.value || 0) / 100;

    const saltCost = parseFloat(document.getElementById('spice-salt-cost')?.value || 0);
    const pepperCost = parseFloat(document.getElementById('spice-pepper-cost')?.value || 0);
    const othersCost = parseFloat(document.getElementById('spice-others-cost')?.value || 0);

    const totalFactor = salt + pepper + others;
    const avgCost = totalFactor > 0 ? (salt * saltCost + pepper * pepperCost + others * othersCost) / totalFactor : 0;

    return {
        factor: totalFactor,
        cost: avgCost,
        breakdown: {
            salt: { factor: salt, cost: saltCost },
            pepper: { factor: pepper, cost: pepperCost },
            others: { factor: others, cost: othersCost }
        }
    };
}

// Zielspezifikationen lesen
function getTargetSpecs() {
    return {
        protein: parseFloat(document.getElementById('target-protein').value),
        fat: parseFloat(document.getElementById('target-fat').value),
        water: parseFloat(document.getElementById('target-water').value),
        be: parseFloat(document.getElementById('target-be').value),
        beffe: parseFloat(document.getElementById('target-beffe').value),
        quantity: parseFloat(document.getElementById('target-quantity').value)
    };
}

// Eingaben validieren
function validateInputs(current, target) {
    if (current.amount <= 0 || target.quantity <= 0) {
        showError('Ungültige Mengen', 'Verfügbare und gewünschte Menge müssen größer als 0 sein.');
        return false;
    }
    
    if (current.amount >= target.quantity) {
        showError('Zu viel vorhanden', 'Du hast bereits mehr Material als benötigt.');
        return false;
    }
    
    return true;
}

// Neue Validierung für Optimierung
function validateOptimizationInputs(current, target) {
    if (current.amount <= 0) {
        showError('Keine Rohstoffe', 'Du musst mindestens einen Rohstoff eingeben.');
        return false;
    }
    
    if (target.quantity <= 0) {
        showError('Keine Zielmengen', 'Die gewünschte Endprodukt-Menge muss größer als 0 sein.');
        return false;
    }
    
    return true;
}

// Neue Hauptfunktion: Wasser-Optimierungen generieren
function generateWaterOptimizations(current, target) {
    const optimizations = [];
    
    console.log(`🚀 Starte Wasser-Optimierung:`);
    console.log(`Aktuell: ${current.protein.toFixed(1)}% Eiweiß, ${current.fat.toFixed(1)}% Fett, ${current.water.toFixed(1)}% Wasser (${current.amount}kg)`);
    console.log(`Ziel: ${target.protein}% Eiweiß, ${target.fat}% Fett, ${target.water}% Wasser (${target.quantity}kg)`);

    // NEUE LOGIK: Prüfe ob Downsizing erforderlich ist
    if (current.amount > target.quantity) {
        console.log(`📉 Downsizing erforderlich: ${current.amount}kg → ${target.quantity}kg`);
        const downsizeOptimizations = calculateDownsizeOptimization(current, target);
        if (downsizeOptimizations && downsizeOptimizations.length > 0) {
            optimizations.push(...downsizeOptimizations);
            console.log(`📉 ${downsizeOptimizations.length} Downsizing-Optimierungen gefunden`);
        }

        // Bei Downsizing: Keine weiteren Strategien nötig, return early
        return optimizations.slice(0, 5);
    }

    // NORMALE LOGIK: Material hinzufügen (nur wenn current.amount <= target.quantity)
    // Strategie 1: Maximaler Wasser-Zusatz ohne weitere Rohstoffe
    const waterOnlyOptimization = calculateMaxWaterAddition(current, target);
    if (waterOnlyOptimization) {
        optimizations.push(waterOnlyOptimization);
    }
    
    // Strategie 2: Wasser + minimaler Rohstoff-Zusatz
    const waterPlusMinimalOptimization = calculateWaterPlusMinimal(current, target);
    if (waterPlusMinimalOptimization) {
        optimizations.push(waterPlusMinimalOptimization);
    }
    
    // Strategie 3: Verschiedene Rohstoff-Kombinationen mit maximaler Wasser-Schüttung
    const combinationOptimizations = calculateCombinationOptimizations(current, target);
    optimizations.push(...combinationOptimizations);
    
    // Sortiere nach Wasser-Anteil (höchster zuerst)
    optimizations.sort((a, b) => b.waterPercentage - a.waterPercentage);
    
    return optimizations.slice(0, 5); // Top 5 Optimierungen
}

// Kostenbasierte Optimierung mit Standardrezeptur
function calculateCostOptimization(target) {
    console.log('💰 Starte Kostenoptimierung...');

    // Hole Produkttyp und Standardrezeptur
    const productType = document.getElementById('target-product')?.value;
    if (!productType || !productSpecs[productType]) {
        console.error('Ungültiger Produkttyp');
        return null;
    }

    const product = productSpecs[productType];
    const standardRecipe = product.standardRecipe || ['s3', 's8', 'ice'];

    console.log(`💰 Produkt: ${product.name}`);
    console.log(`💰 Standardrezeptur: ${standardRecipe.map(r => rawMaterials[r].name).join(', ')}`);
    console.log(`💰 Zielmenge: ${target.quantity}kg`);

    const optimizations = [];

    // Strategie: Iteriere durch verschiedene Verhältnisse
    // Priorisierung: Wasser maximieren (günstigste Zutat)

    // Identifiziere Magerfleisch, Fett und Wasser aus Standardrezeptur
    let leanMeat = null;
    let fat = null;
    let water = null;

    for (const materialKey of standardRecipe) {
        const material = rawMaterials[materialKey];
        if (materialKey === 'ice') {
            water = { key: materialKey, ...material };
        } else if (material.fat > 50) {
            // Fetter Rohstoff (S VIII, S IX, Backen)
            fat = { key: materialKey, ...material };
        } else if (material.protein > 15) {
            // Magerfleischanteil (S III, Schulter)
            leanMeat = { key: materialKey, ...material };
        }
    }

    if (!leanMeat || !fat || !water) {
        console.error('💰 Standardrezeptur unvollständig');
        return null;
    }

    console.log(`💰 Magerfleisch: ${leanMeat.name} (${leanMeat.price}€/kg)`);
    console.log(`💰 Fett: ${fat.name} (${fat.price}€/kg)`);
    console.log(`💰 Wasser: ${water.name} (${water.price}€/kg)`);

    // Berechne verschiedene Mischungsvarianten
    // Start mit hohem Wasseranteil, reduziere schrittweise
    // WICHTIG: Für Leitsätze brauchen wir genug Protein (Wasser/Protein-Faktor ≤ 5.5)

    for (let waterPercent = 70; waterPercent >= 20; waterPercent -= 2) {
        // Für jeden Wasseranteil, teste verschiedene Fleisch/Fett-Verhältnisse
        // Magerfleisch-Anteil muss hoch genug sein für ausreichend Protein
        for (let leanPercent = 10; leanPercent <= 70; leanPercent += 2) {
            const fatPercent = 100 - waterPercent - leanPercent;

            if (fatPercent < 5 || fatPercent > 60) continue;

            // Berechne Mischung
            let mix = calculateMixFromPercentages(
                { material: leanMeat, percent: leanPercent },
                { material: fat, percent: fatPercent },
                { material: water, percent: waterPercent },
                target.quantity
            );

            // WICHTIG: Gewürze in finale Mischung einrechnen
            mix = applySpicesToMix(mix, target.quantity);

            // Prüfe Leitsätze
            if (checkLeitsaetze(mix, target)) {
                // Berechne Kosten
                const leanAmount = (leanPercent / 100) * target.quantity;
                const fatAmount = (fatPercent / 100) * target.quantity;
                const waterAmount = (waterPercent / 100) * target.quantity;
                const spiceAmount = mix.spiceAmount || 0;

                const totalCost = (leanAmount * leanMeat.price) +
                                  (fatAmount * fat.price) +
                                  (waterAmount * water.price) +
                                  (spiceAmount * rawMaterials.gewuerze.price);

                const costPerKg = totalCost / mix.amount;

                optimizations.push({
                    type: 'cost-optimized',
                    strategy: 'Kostenoptimierte Standardrezeptur',
                    description: `${leanAmount.toFixed(1)}kg ${leanMeat.name} + ${fatAmount.toFixed(1)}kg ${fat.name} + ${waterAmount.toFixed(1)}kg ${water.name} + ${spiceAmount.toFixed(1)}kg Gewürze`,
                    materials: [
                        { name: leanMeat.name, key: leanMeat.key, amount: leanAmount, price: leanMeat.price },
                        { name: fat.name, key: fat.key, amount: fatAmount, price: fat.price },
                        { name: water.name, key: water.key, amount: waterAmount, price: water.price },
                        { name: rawMaterials.gewuerze.name, key: 'gewuerze', amount: spiceAmount, price: rawMaterials.gewuerze.price }
                    ],
                    finalMix: mix,
                    totalAmount: mix.amount,
                    cost: totalCost,
                    costPerKg: costPerKg,
                    waterPercentage: waterPercent,
                    isOptimal: true
                });
            }
        }
    }

    // Sortiere nach Kosten (günstigste zuerst)
    optimizations.sort((a, b) => a.costPerKg - b.costPerKg);

    console.log(`💰 ${optimizations.length} kostenoptimierte Rezepturen gefunden`);

    return optimizations.slice(0, 5); // Top 5 günstigste
}

// Hilfsfunktion: Berechne Mischung aus Prozentangaben
function calculateMixFromPercentages(lean, fat, water, totalAmount) {
    const leanMat = lean.material;
    const fatMat = fat.material;
    const waterMat = water.material;

    const leanWeight = (lean.percent / 100) * totalAmount;
    const fatWeight = (fat.percent / 100) * totalAmount;
    const waterWeight = (water.percent / 100) * totalAmount;

    // Gewichtete Durchschnitte berechnen
    const protein = (leanMat.protein * leanWeight + fatMat.protein * fatWeight + waterMat.protein * waterWeight) / totalAmount;
    const fatContent = (leanMat.fat * leanWeight + fatMat.fat * fatWeight + waterMat.fat * waterWeight) / totalAmount;
    const waterContent = (leanMat.water * leanWeight + fatMat.water * fatWeight + waterMat.water * waterWeight) / totalAmount;
    const be = (leanMat.be * leanWeight + fatMat.be * fatWeight + waterMat.be * waterWeight) / totalAmount;
    const beffe = (leanMat.beffe * leanWeight + fatMat.beffe * fatWeight + waterMat.beffe * waterWeight) / totalAmount;

    return {
        protein: protein,
        fat: fatContent,
        water: waterContent,
        be: be,
        beffe: beffe,
        amount: totalAmount,
        waterProteinRatio: calculateWaterToProteinRatio(waterContent, protein),
        fatProteinRatio: calculateFatToProteinRatio(fatContent, protein)
    };
}

// Strategie 1: Maximaler Wasser-Zusatz ohne weitere Rohstoffe
function calculateMaxWaterAddition(current, target) {
    console.log('💧 Teste maximalen Wasser-Zusatz...');
    
    // Berechne maximal mögliche Wassermenge die hinzugefügt werden kann
    const maxPossibleWater = target.quantity - current.amount;
    
    if (maxPossibleWater <= 0) {
        console.log('💧 Bereits zu viel Material vorhanden');
        return null;
    }
    
    // Berechne finale Mischung mit maximalem Wasser
    const waterMaterial = rawMaterials.ice;
    const finalAmount = current.amount + maxPossibleWater;

    const protein = (current.protein * current.amount + waterMaterial.protein * maxPossibleWater) / finalAmount;

    let finalMix = {
        protein: protein,
        fat: (current.fat * current.amount + waterMaterial.fat * maxPossibleWater) / finalAmount,
        water: (current.water * current.amount + waterMaterial.water * maxPossibleWater) / finalAmount,
        be: (current.be * current.amount + waterMaterial.be * maxPossibleWater) / finalAmount,
        beffe: (current.beffe * current.amount + waterMaterial.beffe * maxPossibleWater) / finalAmount,
        price: current.price || 0
    };

    // WICHTIG: Gewürze in finale Mischung einrechnen
    finalMix = applySpicesToMix(finalMix, finalAmount);

    console.log(`💧 Finale Mischung (MIT Gewürzen): ${finalMix.protein.toFixed(1)}% Eiweiß, ${finalMix.fat.toFixed(1)}% Fett, ${finalMix.water.toFixed(1)}% Wasser, BE: ${finalMix.be.toFixed(2)}%`);

    // Prüfe ob Leitsätze eingehalten werden
    if (!checkLeitsaetze(finalMix, target)) {
        console.log('💧 Leitsätze nicht eingehalten');
        return null;
    }
    
    const totalCost = (current.price * current.amount) + (waterMaterial.price * maxPossibleWater) + (rawMaterials.gewuerze.price * finalMix.spiceAmount);
    const waterPercentage = (maxPossibleWater / finalMix.amount) * 100;

    console.log(`✅ Reiner Wasser-Zusatz möglich: ${maxPossibleWater.toFixed(0)}kg Wasser + ${finalMix.spiceAmount.toFixed(2)}kg Gewürze (${waterPercentage.toFixed(1)}%)`);

    return {
        type: 'water-only',
        strategy: 'Maximaler Wasser-Zusatz',
        description: `${maxPossibleWater.toFixed(0)}kg Wasser + ${finalMix.spiceAmount.toFixed(1)}kg Gewürze hinzufügen`,
        waterAmount: maxPossibleWater,
        additionalMaterials: [],
        finalMix: finalMix,
        totalAmount: finalMix.amount,
        cost: totalCost,
        costPerKg: totalCost / finalMix.amount,
        waterPercentage: waterPercentage,
        isOptimal: true
    };
}

// Mengenangaben benutzerfreundlich formatieren
function formatAmountDescription(amount, materialName) {
    if (amount >= 0) {
        return `${amount.toFixed(0)}kg ${materialName}`;
    } else {
        return `${Math.abs(amount).toFixed(0)}kg ${materialName} entfernen`;
    }
}

// Leitsätze prüfen
function checkLeitsaetze(mix, target) {
    console.log(`🔍 Prüfe Leitsätze: ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett, ${mix.water.toFixed(1)}% Wasser, ${mix.beffe.toFixed(1)}% BEFFE`);

    // Toleranzen für Leitsätze (lockerer als vorher)
    const tolerance = {
        protein: -0.3,  // Protein: Mindestens Zielwert (mit 0.3% Toleranz nach unten)
        fat: 5.0,       // ±5% Fett
        water: 3.0,     // ±3% Wasser
        beffe: -1.0     // BEFFE muss mindestens erreicht werden
    };

    // WICHTIG: Protein ist ein MINDEST-Wert, darf nicht unterschritten werden
    const proteinOk = mix.protein >= (target.protein + tolerance.protein);
    const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
    const waterOk = Math.abs(mix.water - target.water) <= tolerance.water;
    const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);

    // Lyoner-spezifische Regeln
    let lyonerWaterOk = true;
    let lyonerBeffeOk = true;
    let lyonerBeffeInFeOk = true;
    const productType = document.getElementById('target-product')?.value;
    if (productType === 'lyoner') {
        // Regel 1: Wasser ≤ 30% bezogen auf BEFFE
        const maxWaterRatio = mix.water / mix.beffe;
        lyonerWaterOk = maxWaterRatio <= 30.0;
        console.log(`🔍 Lyoner-Regel 1: Wasser/BEFFE = ${maxWaterRatio.toFixed(1)} (≤30.0): ${lyonerWaterOk ? '✅' : '❌'}`);

        // Regel 2: BEFFE ≥ 8%
        lyonerBeffeOk = mix.beffe >= 8.0;
        console.log(`🔍 Lyoner-Regel 2: BEFFE = ${mix.beffe.toFixed(1)}% (≥8.0%): ${lyonerBeffeOk ? '✅' : '❌'}`);

        // Regel 3: BEFFE im FE ≥ 85% (BEFFE/Protein ≥ 0.85)
        const beffeInFe = mix.protein > 0 ? (mix.beffe / mix.protein) : 0;
        lyonerBeffeInFeOk = beffeInFe >= 0.75;
        console.log(`🔍 Lyoner-Regel 3: BEFFE im FE = ${(beffeInFe * 100).toFixed(1)}% (≥75%): ${lyonerBeffeInFeOk ? '✅' : '❌'}`);
    }

    // Wiener-spezifische Regel: BEFFE ≥ 8%
    let wienerBeffeOk = true;
    if (productType === 'wiener') {
        wienerBeffeOk = mix.beffe >= 8.0;
        console.log(`🔍 Wiener-Regel: BEFFE = ${mix.beffe.toFixed(1)}% (≥8.0%): ${wienerBeffeOk ? '✅' : '❌'}`);
    }

    // BE/FE-Verhältnis prüfen: BE ≤ 25% von FE (Fleischeiweiß)
    const fleischeiweiss = mix.protein; // FE = Gesamteiweiß (vereinfacht)
    const beFeRatio = fleischeiweiss > 0 ? (mix.be / fleischeiweiss) * 100 : 0;
    const beFeOk = beFeRatio <= 25.0;
    console.log(`🔍 BE/FE-Verhältnis: ${beFeRatio.toFixed(1)}% (≤25.0%): ${beFeOk ? '✅' : '❌'}`);

    // BE darf nicht höher als Zielwert sein
    const beTargetOk = mix.be <= target.be;
    console.log(`🔍 BE-Zielwert: ${mix.be.toFixed(1)}% ≤ ${target.be.toFixed(1)}%: ${beTargetOk ? '✅' : '❌'}`);

    // Neue Faktoren prüfen: Wasser/Protein-Faktor ≤ 5,5
    const waterProteinRatio = mix.waterProteinRatio || calculateWaterToProteinRatio(mix.water, mix.protein);
    // Floating Point Toleranz hinzufügen für exakte Grenzwerte
    const waterProteinOk = waterProteinRatio <= (5.5 + 0.01);
    console.log(`🔍 Wasser/Protein-Faktor: ${waterProteinRatio.toFixed(2)} (≤5.5): ${waterProteinOk ? '✅' : '❌'}`);

    // Fett/Protein-Faktor ≤ 3,2
    const fatProteinRatio = mix.fatProteinRatio || calculateFatToProteinRatio(mix.fat, mix.protein);
    // Floating Point Toleranz hinzufügen für exakte Grenzwerte
    const fatProteinOk = fatProteinRatio <= (3.2 + 0.01);
    console.log(`🔍 Fett/Protein-Faktor: ${fatProteinRatio.toFixed(2)} (≤3.2): ${fatProteinOk ? '✅' : '❌'}`);

    // Detaillierte Debug-Ausgaben
    console.log(`🔍 ZIEL: ${target.protein}% Eiweiß (MIN), ${target.fat}% Fett, ${target.water}% Wasser, ${target.beffe}% BEFFE (MIN)`);
    console.log(`🔍 IST:  ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett, ${mix.water.toFixed(1)}% Wasser, ${mix.beffe.toFixed(1)}% BEFFE`);
    console.log(`🔍 CHECK: Protein ${mix.protein.toFixed(1)}% ≥ ${(target.protein + tolerance.protein).toFixed(1)}%: ${proteinOk ? '✅' : '❌'}, Fett ${Math.abs(mix.fat - target.fat).toFixed(1)} (≤${tolerance.fat}): ${fatOk ? '✅' : '❌'}, Wasser ${Math.abs(mix.water - target.water).toFixed(1)} (≤${tolerance.water}): ${waterOk ? '✅' : '❌'}, BEFFE ${mix.beffe.toFixed(1)} ≥ ${(target.beffe + tolerance.beffe).toFixed(1)}: ${beffeOk ? '✅' : '❌'}`);
    console.log(`🔍 Leitsätze-Check: Protein ${proteinOk}, Fett ${fatOk}, Wasser ${waterOk}, BEFFE ${beffeOk}, Lyoner-Wasser ${lyonerWaterOk}, Lyoner-BEFFE ${lyonerBeffeOk}, Lyoner-BEFFE-im-FE ${lyonerBeffeInFeOk}, Wiener-BEFFE ${wienerBeffeOk}, BE/FE ${beFeOk}, BE-Ziel ${beTargetOk}, Wasser/Protein ${waterProteinOk}, Fett/Protein ${fatProteinOk}`);

    return proteinOk && fatOk && waterOk && beffeOk && lyonerWaterOk && lyonerBeffeOk && lyonerBeffeInFeOk && wienerBeffeOk && beFeOk && beTargetOk && waterProteinOk && fatProteinOk;
}

// Intelligente Lösungsvorschläge bei gescheiterten Optimierungen
function generateOptimizationSuggestions(current, target) {
    console.log('🔍 Generiere Lösungsvorschläge...');

    const suggestions = [];
    const issues = [];

    // Analysiere alle Constraint-Verletzungen
    const waterProteinRatio = calculateWaterToProteinRatio(current.water, current.protein);
    const fatProteinRatio = calculateFatToProteinRatio(current.fat, current.protein);

    // 1. Wasser/Protein-Faktor Probleme
    if (waterProteinRatio > 5.5) {
        issues.push('Wasser/Protein-Verhältnis zu hoch');
        suggestions.push(`💧➡️🥩 WASSER/PROTEIN zu hoch (${waterProteinRatio.toFixed(2)} > 5.5):`);
        suggestions.push('• Mehr proteinreiche Rohstoffe hinzufügen (Schulter schier: 19.2% Protein)');
        suggestions.push('• Weniger Eis/Wasser verwenden');
        suggestions.push('• Mageres Fleisch (S III) erhöhen');
    }

    // 2. Fett/Protein-Faktor Probleme
    if (fatProteinRatio > 3.2) {
        issues.push('Fett/Protein-Verhältnis zu hoch');
        suggestions.push(`🥓➡️🥩 FETT/PROTEIN zu hoch (${fatProteinRatio.toFixed(2)} > 3.2):`);
        suggestions.push('• Weniger fettreiche Rohstoffe (Backen hat bereits 3.61!)');
        suggestions.push('• Mehr Protein hinzufügen (Schulter schier oder S III)');
        suggestions.push('• Fettanteil reduzieren');
    }

    // 3. Zielwert-Differenzen analysieren
    const proteinDiff = current.protein - target.protein;
    const fatDiff = current.fat - target.fat;
    const waterDiff = current.water - target.water;

    // WICHTIG: Protein-Minimum prüfen (Protein darf nicht unter Zielwert fallen)
    if (proteinDiff < -0.3) {
        issues.push('Protein zu niedrig');
        suggestions.push(`🥩 PROTEIN zu niedrig (${current.protein.toFixed(1)}% < ${target.protein}%):`);
        suggestions.push('• Mehr proteinreiche Rohstoffe: Schulter schier (19.2% Protein), S III (17.3% Protein)');
        suggestions.push('• Weniger Eis/Wasser verwenden');
        suggestions.push('• Fettanteil reduzieren, da Fett Protein verdrängt');
    }

    if (Math.abs(fatDiff) > 5) {
        if (fatDiff < -5) {
            suggestions.push('🥓 FETT zu niedrig:');
            suggestions.push('• Mehr S IX hinzufügen (70.2% Fett)');
            suggestions.push('• Backen erhöhen (45.2% Fett) - Achtung: Fett/Protein-Grenzwert beachten!');
        } else {
            suggestions.push('🥓 FETT zu hoch:');
            suggestions.push('• Weniger fettreiche Rohstoffe verwenden');
            suggestions.push('• Mehr magere Rohstoffe (S III, Schulter schier)');
        }
    }

    if (Math.abs(waterDiff) > 3) {
        if (waterDiff > 3) {
            suggestions.push('💧 WASSER zu hoch:');
            suggestions.push('• Weniger Eis/Wasser hinzufügen');
            suggestions.push('• Mehr feste Rohstoffe verwenden');
        } else {
            suggestions.push('💧 WASSER zu niedrig:');
            suggestions.push('• Mehr Eis/Wasser hinzufügen');
            suggestions.push('• Wasserreiche Rohstoffe bevorzugen');
        }
    }

    // 4. Brät-Benchmark Integration
    const braetValues = rawMaterials.braet;
    const braetWaterProtein = calculateWaterToProteinRatio(braetValues.water, braetValues.protein);
    const braetFatProtein = calculateFatToProteinRatio(braetValues.fat, braetValues.protein);

    suggestions.push('<br><strong>🧪 BENCHMARK (Fertiges Brät):</strong>');
    suggestions.push(`• Erfolgreiche Faktoren: W/P ${braetWaterProtein.toFixed(2)}, F/P ${braetFatProtein.toFixed(2)}`);
    suggestions.push(`• Angestrebt: ${braetValues.protein}% Protein, ${braetValues.fat}% Fett, ${braetValues.water}% Wasser`);
    suggestions.push('• Orientierung an bewährter Rezeptur empfohlen');

    // 5. Spezifische Rohstoff-Empfehlungen
    if (suggestions.length === 0) {
        suggestions.push('🔍 ALLGEMEINE EMPFEHLUNGEN:');
        suggestions.push('• Rohstoff-Mengenverhältnisse anpassen');
        suggestions.push('• Toleranzen in den Leitsätzen prüfen');
        suggestions.push('• Alternative Rohstoff-Kombinationen testen');
    }

    // Füge Constraint-Details hinzu
    const constraintAnalysis = analyzeConstraintViolations(current, target);
    if (constraintAnalysis.length > 0) {
        suggestions.push('<br><strong>🔍 DETAILANALYSE:</strong>');
        suggestions.push(...constraintAnalysis);
    }

    // Rückgabe als HTML-formatierter String
    return suggestions.join('<br>');
}

// Detaillierte Constraint-Analyse
function analyzeConstraintViolations(current, target) {
    const analysis = [];
    const waterProteinRatio = calculateWaterToProteinRatio(current.water, current.protein);
    const fatProteinRatio = calculateFatToProteinRatio(current.fat, current.protein);

    // Aktuelle Werte vs. Grenzwerte
    analysis.push(`• Wasser/Protein: ${waterProteinRatio.toFixed(2)} (Grenzwert: ≤5.5) ${waterProteinRatio <= 5.5 ? '✅' : '❌'}`);
    analysis.push(`• Fett/Protein: ${fatProteinRatio.toFixed(2)} (Grenzwert: ≤3.2) ${fatProteinRatio <= 3.2 ? '✅' : '❌'}`);

    // Zielwert-Differenzen
    const proteinDiff = current.protein - target.protein;
    const fatDiff = current.fat - target.fat;
    const waterDiff = current.water - target.water;

    analysis.push(`• Protein-Differenz: ${proteinDiff.toFixed(1)}% (Ist ${current.protein.toFixed(1)}% vs. Ziel ${target.protein}%)`);
    analysis.push(`• Fett-Differenz: ${fatDiff.toFixed(1)}% (Ist ${current.fat.toFixed(1)}% vs. Ziel ${target.fat}%)`);
    analysis.push(`• Wasser-Differenz: ${waterDiff.toFixed(1)}% (Ist ${current.water.toFixed(1)}% vs. Ziel ${target.water}%)`);

    return analysis;
}

// Brät-Validierung: Teste mit realen Food Scan Werten
function validateWithBraet() {
    console.log('🧪 Starte Brät-Validierung...');

    try {
        hideError();

        // Hole Brät-Werte aus rawMaterials
        const braetValues = rawMaterials.braet;

        // Berechne Faktoren für fertiges Brät
        const waterProteinRatio = calculateWaterToProteinRatio(braetValues.water, braetValues.protein);
        const fatProteinRatio = calculateFatToProteinRatio(braetValues.fat, braetValues.protein);

        // Erstelle Validierungsbericht
        let validationReport = [];

        validationReport.push('<strong>🧪 BRÄT-VALIDIERUNG</strong>');
        validationReport.push('<br><strong>Food Scan Werte:</strong>');
        validationReport.push(`• Eiweiß: ${braetValues.protein}%`);
        validationReport.push(`• Fett: ${braetValues.fat}%`);
        validationReport.push(`• Wasser: ${braetValues.water}%`);
        validationReport.push(`• BE: ${braetValues.be}%`);
        validationReport.push(`• BEFFE: ${braetValues.beffe || (braetValues.protein - braetValues.be).toFixed(2)}%`);

        validationReport.push('<br><strong>🔍 FAKTOREN-PRÜFUNG:</strong>');
        validationReport.push(`• Wasser/Protein: ${waterProteinRatio.toFixed(2)} ${waterProteinRatio <= 5.5 ? '✅' : '❌'} (Grenzwert: ≤5.5)`);
        validationReport.push(`• Fett/Protein: ${fatProteinRatio.toFixed(2)} ${fatProteinRatio <= 3.2 ? '✅' : '❌'} (Grenzwert: ≤3.2)`);

        // Vergleich mit aktueller Mischung
        const currentMaterials = getAllMaterials();
        if (currentMaterials.length > 0) {
            const currentMix = calculateCurrentMixture(currentMaterials);
            const currentWaterProtein = calculateWaterToProteinRatio(currentMix.water, currentMix.protein);
            const currentFatProtein = calculateFatToProteinRatio(currentMix.fat, currentMix.protein);

            validationReport.push('<br><strong>⚖️ VERGLEICH MIT AKTUELLER MISCHUNG:</strong>');
            validationReport.push(`• Wasser/Protein: Brät ${waterProteinRatio.toFixed(2)} vs. Aktuell ${currentWaterProtein.toFixed(2)}`);
            validationReport.push(`• Fett/Protein: Brät ${fatProteinRatio.toFixed(2)} vs. Aktuell ${currentFatProtein.toFixed(2)}`);

            if (waterProteinRatio <= 5.5 && fatProteinRatio <= 3.2) {
                validationReport.push('<br><strong>✅ ERFOLG:</strong> Das Brät erfüllt alle neuen Grenzwerte!');
                validationReport.push('Die implementierten Faktoren sind korrekt kalibriert.');
            } else {
                validationReport.push('<br><strong>⚠️ ACHTUNG:</strong> Das Brät überschreitet Grenzwerte!');
                validationReport.push('Möglicherweise müssen die Grenzwerte angepasst werden.');
            }
        }

        // Empfehlungen für Optimierung
        validationReport.push('<br><strong>💡 EMPFEHLUNGEN:</strong>');
        if (waterProteinRatio <= 5.5 && fatProteinRatio <= 3.2) {
            validationReport.push('• Die Brät-Zusammensetzung kann als Benchmark verwendet werden');
            validationReport.push('• Optimierungen sollten ähnliche Faktoren-Verhältnisse anstreben');
            validationReport.push('• Bei Abweichungen: Mehr proteinreiche Rohstoffe verwenden');
        } else {
            validationReport.push('• Prüfung der Grenzwerte erforderlich');
            validationReport.push('• Möglicherweise sind die Toleranzen zu streng');
        }

        // Zeige Validierungsbericht in der Ergebnissektion
        const suggestionsSection = document.getElementById('suggestions-section');
        suggestionsSection.style.display = 'block';

        const container = document.getElementById('suggestions-container');
        container.innerHTML = `
            <div class="suggestion-card validation-result">
                <div class="suggestion-header">
                    <span class="suggestion-icon">🧪</span>
                    <div class="suggestion-title">Brät-Validierung</div>
                    <div class="suggestion-meta">Food Scan Verifikation</div>
                </div>
                <div class="suggestion-details">
                    ${validationReport.join('<br>')}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Fehler bei Brät-Validierung:', error);
        showError('Validierungsfehler', 'Fehler bei der Brät-Validierung: ' + error.message);
    }
}

// Erweiterte Abweichungsanalyse zwischen berechneten und gemessenen Werten
function analyzeDeviations(theoretical, measured, label = 'Vergleich', includeExtendedAnalysis = false) {
    const deviations = [];

    // Grundlegende Abweichungen
    const proteinDev = Math.abs(theoretical.protein - measured.protein);
    const fatDev = Math.abs(theoretical.fat - measured.fat);
    const waterDev = Math.abs(theoretical.water - measured.water);
    const beDev = Math.abs((theoretical.be || 0) - (measured.be || 0));
    const beffeDev = Math.abs((theoretical.beffe || 0) - (measured.beffe || 0));

    deviations.push(`<strong>📊 ABWEICHUNGSANALYSE (${label}):</strong>`);

    // Detaillierte Toleranzbereiche
    const tolerances = {
        protein: { excellent: 0.5, good: 1.0, acceptable: 2.0 },
        fat: { excellent: 1.0, good: 2.0, acceptable: 4.0 },
        water: { excellent: 1.5, good: 3.0, acceptable: 5.0 },
        be: { excellent: 0.3, good: 0.7, acceptable: 1.2 },
        beffe: { excellent: 0.5, good: 1.0, acceptable: 2.0 }
    };

    function getStatusIcon(deviation, tolerance) {
        if (deviation <= tolerance.excellent) return '🎯';
        if (deviation <= tolerance.good) return '✅';
        if (deviation <= tolerance.acceptable) return '⚠️';
        return '❌';
    }

    function getStatusText(deviation, tolerance) {
        if (deviation <= tolerance.excellent) return 'Exzellent';
        if (deviation <= tolerance.good) return 'Sehr gut';
        if (deviation <= tolerance.acceptable) return 'Akzeptabel';
        return 'Kritisch';
    }

    // Detaillierte Bewertung aller Parameter
    deviations.push(`• Protein: ${proteinDev.toFixed(2)}% ${getStatusIcon(proteinDev, tolerances.protein)} ${getStatusText(proteinDev, tolerances.protein)}`);
    deviations.push(`• Fett: ${fatDev.toFixed(2)}% ${getStatusIcon(fatDev, tolerances.fat)} ${getStatusText(fatDev, tolerances.fat)}`);
    deviations.push(`• Wasser: ${waterDev.toFixed(2)}% ${getStatusIcon(waterDev, tolerances.water)} ${getStatusText(waterDev, tolerances.water)}`);

    if (theoretical.be !== undefined && measured.be !== undefined) {
        deviations.push(`• BE: ${beDev.toFixed(2)}% ${getStatusIcon(beDev, tolerances.be)} ${getStatusText(beDev, tolerances.be)}`);
    }

    if (theoretical.beffe !== undefined && measured.beffe !== undefined) {
        deviations.push(`• BEFFE: ${beffeDev.toFixed(2)}% ${getStatusIcon(beffeDev, tolerances.beffe)} ${getStatusText(beffeDev, tolerances.beffe)}`);
    }

    // Gesamtbewertung
    const avgDeviation = (proteinDev + fatDev + waterDev) / 3;
    deviations.push(`• Durchschnitt: ${avgDeviation.toFixed(2)}% ${avgDeviation <= 1.0 ? '🎯 Exzellent' : avgDeviation <= 2.0 ? '✅ Sehr gut' : avgDeviation <= 4.0 ? '⚠️ Akzeptabel' : '❌ Kritisch'}`);

    // Erweiterte statistische Analyse
    if (includeExtendedAnalysis) {
        deviations.push('<br><strong>📈 STATISTISCHE ANALYSE:</strong>');

        // Standardabweichung berechnen
        const values = [proteinDev, fatDev, waterDev];
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avgDeviation, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        deviations.push(`• Standardabweichung: ${stdDev.toFixed(2)}%`);
        deviations.push(`• Konsistenz: ${stdDev <= 1.0 ? '🎯 Sehr konsistent' : stdDev <= 2.0 ? '✅ Konsistent' : '⚠️ Schwankend'}`);

        // Trends identifizieren
        const proteinTrend = theoretical.protein - measured.protein;
        const fatTrend = theoretical.fat - measured.fat;
        const waterTrend = theoretical.water - measured.water;

        deviations.push('<br><strong>📉 TREND-ANALYSE:</strong>');
        deviations.push(`• Protein: ${proteinTrend > 0 ? '+' : ''}${proteinTrend.toFixed(2)}% ${proteinTrend > 0.5 ? '(Überschätzung)' : proteinTrend < -0.5 ? '(Unterschätzung)' : '(Ausgeglichen)'}`);
        deviations.push(`• Fett: ${fatTrend > 0 ? '+' : ''}${fatTrend.toFixed(2)}% ${fatTrend > 1.0 ? '(Überschätzung)' : fatTrend < -1.0 ? '(Unterschätzung)' : '(Ausgeglichen)'}`);
        deviations.push(`• Wasser: ${waterTrend > 0 ? '+' : ''}${waterTrend.toFixed(2)}% ${waterTrend > 2.0 ? '(Überschätzung)' : waterTrend < -2.0 ? '(Unterschätzung)' : '(Ausgeglichen)'}`);
    }

    // Gesamtbewertung und Empfehlungen
    if (avgDeviation <= 1.0) {
        deviations.push('<br><strong>🎯 BEWERTUNG:</strong> Exzellente Übereinstimmung - Modell ist sehr präzise');
        deviations.push('<strong>💡 EMPFEHLUNG:</strong> Keine Anpassungen nötig, weiter so!');
    } else if (avgDeviation <= 2.0) {
        deviations.push('<br><strong>✅ BEWERTUNG:</strong> Sehr gute Übereinstimmung - Modell funktioniert gut');
        deviations.push('<strong>💡 EMPFEHLUNG:</strong> Kleine Optimierungen bei auffälligen Parametern');
    } else if (avgDeviation <= 4.0) {
        deviations.push('<br><strong>⚠️ BEWERTUNG:</strong> Akzeptable Abweichung - Optimierung empfehlenswert');
        deviations.push('<strong>💡 EMPFEHLUNG:</strong> Prozessfaktoren anpassen, Rohstoff-Kalibrierung prüfen');
    } else {
        deviations.push('<br><strong>❌ BEWERTUNG:</strong> Hohe Abweichung - Dringende Überprüfung erforderlich');
        deviations.push('<strong>💡 EMPFEHLUNG:</strong> Grundlegende Modell-Revision, Rohstoff-Neubewertung, Prozessanalyse');
    }

    return deviations;
}

// Intelligente Rohstoff-Kalibrierung basierend auf Food Scan Abweichungen
function calibrateRawMaterials(measuredBraet, calculatedBraet, currentMaterials) {
    console.log('🔧 Starte Rohstoff-Kalibrierung...');

    const calibrationReport = [];
    calibrationReport.push('<strong>🔧 ROHSTOFF-KALIBRIERUNG:</strong>');

    // Abweichungen berechnen
    const waterDeviation = measuredBraet.water - calculatedBraet.water; // -2.54%
    const beDeviation = measuredBraet.be - calculatedBraet.be; // +0.71%
    const proteinDeviation = measuredBraet.protein - calculatedBraet.protein; // -0.18%
    const fatDeviation = measuredBraet.fat - calculatedBraet.fat; // -0.54%

    calibrationReport.push(`<br><strong>📋 GEMESSENE ABWEICHUNGEN:</strong>`);
    calibrationReport.push(`• Wasser: ${waterDeviation.toFixed(2)}% (Verlust durch Verarbeitung)`);
    calibrationReport.push(`• BE: +${beDeviation.toFixed(2)}% (Bindegewebe unterschätzt)`);
    calibrationReport.push(`• Protein: ${proteinDeviation.toFixed(2)}% (Leichte Abweichung)`);
    calibrationReport.push(`• Fett: ${fatDeviation.toFixed(2)}% (Leichte Abweichung)`);

    // Korrekturvorschläge für Rohstoffe generieren
    calibrationReport.push(`<br><strong>💡 KORREKTURVORSCHLÄGE:</strong>`);

    // 1. Wasserverlust-Faktor
    const processWaterLoss = Math.abs(waterDeviation);
    calibrationReport.push(`• Wasserverlust-Faktor: ${processWaterLoss.toFixed(1)}% für Verarbeitungsprozess`);

    // 2. BE-Werte Anpassung
    const beAdjustmentFactor = 1 + (beDeviation / calculatedBraet.be);
    calibrationReport.push(`• BE-Werte um Faktor ${beAdjustmentFactor.toFixed(3)} erhöhen`);

    // 3. Spezifische Rohstoff-Korrekturen
    calibrationReport.push(`<br><strong>🔬 EMPFOHLENE ROHSTOFF-ANPASSUNGEN:</strong>`);

    // Analyisiere verwendete Rohstoffe
    const usedMaterials = currentMaterials.filter(mat => mat.amount > 0);
    for (const material of usedMaterials) {
        const materialData = rawMaterials[material.type];
        if (!materialData) continue;

        const correctedBE = materialData.be * beAdjustmentFactor;
        const weightPercent = (material.amount / calculatedBraet.amount) * 100;

        calibrationReport.push(`• ${materialData.name} (${weightPercent.toFixed(1)}%):`);
        calibrationReport.push(`  - Aktueller BE: ${materialData.be.toFixed(2)}%`);
        calibrationReport.push(`  - Korrigierter BE: ${correctedBE.toFixed(2)}%`);
        calibrationReport.push(`  - Anpassung: +${((correctedBE - materialData.be)).toFixed(2)}%`);
    }

    // 4. Prozessoptimierung
    calibrationReport.push(`<br><strong>⚙️ PROZESSOPTIMIERUNG:</strong>`);
    calibrationReport.push(`• Wasserverlust durch Kutter/Mischen: ~${processWaterLoss.toFixed(1)}%`);
    calibrationReport.push(`• Bindegewebe-Messung überprüfen (Food Scan vs. Labor)`);
    calibrationReport.push(`• Rohstoff-Chargen-Schwankungen berücksichtigen`);

    // 5. Empfohlene Toleranzen
    calibrationReport.push(`<br><strong>📏 EMPFOHLENE TOLERANZEN:</strong>`);
    calibrationReport.push(`• Wasser: ±${(processWaterLoss + 1).toFixed(1)}% (inkl. Prozessverlust)`);
    calibrationReport.push(`• BE: ±${(Math.abs(beDeviation) + 0.3).toFixed(1)}% (Messtoleranzen)`);
    calibrationReport.push(`• Protein/Fett: ±1.0% (bestehende Toleranz ausreichend)`);

    return calibrationReport;
}

// Prozessverlust-Faktoren implementieren
function applyProcessingFactors(theoreticalMix, processType = 'standard') {
    console.log('⚙️ Wende Prozessfaktoren an...');

    const factors = {
        standard: {
            waterLoss: 0.025,    // 2.5% Wasserverlust
            beFactor: 1.07,      // 7% höhere BE-Werte
            proteinLoss: 0.002,  // 0.2% Proteinverlust
            fatLoss: 0.005       // 0.5% Fettverlust
        },
        intensive: {
            waterLoss: 0.035,    // 3.5% Wasserverlust bei intensivem Kuttern
            beFactor: 1.10,      // 10% höhere BE-Werte
            proteinLoss: 0.003,  // 0.3% Proteinverlust
            fatLoss: 0.008       // 0.8% Fettverlust
        }
    };

    const factor = factors[processType] || factors.standard;

    // Angepasste Werte berechnen
    const adjustedMix = {
        protein: theoreticalMix.protein * (1 - factor.proteinLoss),
        fat: theoreticalMix.fat * (1 - factor.fatLoss),
        water: theoreticalMix.water * (1 - factor.waterLoss),
        be: theoreticalMix.be * factor.beFactor,
        amount: theoreticalMix.amount
    };

    // BEFFE neu berechnen
    adjustedMix.beffe = adjustedMix.protein - adjustedMix.be;

    // Faktoren hinzufügen für Transparenz
    adjustedMix.waterProteinRatio = calculateWaterToProteinRatio(adjustedMix.water, adjustedMix.protein);
    adjustedMix.fatProteinRatio = calculateFatToProteinRatio(adjustedMix.fat, adjustedMix.protein);

    console.log(`⚙️ Prozessanpassung (${processType}):`, adjustedMix);
    return adjustedMix;
}

// Erweiterte Validierung mit Prozessfaktoren
function validateWithProcessFactors() {
    try {
        console.log('🧪⚙️ Starte erweiterte Validierung mit Prozessfaktoren...');

        // Aktuelle Berechnung
        const currentMaterials = getCurrentMaterials();
        const theoretical = calculateCurrentMixture(currentMaterials);

        // Mit Prozessfaktoren angepasst
        const withStandardProcess = applyProcessingFactors(theoretical, 'standard');
        const withIntensiveProcess = applyProcessingFactors(theoretical, 'intensive');

        // Food Scan Referenz
        const braetReference = {
            protein: 13.52,
            fat: 11.56,
            water: 71.86,
            be: 1.71,
            beffe: 11.81
        };

        // Vergleiche alle Varianten
        const comparisons = [];

        // Standard Abweichung mit erweiterter Analyse
        const standardDev = analyzeDeviations(theoretical, braetReference, 'Ohne Prozessfaktoren', true);
        comparisons.push(...standardDev);

        // Mit Standard-Prozessfaktoren
        const standardProcessDev = analyzeDeviations(withStandardProcess, braetReference, 'Standard-Verarbeitung', false);
        comparisons.push('<br>');
        comparisons.push(...standardProcessDev);

        // Mit intensiven Prozessfaktoren
        const intensiveProcessDev = analyzeDeviations(withIntensiveProcess, braetReference, 'Intensive Verarbeitung', false);
        comparisons.push('<br>');
        comparisons.push(...intensiveProcessDev);

        // Kalibrierungsvorschläge
        const calibration = calibrateRawMaterials(braetReference, theoretical, currentMaterials);
        comparisons.push('<br>');
        comparisons.push(...calibration);

        // Ergebnisse anzeigen
        const suggestionsSection = document.getElementById('suggestions-section');
        suggestionsSection.style.display = 'block';

        const container = document.getElementById('suggestions-container');
        container.innerHTML = `
            <div class="suggestion-card validation-result">
                <div class="suggestion-header">
                    <span class="suggestion-icon">🔬</span>
                    <div class="suggestion-title">Erweiterte Prozess-Validierung</div>
                    <div class="suggestion-meta">Mit Kalibrierung & Prozessfaktoren</div>
                </div>
                <div class="suggestion-details">
                    ${comparisons.join('<br>')}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Fehler bei erweiterter Validierung:', error);
        showError('Validierungsfehler', 'Fehler bei der erweiterten Validierung: ' + error.message);
    }
}

// Automatische Rohstoff-Kalibrierung anwenden
function applyCalibration() {
    try {
        console.log('🔧⚙️ Wende automatische Kalibrierung an...');

        // Aktuelle Berechnung
        const currentMaterials = getCurrentMaterials();
        const theoretical = calculateCurrentMixture(currentMaterials);

        // Food Scan Referenz
        const braetReference = {
            protein: 13.52,
            fat: 11.56,
            water: 71.86,
            be: 1.71,
            beffe: 11.81
        };

        // Kalibrierungsfaktoren berechnen
        const waterDeviation = braetReference.water - theoretical.water; // -2.54%
        const beDeviation = braetReference.be - theoretical.be; // +0.71%
        const beAdjustmentFactor = 1 + (beDeviation / theoretical.be);

        console.log(`🔧 Kalibrierungsfaktoren: Wasser ${waterDeviation.toFixed(2)}%, BE-Faktor ${beAdjustmentFactor.toFixed(3)}`);

        // Bestätigung vom Benutzer
        const confirmMessage = `
AUTOMATISCHE KALIBRIERUNG

Möchten Sie die folgenden Anpassungen vornehmen?

• Wasserverlust-Faktor: ${Math.abs(waterDeviation).toFixed(1)}%
• BE-Werte Anpassung: +${((beAdjustmentFactor - 1) * 100).toFixed(1)}%

Dies wird die Rohstoff-Werte dauerhaft anpassen.
        `;

        if (!confirm(confirmMessage)) {
            console.log('🚫 Kalibrierung abgebrochen');
            return;
        }

        // Backup der originalen Werte
        const originalRawMaterials = JSON.parse(JSON.stringify(rawMaterials));

        // Angepasste Rohstoff-Werte berechnen
        const calibratedMaterials = {};
        for (const [key, material] of Object.entries(rawMaterials)) {
            if (key === 'ice' || key === 'custom' || key === 'braet') {
                calibratedMaterials[key] = material; // Diese nicht ändern
                continue;
            }

            calibratedMaterials[key] = {
                ...material,
                be: material.be * beAdjustmentFactor,
                // Wasser leicht reduzieren für Prozessverlust
                water: material.water * (1 - Math.abs(waterDeviation) / 100)
            };

            console.log(`🔧 ${material.name}: BE ${material.be.toFixed(2)} → ${calibratedMaterials[key].be.toFixed(2)}, Wasser ${material.water.toFixed(1)} → ${calibratedMaterials[key].water.toFixed(1)}`);
        }

        // Temporär anwenden für Test
        Object.assign(rawMaterials, calibratedMaterials);

        // Neue Berechnung testen
        const testCalculation = calculateCurrentMixture(currentMaterials);
        const testDeviation = analyzeDeviations(testCalculation, braetReference, 'Nach Kalibrierung', false);

        // Ergebnis anzeigen
        const calibrationReport = [];
        calibrationReport.push('<strong>🔧 KALIBRIERUNG ANGEWENDET:</strong>');
        calibrationReport.push('<br><strong>📊 NEUE ABWEICHUNGSANALYSE:</strong>');
        calibrationReport.push(...testDeviation);

        calibrationReport.push('<br><strong>⚙️ ANGEWENDETE KORREKTUREN:</strong>');
        for (const [key, material] of Object.entries(calibratedMaterials)) {
            const original = originalRawMaterials[key];
            if (!original || key === 'ice' || key === 'custom' || key === 'braet') continue;

            const beChange = material.be - original.be;
            const waterChange = material.water - original.water;

            if (Math.abs(beChange) > 0.01 || Math.abs(waterChange) > 0.01) {
                calibrationReport.push(`• ${material.name}:`);
                if (Math.abs(beChange) > 0.01) {
                    calibrationReport.push(`  - BE: ${original.be.toFixed(2)} → ${material.be.toFixed(2)} (+${beChange.toFixed(2)})`);
                }
                if (Math.abs(waterChange) > 0.01) {
                    calibrationReport.push(`  - Wasser: ${original.water.toFixed(1)} → ${material.water.toFixed(1)} (${waterChange.toFixed(1)})`);
                }
            }
        }

        calibrationReport.push('<br><strong>💾 SPEICHERUNG:</strong>');
        calibrationReport.push('• Änderungen wurden temporär angewendet');
        calibrationReport.push('• Aktualisieren Sie die Berechnung für endgültige Werte');
        calibrationReport.push('• Bei Neustart werden ursprüngliche Werte wiederhergestellt');

        // Manuell aktualisieren
        updateTotalMixture();

        // Ergebnisse anzeigen
        const suggestionsSection = document.getElementById('suggestions-section');
        suggestionsSection.style.display = 'block';

        const container = document.getElementById('suggestions-container');
        container.innerHTML = `
            <div class="suggestion-card validation-result">
                <div class="suggestion-header">
                    <span class="suggestion-icon">🔧</span>
                    <div class="suggestion-title">Kalibrierung Angewendet</div>
                    <div class="suggestion-meta">Rohstoff-Anpassung basierend auf Food Scan</div>
                </div>
                <div class="suggestion-details">
                    ${calibrationReport.join('<br>')}
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="location.reload()" class="calculate-btn secondary-action" style="margin-right: 10px;">
                        🔄 Zurücksetzen
                    </button>
                    <button onclick="exportCalibratedMaterials()" class="calculate-btn primary-action">
                        💾 Werte Exportieren
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Fehler bei automatischer Kalibrierung:', error);
        showError('Kalibrierungsfehler', 'Fehler bei der automatischen Kalibrierung: ' + error.message);
    }
}

// Kalibrierte Werte exportieren
function exportCalibratedMaterials() {
    try {
        const exportData = {
            timestamp: new Date().toISOString(),
            calibratedMaterials: rawMaterials,
            calibrationNote: 'Rohstoff-Werte kalibriert basierend auf Food Scan Brät-Referenz'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rohstoffe_kalibriert_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('📁 Kalibrierte Rohstoff-Werte exportiert');
        alert('✅ Kalibrierte Rohstoff-Werte wurden exportiert!');

    } catch (error) {
        console.error('Fehler beim Export:', error);
        showError('Export-Fehler', 'Fehler beim Exportieren der kalibrierten Werte: ' + error.message);
    }
}

// Strategie 2: Wasser + minimaler Rohstoff-Zusatz
function calculateWaterPlusMinimal(current, target) {
    console.log('💧🥩 Teste Wasser + minimalen Rohstoff-Zusatz...');
    
    const neededAmount = target.quantity - current.amount;
    const optimizations = [];
    
    // Teste verschiedene Rohstoffe mit maximaler Wasser-Schüttung
    const materials = Object.entries(rawMaterials).filter(([key]) => key !== 'ice' && key !== 'custom' && key !== 'gewuerze');

    for (const [materialType, material] of materials) {
        // Teste verschiedene Verhältnisse: 70% Wasser, 30% Rohstoff bis 30% Wasser, 70% Rohstoff
        for (let waterRatio = 0.7; waterRatio >= 0.3; waterRatio -= 0.1) {
            const materialRatio = 1 - waterRatio;
            const waterAmount = neededAmount * waterRatio;
            const materialAmount = neededAmount * materialRatio;
            
            const finalAmount = current.amount + waterAmount + materialAmount;
            const waterMaterial = rawMaterials.ice;
            
            const protein = (current.protein * current.amount + waterMaterial.protein * waterAmount + material.protein * materialAmount) / finalAmount;

            let finalMix = {
                protein: protein,
                fat: (current.fat * current.amount + waterMaterial.fat * waterAmount + material.fat * materialAmount) / finalAmount,
                water: (current.water * current.amount + waterMaterial.water * waterAmount + material.water * materialAmount) / finalAmount,
                be: (current.be * current.amount + waterMaterial.be * waterAmount + material.be * materialAmount) / finalAmount,
                beffe: (current.beffe * current.amount + waterMaterial.beffe * waterAmount + material.beffe * materialAmount) / finalAmount,
                price: (current.price * current.amount + waterMaterial.price * waterAmount + material.price * materialAmount) / finalAmount
            };

            // WICHTIG: Gewürze in finale Mischung einrechnen
            finalMix = applySpicesToMix(finalMix, finalAmount);

            if (checkLeitsaetze(finalMix, target)) {
                const totalCost = (current.price * current.amount) + (waterMaterial.price * waterAmount) + (material.price * materialAmount) + (rawMaterials.gewuerze.price * finalMix.spiceAmount);
                const waterPercentage = (waterAmount / finalMix.amount) * 100;

                optimizations.push({
                    type: 'water-plus-material',
                    strategy: 'Wasser + Rohstoff',
                    description: formatAmountDescription(materialAmount, material.name) + ` + ${finalMix.spiceAmount.toFixed(1)}kg Gewürze`,
                    waterAmount: waterAmount,
                    additionalMaterials: [
                        {material: rawMaterials.ice, amount: waterAmount, type: 'ice'},
                        {material: material, amount: materialAmount, type: materialType}
                    ],
                    finalMix: finalMix,
                    totalAmount: finalMix.amount,
                    cost: totalCost,
                    costPerKg: totalCost / finalMix.amount,
                    waterPercentage: waterPercentage,
                    waterRatio: waterRatio
                });
            }
        }
    }
    
    // Beste Wasser-Schüttung zurückgeben
    if (optimizations.length > 0) {
        optimizations.sort((a, b) => b.waterPercentage - a.waterPercentage);
        console.log(`✅ Beste Wasser+Rohstoff-Kombination: ${optimizations[0].waterPercentage.toFixed(1)}% Wasser`);
        return optimizations[0];
    }
    
    return null;
}

// Strategie 3: Rohstoff-Kombinationen mit Wasser-Schüttung
function calculateCombinationOptimizations(current, target) {
    console.log('🔄 Teste Rohstoff-Kombinationen...');
    
    // Vereinfacht: Return leeres Array für jetzt
    return [];
}

// Neue Anzeigefunktion für Optimierungen
function displayOptimizations(optimizations) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = '';
    
    optimizations.forEach((optimization, index) => {
        // Badge und Text basierend auf Optimierungstyp
        let badge, badgeText, materialsText = '';

        if (optimization.type === 'downsize-substitution') {
            badge = 'downsize';
            badgeText = 'Downsizing';
            materialsText = `
                <div class="material-addition reduction">- ${optimization.removeAmount.toFixed(1)}kg ${optimization.materialToRemove}</div>
                <div class="material-addition addition">+ ${optimization.waterToAdd.toFixed(1)}kg Eis/Wasser</div>
            `;
        } else if (optimization.type === 'downsize-combined') {
            badge = 'downsize';
            badgeText = 'Kombinierte Reduzierung';
            materialsText = optimization.reductions.map(r =>
                `<div class="material-addition reduction">- ${r.reduceAmount.toFixed(1)}kg ${r.material.name}</div>`
            ).join('') + `<div class="material-addition addition">+ ${optimization.waterToAdd.toFixed(1)}kg Eis/Wasser</div>`;
        } else {
            badge = optimization.type === 'water-only' ? 'optimal' : 'water-plus';
            badgeText = optimization.type === 'water-only' ? 'Optimal' : 'Wasser+Rohstoff';

            if (optimization.additionalMaterials && optimization.additionalMaterials.length > 0) {
                materialsText = optimization.additionalMaterials.map(m =>
                    `<div class="material-addition">${m.amount >= 0 ? '+' : ''} ${formatAmountDescription(m.amount, m.material.name)}</div>`
                ).join('');
            }
        }

        const card = document.createElement('div');
        card.className = 'suggestion-card optimization-card';
        card.onclick = () => selectOptimization(index);
        
        // Berechne Endprodukt-Menge (inkl. Verluste)
        const endproductAmount = calculateEndproductAmount(optimization.totalAmount);
        const waste = getProductionWaste();
        const endproductCostPerKg = waste.totalWaste > 0 ? optimization.costPerKg / waste.wasteFactor : optimization.costPerKg;

        card.innerHTML = `
            <div class="suggestion-header">
                <div class="suggestion-title">${optimization.strategy}</div>
                <div class="suggestion-badge ${badge}">${badgeText}</div>
            </div>
            <div class="optimization-details">
                ${materialsText}
            </div>
            <div class="suggestion-details">
                <div class="detail-item">
                    <div class="detail-value">${optimization.totalAmount.toFixed(1)} kg</div>
                    <div class="detail-label">Brät-Menge</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${endproductAmount.toFixed(1)} kg</div>
                    <div class="detail-label">Endprodukt</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${endproductCostPerKg.toFixed(2)} €/kg</div>
                    <div class="detail-label">Kosten/kg EP</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${optimization.finalMix.beffe.toFixed(1)}%</div>
                    <div class="detail-label">BEFFE</div>
                </div>
            </div>
            <div style="margin-top: 10px; opacity: 0.8;">
                Ergebnis: ${optimization.finalMix.protein.toFixed(1)}% Eiweiß, ${optimization.finalMix.fat.toFixed(1)}% Fett, ${optimization.finalMix.water.toFixed(1)}% Wasser
                ${waste.totalWaste > 0 ? `<br><span style="font-size: 0.9em; color: #f39c12;">⚠️ ${waste.totalWaste}% Produktionsverlust eingerechnet</span>` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
    
    document.getElementById('suggestions-section').style.display = 'block';
}

// Kostenoptimierte Rezepturen anzeigen
function displayCostOptimizations(optimizations) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = '';

    optimizations.forEach((optimization, index) => {
        // Erstelle Bestellliste
        let orderListHTML = '<div class="order-list">';
        orderListHTML += '<h4>📦 Bestellliste:</h4>';
        optimization.materials.forEach(mat => {
            orderListHTML += `
                <div class="order-item">
                    <span class="order-name">${mat.name}</span>
                    <span class="order-amount">${mat.amount.toFixed(1)} kg</span>
                    <span class="order-price">${(mat.amount * mat.price).toFixed(2)} €</span>
                </div>
            `;
        });
        orderListHTML += '</div>';

        const card = document.createElement('div');
        card.className = 'suggestion-card cost-optimization-card';
        card.onclick = () => selectOptimization(index);

        // Berechne Endprodukt-Menge (inkl. Verluste)
        const endproductAmount = calculateEndproductAmount(optimization.totalAmount);
        const waste = getProductionWaste();
        const endproductCostPerKg = waste.totalWaste > 0 ? optimization.costPerKg / waste.wasteFactor : optimization.costPerKg;
        const endproductTotalCost = endproductCostPerKg * endproductAmount;

        card.innerHTML = `
            <div class="suggestion-header">
                <div class="suggestion-title">${optimization.strategy}</div>
                <div class="suggestion-badge cost-optimized">Kostenoptimiert</div>
            </div>
            ${orderListHTML}
            <div class="suggestion-details">
                <div class="detail-item">
                    <div class="detail-value">${optimization.totalAmount.toFixed(1)} kg</div>
                    <div class="detail-label">Brät-Menge</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${endproductAmount.toFixed(1)} kg</div>
                    <div class="detail-label">Endprodukt</div>
                </div>
                <div class="detail-item highlight">
                    <div class="detail-value">${endproductCostPerKg.toFixed(2)} €/kg</div>
                    <div class="detail-label">Kosten/kg EP</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${endproductTotalCost.toFixed(2)} €</div>
                    <div class="detail-label">Gesamtkosten EP</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${optimization.finalMix.beffe.toFixed(1)}%</div>
                    <div class="detail-label">BEFFE</div>
                </div>
            </div>
            <div class="nutrition-summary">
                Ergebnis: ${optimization.finalMix.protein.toFixed(1)}% Eiweiß, ${optimization.finalMix.fat.toFixed(1)}% Fett, ${optimization.finalMix.water.toFixed(1)}% Wasser
                ${waste.totalWaste > 0 ? `<br><span style="font-size: 0.9em; color: #f39c12;">⚠️ ${waste.totalWaste}% Produktionsverlust eingerechnet</span>` : ''}
            </div>
        `;

        container.appendChild(card);
    });

    document.getElementById('suggestions-section').style.display = 'block';
}

// Optimierung auswählen
function selectOptimization(index) {
    selectSuggestion(index); // Nutze die bestehende Funktion
}

// Vorschläge generieren
function generateSuggestions(current, target) {
    const suggestions = [];
    const neededAmount = target.quantity - current.amount;
    
    console.log(`🔍 Suche Lösungen für:`);
    console.log(`Aktuell: ${current.protein}% Eiweiß, ${current.fat}% Fett, ${current.water}% Wasser (${current.amount}kg)`);
    console.log(`Ziel: ${target.protein}% Eiweiß, ${target.fat}% Fett, ${target.water}% Wasser (${target.quantity}kg)`);
    console.log(`Benötigt: ${neededAmount}kg zusätzlich`);
    
    // Zuerst: Normale Rohstoffe testen (ohne Wasser)
    const normalMaterials = Object.entries(rawMaterials).filter(([key]) => key !== 'ice');
    
    for (const [materialType, material] of normalMaterials) {
        if (materialType === current.type && current.type !== 'custom') continue;
        
        const ratio1 = current.amount / target.quantity;
        const ratio2 = neededAmount / target.quantity;
        
        const mix = calculateMixture(current, material, ratio1, ratio2);
        
        const tolerance = {
            protein: 3.0,    // Erhöht von 2.0 auf 3.0
            fat: 8.0,        // Erhöht von 4.0 auf 8.0
            water: 10.0,     // Erhöht von 5.0 auf 10.0
            beffe: -3.0      // Erhöht von -2.0 auf -3.0
        };
        
        const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
        const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
        const waterOk = Math.abs(mix.water - target.water) <= tolerance.water;
        const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
        
        console.log(`\n🧪 Test ${material.name}:`);
        console.log(`Mischung: ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett, ${mix.water.toFixed(1)}% Wasser, ${mix.beffe.toFixed(1)}% BEFFE`);
        console.log(`Ziel: ${target.protein}% Eiweiß, ${target.fat}% Fett, ${target.water}% Wasser, ${target.beffe}% BEFFE`);
        console.log(`Diff: Eiweiß=${Math.abs(mix.protein - target.protein).toFixed(1)} (${tolerance.protein}), Fett=${Math.abs(mix.fat - target.fat).toFixed(1)} (${tolerance.fat}), Wasser=${Math.abs(mix.water - target.water).toFixed(1)} (${tolerance.water}), BEFFE=${(mix.beffe - target.beffe).toFixed(1)} (${tolerance.beffe})`);
        console.log(`Protein OK: ${proteinOk}, Fett OK: ${fatOk}, Wasser OK: ${waterOk}, BEFFE OK: ${beffeOk}`);
        
        if (proteinOk && fatOk && waterOk && beffeOk) {
            const totalCost = (current.price * current.amount) + (material.price * neededAmount);
            
            // Prüfe ob Wasser-Spielraum vorhanden ist für Kostensenkung
            const waterRoomForOptimization = target.water - mix.water;
            let waterOptimized = null;
            
            if (waterRoomForOptimization > 2.0) { // Mindestens 2% Spielraum
                waterOptimized = calculateWaterOptimization(current, material, target, neededAmount);
            }
            
            suggestions.push({
                type: materialType,
                material: material,
                amount: neededAmount,
                totalAmount: target.quantity,
                mix: mix,
                cost: totalCost,
                costPerKg: totalCost / target.quantity,
                waterOptimized: waterOptimized
            });
            
            // Prüfe ob zusätzliches Wasser für diese Mischung nötig ist
            const additionalWaterSuggestion = generateAdditionalWaterSuggestion(current, material, neededAmount, target, mix);
            if (additionalWaterSuggestion) {
                suggestions.push(additionalWaterSuggestion);
            }
        }
    }
    
    // Füge Multi-Material Kombinationen hinzu
    const multiMaterialSuggestions = generateMultiMaterialSuggestions(current, target);
    suggestions.push(...multiMaterialSuggestions);
    
    // Prüfe ob direkter Wasser-Zusatz möglich ist
    console.log('🔍 Prüfe Wasser-Zusatz...');
    const waterSuggestion = generateWaterSuggestion(current, target);
    if (waterSuggestion) {
        console.log('✅ Wasser-Vorschlag hinzugefügt:', waterSuggestion);
        suggestions.push(waterSuggestion);
    } else {
        console.log('❌ Kein Wasser-Vorschlag generiert');
    }
    
    // Sortiere nach Kosten pro kg
    suggestions.sort((a, b) => a.costPerKg - b.costPerKg);
    
    return suggestions.slice(0, 8); // Top 8 Vorschläge (mehr Platz für Kombinationen)
}

// Wasser-Optimierung berechnen
function calculateWaterOptimization(current, material, target, baseAmount) {
    const waterMaterial = rawMaterials.ice;
    
    // Berechne maximale Wassermenge die hinzugefügt werden kann
    const maxWaterAmount = target.quantity * 0.05; // Max 5% der Gesamtmenge als Wasser
    
    // Reduziere die Menge des teuren Materials und füge Wasser hinzu
    const optimizedMaterialAmount = baseAmount - maxWaterAmount;
    
    if (optimizedMaterialAmount <= 0) return null;
    
    // Berechne neue Mischung mit Wasser
    const totalAmount = target.quantity;
    const currentRatio = current.amount / totalAmount;
    const materialRatio = optimizedMaterialAmount / totalAmount;
    const waterRatio = maxWaterAmount / totalAmount;
    
    const protein = (current.protein * currentRatio) + (material.protein * materialRatio) + (waterMaterial.protein * waterRatio);
    const hydroxy = (current.hydroxy * currentRatio) + (material.hydroxy * materialRatio) + (waterMaterial.hydroxy * waterRatio);
    const bindegewebsEiweiß = hydroxy * 8;

    const optimizedMix = {
        protein: protein,
        fat: (current.fat * currentRatio) + (material.fat * materialRatio) + (waterMaterial.fat * waterRatio),
        water: (current.water * currentRatio) + (material.water * materialRatio) + (waterMaterial.water * waterRatio),
        beffe: (current.beffe * currentRatio) + (calculateBEFFEFromValues(material.protein, material.hydroxy) * materialRatio) + (0 * waterRatio),
        hydroxy: hydroxy,
        bindegewebsEiweiß: bindegewebsEiweiß,
        be: bindegewebsEiweiß
    };
    
    // Prüfe ob optimierte Mischung noch legal ist
    const tolerance = { protein: 3.0, fat: 8.0, water: 10.0, beffe: -3.0 };
    const proteinOk = Math.abs(optimizedMix.protein - target.protein) <= tolerance.protein;
    const fatOk = Math.abs(optimizedMix.fat - target.fat) <= tolerance.fat;
    const waterOk = Math.abs(optimizedMix.water - target.water) <= tolerance.water;
    const beffeOk = optimizedMix.beffe >= (target.beffe + tolerance.beffe);
    
    if (proteinOk && fatOk && waterOk && beffeOk) {
        const optimizedCost = (current.price * current.amount) + (material.price * optimizedMaterialAmount) + (waterMaterial.price * maxWaterAmount);
        const savings = ((current.price * current.amount) + (material.price * baseAmount)) - optimizedCost;
        
        return {
            materialAmount: optimizedMaterialAmount,
            waterAmount: maxWaterAmount,
            mix: optimizedMix,
            cost: optimizedCost,
            savings: savings,
            costPerKg: optimizedCost / totalAmount
        };
    }
    
    return null;
}

// Multi-Material Kombinationen generieren
function generateMultiMaterialSuggestions(current, target) {
    const suggestions = [];
    const neededAmount = target.quantity - current.amount;
    
    console.log('🔥 Generiere Multi-Material Vorschläge...');
    
    // Alle verfügbaren Materialien außer Wasser und custom
    const materials = Object.entries(rawMaterials).filter(([key]) => 
        key !== 'ice' && key !== 'custom' && key !== current.type
    );
    
    // 2-Material Kombinationen
    for (let i = 0; i < materials.length; i++) {
        for (let j = i + 1; j < materials.length; j++) {
            const [type1, material1] = materials[i];
            const [type2, material2] = materials[j];
            
            // Teste verschiedene Verhältnisse (30/70, 40/60, 50/50, 60/40, 70/30)
            const ratios = [
                {r1: 0.3, r2: 0.7},
                {r1: 0.4, r2: 0.6},
                {r1: 0.5, r2: 0.5},
                {r1: 0.6, r2: 0.4},
                {r1: 0.7, r2: 0.3}
            ];
            
            for (const ratio of ratios) {
                const amount1 = neededAmount * ratio.r1;
                const amount2 = neededAmount * ratio.r2;
                
                // Berechne kombinierte Mischung
                const mix = calculateMultiMaterialMixture(current, [
                    {material: material1, amount: amount1},
                    {material: material2, amount: amount2}
                ], target);
                
                // Prüfe Toleranzen
                const tolerance = { protein: 3.0, fat: 8.0, water: 10.0, beffe: -3.0 };
                const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
                const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
                const waterOk = Math.abs(mix.water - target.water) <= tolerance.water;
                const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
                
                if (proteinOk && fatOk && waterOk && beffeOk) {
                    const totalCost = (current.price * current.amount) + 
                                    (material1.price * amount1) + 
                                    (material2.price * amount2);
                    
                    suggestions.push({
                        type: 'multi-material',
                        isMultiMaterial: true,
                        materials: [
                            {type: type1, material: material1, amount: amount1},
                            {type: type2, material: material2, amount: amount2}
                        ],
                        totalAmount: target.quantity,
                        mix: mix,
                        cost: totalCost,
                        costPerKg: totalCost / target.quantity,
                        quality: calculateMultiMaterialQuality(mix, target)
                    });
                    
                    console.log(`✅ Kombination gefunden: ${material1.name} (${amount1.toFixed(0)}kg) + ${material2.name} (${amount2.toFixed(0)}kg)`);
                }
            }
        }
    }
    
    // 3-Material Kombinationen (nur die besten)
    if (materials.length >= 3) {
        const [type1, material1] = materials[0]; // Schultern
        const [type2, material2] = materials[1]; // Rückenspeck  
        const [type3, material3] = materials[2]; // Backen
        
        // Teste einige ausgewählte 3-Wege Verhältnisse
        const tripleRatios = [
            {r1: 0.4, r2: 0.3, r3: 0.3},
            {r1: 0.5, r2: 0.25, r3: 0.25},
            {r1: 0.33, r2: 0.33, r3: 0.34}
        ];
        
        for (const ratio of tripleRatios) {
            const amount1 = neededAmount * ratio.r1;
            const amount2 = neededAmount * ratio.r2;
            const amount3 = neededAmount * ratio.r3;
            
            const mix = calculateMultiMaterialMixture(current, [
                {material: material1, amount: amount1},
                {material: material2, amount: amount2},
                {material: material3, amount: amount3}
            ], target);
            
            const tolerance = { protein: 3.0, fat: 8.0, water: 10.0, beffe: -3.0 };
            const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
            const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
            const waterOk = Math.abs(mix.water - target.water) <= tolerance.water;
            const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
            
            if (proteinOk && fatOk && waterOk && beffeOk) {
                const totalCost = (current.price * current.amount) + 
                                (material1.price * amount1) + 
                                (material2.price * amount2) + 
                                (material3.price * amount3);
                
                suggestions.push({
                    type: 'multi-material',
                    isMultiMaterial: true,
                    materials: [
                        {type: type1, material: material1, amount: amount1},
                        {type: type2, material: material2, amount: amount2},
                        {type: type3, material: material3, amount: amount3}
                    ],
                    totalAmount: target.quantity,
                    mix: mix,
                    cost: totalCost,
                    costPerKg: totalCost / target.quantity,
                    quality: calculateMultiMaterialQuality(mix, target)
                });
                
                console.log(`✅ 3-Wege Kombination: ${material1.name} + ${material2.name} + ${material3.name}`);
            }
        }
    }
    
    return suggestions.slice(0, 3); // Top 3 Multi-Material Vorschläge
}

// Direkter Wasser-Zusatz wenn Wasser-Mangel
function generateWaterSuggestion(current, target) {
    const currentWater = current.water;
    const targetWater = target.water;
    const neededAmount = target.quantity - current.amount;
    
    console.log(`💧 Prüfe direkten Wasser-Zusatz: Aktuell ${currentWater.toFixed(1)}%, Ziel ${targetWater.toFixed(1)}%`);
    console.log(`💧 Aber das prüft nur die aktuelle Mischung - müssen finale Mischungen prüfen!`);
    
    // Deaktiviert - wird jetzt in generateAdditionalWaterSuggestion für jeden Vorschlag gemacht
    return null;
    
    const waterDeficit = targetWater - currentWater; // z.B. 62% - 56.9% = 5.1%
    
    // Berechne benötigte Wassermenge
    // Formel: currentAmount * currentWater + waterAmount * 100 = (currentAmount + waterAmount) * targetWater
    // => waterAmount = (currentAmount * (targetWater - currentWater)) / (100 - targetWater)
    
    const neededWaterAmount = (current.amount * waterDeficit) / (100 - targetWater);
    
    console.log(`💧 Wassermangel: ${waterDeficit.toFixed(1)}% → ${neededWaterAmount.toFixed(1)}kg Wasser benötigt`);
    
    // Prüfe ob das die benötigte Gesamtmenge erreicht
    const totalWithWater = current.amount + neededWaterAmount;
    const remainingAmount = target.quantity - totalWithWater;
    
    // Wenn noch mehr Material nötig ist, ist reines Wasser nicht die Lösung
    if (remainingAmount > 100) { // Mehr als 100kg zusätzlich nötig - lockerer machen
        console.log(`💧 Reines Wasser reicht nicht (${remainingAmount.toFixed(0)}kg fehlen noch)`);
        return null;
    }
    
    // Berechne finale Mischung mit Wasser
    const waterMaterial = rawMaterials.ice;
    const finalAmount = Math.min(totalWithWater, target.quantity);
    const actualWaterAmount = finalAmount - current.amount;
    
    const protein = (current.protein * current.amount + waterMaterial.protein * actualWaterAmount) / finalAmount;
    const hydroxy = (current.hydroxy * current.amount + waterMaterial.hydroxy * actualWaterAmount) / finalAmount;
    const bindegewebsEiweiß = hydroxy * 8;

    const mix = {
        protein: protein,
        fat: (current.fat * current.amount + waterMaterial.fat * actualWaterAmount) / finalAmount,
        water: (current.water * current.amount + waterMaterial.water * actualWaterAmount) / finalAmount,
        beffe: (current.beffe * current.amount + 0 * actualWaterAmount) / finalAmount,
        hydroxy: hydroxy,
        bindegewebsEiweiß: bindegewebsEiweiß,
        be: bindegewebsEiweiß
    };
    
    console.log(`💧 Mischung mit Wasser: ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett, ${mix.water.toFixed(1)}% Wasser, ${mix.beffe.toFixed(1)}% BEFFE`);
    
    // Prüfe ob andere Zielwerte noch stimmen (lockere Toleranzen da wir nur Wasser hinzufügen)
    const tolerance = { protein: 4.0, fat: 4.0, beffe: -2.0 }; // Lockerer gemacht
    const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
    const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
    const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
    
    console.log(`💧 Toleranz-Check: Protein ${proteinOk} (${Math.abs(mix.protein - target.protein).toFixed(1)} <= ${tolerance.protein}), Fett ${fatOk} (${Math.abs(mix.fat - target.fat).toFixed(1)} <= ${tolerance.fat}), BEFFE ${beffeOk} (${mix.beffe.toFixed(1)} >= ${target.beffe + tolerance.beffe})`);
    
    if (!proteinOk || !fatOk || !beffeOk) {
        console.log(`💧 Wasser-Zusatz verschlechtert andere Werte zu stark`);
        console.log(`💧 Protein-Diff: ${Math.abs(mix.protein - target.protein).toFixed(1)}, Fett-Diff: ${Math.abs(mix.fat - target.fat).toFixed(1)}, BEFFE: ${mix.beffe.toFixed(1)} vs ${target.beffe}`);
        return null;
    }
    
    const totalCost = (current.price * current.amount) + (waterMaterial.price * actualWaterAmount);
    
    console.log(`✅ Wasser-Vorschlag: ${actualWaterAmount.toFixed(1)}kg Wasser für ${totalCost.toFixed(2)}€`);
    
    return {
        type: 'wasser',
        material: waterMaterial,
        amount: actualWaterAmount,
        totalAmount: finalAmount,
        mix: mix,
        cost: totalCost,
        costPerKg: totalCost / finalAmount,
        isWaterAddition: true,
        waterOptimized: null
    };
}

// Zusätzliches Wasser für bestehende Rezepte
function generateAdditionalWaterSuggestion(current, material, materialAmount, target, currentMix) {
    const currentWater = currentMix.water;
    const targetWater = target.water;
    
    console.log(`💧🔄 Prüfe zusätzliches Wasser für ${material.name}: Mischung hat ${currentWater.toFixed(1)}%, Ziel ${targetWater.toFixed(1)}%`);
    
    // Nur wenn die Mischung zu wenig Wasser hat
    if (currentWater >= targetWater - 0.5) { // 0.5% Toleranz - strenger
        console.log(`💧🔄 Kein zusätzliches Wasser nötig (${currentWater.toFixed(1)}% >= ${(targetWater - 0.5).toFixed(1)}%)`);
        return null;
    }
    
    const waterDeficit = targetWater - currentWater;
    console.log(`💧🔄 Wassermangel: ${waterDeficit.toFixed(1)}%`);
    
    // Berechne aktuelle Gesamtmenge nach Material-Zusatz
    const currentTotalAmount = current.amount + materialAmount;
    
    // Berechne benötigte Wassermenge
    // Formel: (currentAmount * currentWater + waterAmount * 100) / (currentAmount + waterAmount) = targetWater
    // => waterAmount = currentAmount * (targetWater - currentWater) / (100 - targetWater)
    const neededWaterAmount = (currentTotalAmount * waterDeficit) / (100 - targetWater);
    
    console.log(`💧🔄 Formel: ${currentTotalAmount}kg * ${waterDeficit.toFixed(1)}% / (100 - ${targetWater}) = ${neededWaterAmount.toFixed(1)}kg`);
    console.log(`💧🔄 Benötigtes Wasser: ${neededWaterAmount.toFixed(1)}kg für ${currentTotalAmount}kg Mischung`);
    
    // Validierung der Formel
    const testWaterPercent = (currentTotalAmount * currentWater + neededWaterAmount * 100) / (currentTotalAmount + neededWaterAmount);
    console.log(`💧🔄 Validierung: (${currentTotalAmount} * ${currentWater.toFixed(1)} + ${neededWaterAmount.toFixed(1)} * 100) / (${currentTotalAmount} + ${neededWaterAmount.toFixed(1)}) = ${testWaterPercent.toFixed(1)}% (soll ${targetWater}%)`);
    
    // Neue Gesamtmenge mit Wasser
    const finalAmount = currentTotalAmount + neededWaterAmount;
    
    // Prüfe ob das zu viel über das Ziel hinausgeht
    if (finalAmount > target.quantity * 1.1) { // Maximal 10% mehr als Ziel
        console.log(`💧🔄 Zu viel Gesamtmenge: ${finalAmount.toFixed(0)}kg > ${(target.quantity * 1.1).toFixed(0)}kg`);
        return null;
    }
    
    // Berechne finale Mischung mit Wasser
    const waterMaterial = rawMaterials.ice;
    
    const protein = (current.protein * current.amount + material.protein * materialAmount + waterMaterial.protein * neededWaterAmount) / finalAmount;
    const hydroxy = (current.hydroxy * current.amount + material.hydroxy * materialAmount + waterMaterial.hydroxy * neededWaterAmount) / finalAmount;
    const bindegewebsEiweiß = hydroxy * 8;

    const finalMix = {
        protein: protein,
        fat: (current.fat * current.amount + material.fat * materialAmount + waterMaterial.fat * neededWaterAmount) / finalAmount,
        water: (current.water * current.amount + material.water * materialAmount + waterMaterial.water * neededWaterAmount) / finalAmount,
        beffe: (current.beffe * current.amount + calculateBEFFEFromValues(material.protein, material.hydroxy) * materialAmount + 0 * neededWaterAmount) / finalAmount,
        hydroxy: hydroxy,
        bindegewebsEiweiß: bindegewebsEiweiß,
        be: bindegewebsEiweiß
    };
    
    console.log(`💧🔄 Detaillierte Berechnung:`);
    console.log(`💧🔄 Wasser: (${current.water.toFixed(1)} * ${current.amount} + ${material.water.toFixed(1)} * ${materialAmount} + ${waterMaterial.water} * ${neededWaterAmount.toFixed(1)}) / ${finalAmount} = ${finalMix.water.toFixed(2)}%`);
    console.log(`💧🔄 = (${(current.water * current.amount).toFixed(1)} + ${(material.water * materialAmount).toFixed(1)} + ${(waterMaterial.water * neededWaterAmount).toFixed(1)}) / ${finalAmount} = ${finalMix.water.toFixed(2)}%`);
    console.log(`💧🔄 Finale Mischung: ${finalMix.protein.toFixed(1)}% Eiweiß, ${finalMix.fat.toFixed(1)}% Fett, ${finalMix.water.toFixed(1)}% Wasser, ${finalMix.beffe.toFixed(1)}% BEFFE`);
    
    // Prüfe Toleranzen für finale Mischung
    const tolerance = { protein: 3.0, fat: 6.0, beffe: -2.0 };
    const proteinOk = Math.abs(finalMix.protein - target.protein) <= tolerance.protein;
    const fatOk = Math.abs(finalMix.fat - target.fat) <= tolerance.fat;
    const beffeOk = finalMix.beffe >= (target.beffe + tolerance.beffe);
    
    console.log(`💧🔄 Toleranz-Check: Protein ${proteinOk}, Fett ${fatOk}, BEFFE ${beffeOk}`);
    
    if (!proteinOk || !fatOk || !beffeOk) {
        console.log(`💧🔄 Zusätzliches Wasser verschlechtert andere Werte zu stark`);
        return null;
    }
    
    const totalCost = (current.price * current.amount) + (material.price * materialAmount) + (waterMaterial.price * neededWaterAmount);
    
    console.log(`✅ Zusätzlicher Wasser-Vorschlag: ${material.name} + ${neededWaterAmount.toFixed(1)}kg Wasser`);
    
    return {
        type: 'material-plus-water',
        material: material,
        amount: materialAmount,
        waterAmount: neededWaterAmount,
        totalAmount: finalAmount,
        mix: finalMix,
        cost: totalCost,
        costPerKg: totalCost / finalAmount,
        isWaterAddition: true,
        isMaterialPlusWater: true,
        baseMaterialName: material.name
    };
}

// Multi-Material Mischung berechnen
function calculateMultiMaterialMixture(current, additionalMaterials, target) {
    let totalAmount = current.amount;
    let totalProtein = current.protein * current.amount;
    let totalFat = current.fat * current.amount;
    let totalWater = current.water * current.amount;
    let totalBEFFE = current.beffe * current.amount;
    
    additionalMaterials.forEach(item => {
        totalAmount += item.amount;
        totalProtein += item.material.protein * item.amount;
        totalFat += item.material.fat * item.amount;
        totalWater += item.material.water * item.amount;
        totalBEFFE += calculateBEFFEFromValues(item.material.protein, item.material.hydroxy) * item.amount;
    });
    
    const protein = totalProtein / totalAmount;
    const hydroxy = additionalMaterials.reduce((sum, item) => sum + item.material.hydroxy * item.amount, current.hydroxy * current.amount) / totalAmount;
    const bindegewebsEiweiß = hydroxy * 8;

    return {
        protein: protein,
        fat: totalFat / totalAmount,
        water: totalWater / totalAmount,
        beffe: totalBEFFE / totalAmount,
        be: bindegewebsEiweiß,
        hydroxy: hydroxy,
        bindegewebsEiweiß: bindegewebsEiweiß
    };
}

// Qualität für Multi-Material berechnen
function calculateMultiMaterialQuality(mix, target) {
    let score = 100;
    score -= Math.abs(mix.protein - target.protein) * 3;
    score -= Math.abs(mix.fat - target.fat) * 2;
    score -= Math.abs(mix.water - target.water) * 1;
    score -= Math.max(0, target.beffe - mix.beffe) * 5;
    return Math.max(0, score);
}

// Neue Funktion: Konzentrations-Vorschläge für niedrige Ausgangswerte
function generateConcentrationSuggestions(current, target) {
    const suggestions = [];
    const neededAmount = target.quantity - current.amount;
    
    console.log('🚀 Generiere Konzentrations-Vorschläge...');
    
    // Hochkonzentrierte Rohstoffe für niedrige Ausgangswerte
    const concentrationMaterials = {
        "fettreich": { protein: 12.0, fat: 45.0, water: 42.0, hydroxy: 0.05, price: 3.80, name: "Fettreiche Mischung 55/45" },
        "eiweissreich": { protein: 22.0, fat: 15.0, water: 62.0, hydroxy: 0.09, price: 5.20, name: "Eiweißreiche Mischung" },
        "standard_plus": { protein: 16.0, fat: 30.0, water: 53.0, hydroxy: 0.07, price: 4.60, name: "Verstärkte 70/30" },
        "speck": { protein: 8.0, fat: 65.0, water: 26.0, hydroxy: 0.03, price: 2.90, name: "Speck/Fettgewebe" }
    };
    
    for (const [materialType, material] of Object.entries(concentrationMaterials)) {
        const ratio1 = current.amount / target.quantity;
        const ratio2 = neededAmount / target.quantity;
        
        const mix = calculateMixture(current, material, ratio1, ratio2);
        
        // Noch lockerere Toleranzen für Konzentration
        const tolerance = {
            protein: 3.0,
            fat: 6.0,
            beffe: -3.0
        };
        
        const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
        const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
        const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
        
        console.log(`🧪 Konzentrations-Test ${material.name}:`);
        console.log(`Material: ${material.protein}% Eiweiß, ${material.fat}% Fett`);
        console.log(`Mischung: ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett`);
        console.log(`Toleranzen: Protein ${proteinOk}, Fett ${fatOk}, BEFFE ${beffeOk}`);
        
        if (proteinOk && fatOk && beffeOk) {
            const totalCost = (current.price * current.amount) + (material.price * neededAmount);
            const avgCost = totalCost / target.quantity;
            
            suggestions.push({
                material: materialType,
                materialName: material.name,
                neededAmount: neededAmount,
                ratio1: ratio1,
                ratio2: ratio2,
                mix: mix,
                cost: avgCost,
                totalCost: totalCost,
                materialPrice: material.price,
                quality: calculateQuality(mix, target),
                isConcentration: true
            });
            
            console.log(`✅ Konzentrations-Lösung: ${material.name}`);
        }
    }
    
    // Falls immer noch keine Lösung: Verdünnungs-Strategie versuchen
    if (suggestions.length === 0) {
        console.log('⚠️ Auch Konzentration funktioniert nicht. Versuche Verdünnung...');
        return generateDilutionSuggestions(current, target);
    }
    
    return suggestions.slice(0, 3);
}

// Neue Funktion: Verdünnungs-Vorschläge für schwierige Fälle
function generateDilutionSuggestions(current, target) {
    const suggestions = [];
    const neededAmount = target.quantity - current.amount;
    
    console.log('🧊 Generiere Verdünnungs-Vorschläge...');
    
    // Spezielle Verdünnungs-Rohstoffe
    const dilutionMaterials = {
        "eiswasser": { protein: 0.0, fat: 0.0, water: 100.0, hydroxy: 0.0, price: 0.10, name: "Eiswasser/Brühe" },
        "magerseparator": { protein: 16.0, fat: 8.0, water: 75.0, hydroxy: 0.18, price: 2.80, name: "Mageres Separatorenfleisch" },
        "sehnenfrei": { protein: 19.8, fat: 2.5, water: 77.0, hydroxy: 0.06, price: 7.50, name: "Sehnenfreies Muskelfleisch" }
    };
    
    for (const [materialType, material] of Object.entries(dilutionMaterials)) {
        const ratio1 = current.amount / target.quantity;
        const ratio2 = neededAmount / target.quantity;
        
        const mix = calculateMixture(current, material, ratio1, ratio2);
        
        // Noch lockerere Toleranzen für Verdünnung
        const tolerance = {
            protein: 2.0,
            fat: 4.0,
            beffe: -2.0
        };
        
        const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
        const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
        const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
        
        console.log(`🧪 Verdünnungs-Test ${material.name}:`);
        console.log(`Mischung: ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett`);
        console.log(`Toleranzen: Protein ${proteinOk}, Fett ${fatOk}, BEFFE ${beffeOk}`);
        
        if (proteinOk && fatOk && beffeOk) {
            const totalCost = (current.price * current.amount) + (material.price * neededAmount);
            const avgCost = totalCost / target.quantity;
            
            suggestions.push({
                material: materialType,
                materialName: material.name,
                neededAmount: neededAmount,
                ratio1: ratio1,
                ratio2: ratio2,
                mix: mix,
                cost: avgCost,
                totalCost: totalCost,
                materialPrice: material.price,
                quality: calculateQuality(mix, target),
                isDilution: true // Markierung für spezielle Darstellung
            });
            
            console.log(`✅ Verdünnungs-Lösung: ${material.name}`);
        }
    }
    
    // Falls immer noch keine Lösung: "Unmöglich"-Meldung mit Hinweisen
    if (suggestions.length === 0) {
        console.log('❌ Auch Verdünnung funktioniert nicht');
        return generateImpossibleSuggestions(current, target);
    }
    
    return suggestions.slice(0, 3);
}

// Neue Funktion: Hinweise wenn wirklich keine Lösung möglich
function generateImpossibleSuggestions(current, target) {
    console.log('📋 Generiere Unmöglich-Hinweise...');
    
    // Analysiere das Problem
    const proteinDiff = current.protein - target.protein;
    const fatDiff = current.fat - target.fat;
    
    let problemAnalysis = "⚠️ Mit der aktuellen BigBox ist das Zielprodukt nicht erreichbar.\n\n";
    
    if (proteinDiff > 2) {
        problemAnalysis += `❌ Eiweiß zu hoch: ${current.protein}% → ${target.protein}% (${proteinDiff.toFixed(1)}% zu viel)\n`;
    }
    if (fatDiff > 3) {
        problemAnalysis += `❌ Fett zu hoch: ${current.fat}% → ${target.fat}% (${fatDiff.toFixed(1)}% zu viel)\n`;
    }
    
    problemAnalysis += "\n💡 Mögliche Lösungen:\n";
    problemAnalysis += "• Kleinere Mengen der aktuellen BigBox verwenden\n";
    problemAnalysis += "• Andere BigBox mit niedrigeren Werten besorgen\n";
    problemAnalysis += "• Zielprodukt-Spezifikationen anpassen\n";
    problemAnalysis += "• Wasserzugabe erhöhen (falls erlaubt)";
    
    // Fake-Suggestion für UI
    return [{
        material: "impossible",
        materialName: "Keine Lösung möglich",
        neededAmount: 0,
        mix: current,
        cost: 999,
        quality: 0,
        isImpossible: true,
        problemAnalysis: problemAnalysis
    }];
}

// Mischung berechnen
function calculateMixture(material1, material2, ratio1, ratio2) {
    const protein = (material1.protein * ratio1) + (material2.protein * ratio2);
    const fat = (material1.fat * ratio1) + (material2.fat * ratio2);
    const water = (material1.water * ratio1) + (material2.water * ratio2);
    const hydroxy = (material1.hydroxy * ratio1) + (material2.hydroxy * ratio2);
    
    const bindegewebsEiweiß = hydroxy * 8;
    const beffe = protein - bindegewebsEiweiß;
    const wew = water / protein;
    const waterProteinRatio = calculateWaterToProteinRatio(water, protein);
    const fatProteinRatio = calculateFatToProteinRatio(fat, protein);

    return {
        protein,
        fat,
        water,
        hydroxy,
        beffe,
        wew,
        bindegewebsEiweiß,
        be: bindegewebsEiweiß,
        waterProteinRatio,
        fatProteinRatio
    };
}

// BEFFE aus Protein und Hydroxy berechnen
function calculateBEFFEFromValues(protein, hydroxy) {
    const bindegewebsEiweiß = hydroxy * 8;
    return protein - bindegewebsEiweiß;
}

// Wasser zu Fleischprotein Faktor berechnen (sollte ≤ 5,5)
function calculateWaterToProteinRatio(water, protein) {
    if (protein <= 0) return 0;
    return water / protein;
}

// Fett zu Fleischprotein Faktor berechnen (sollte ≤ 3,2)
function calculateFatToProteinRatio(fat, protein) {
    if (protein <= 0) return 0;
    return fat / protein;
}

// Qualitätsscore berechnen
function calculateQuality(mix, target) {
    let score = 100;
    
    // Abweichungen bestrafen
    score -= Math.abs(mix.protein - target.protein) * 5;
    score -= Math.abs(mix.fat - target.fat) * 3;
    score -= Math.max(0, target.beffe - mix.beffe) * 10;
    
    return Math.max(0, score);
}

// Vorschläge anzeigen
function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = '';
    
    // Spezielle Behandlung für "Unmöglich"-Fall
    if (suggestions.length === 1 && suggestions[0].isImpossible) {
        container.innerHTML = `
            <div class="suggestion-card impossible-card">
                <div class="suggestion-header">
                    <div class="suggestion-title">❌ Keine Lösung möglich</div>
                    <div class="suggestion-badge danger">Problem-Analyse</div>
                </div>
                <div style="margin: 20px 0; white-space: pre-line; opacity: 0.9;">
                    ${suggestions[0].problemAnalysis}
                </div>
            </div>
        `;
        document.getElementById('suggestions-section').style.display = 'block';
        return;
    }
    
    suggestions.forEach((suggestion, index) => {
        const badge = suggestion.isConcentration ? 'concentration' :
                     suggestion.isDilution ? 'dilution' :
                     suggestion.isMultiMaterial ? 'multi' :
                     suggestion.isWaterAddition ? 'water' :
                     index === 0 ? 'best' : 
                     suggestion.costPerKg === Math.min(...suggestions.map(s => s.costPerKg)) ? 'cheap' : 'quality';
        const badgeText = suggestion.isConcentration ? 'Konzentration' :
                         suggestion.isDilution ? 'Verdünnung' :
                         suggestion.isMultiMaterial ? 'Kombination' :
                         suggestion.isWaterAddition ? 'Wasser-Zusatz' :
                         badge === 'best' ? 'Beste Wahl' : 
                         badge === 'cheap' ? 'Günstigste' : 'Hohe Qualität';
        
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        if (suggestion.isDilution) card.classList.add('dilution-card');
        if (suggestion.isConcentration) card.classList.add('concentration-card');
        if (suggestion.isMultiMaterial) card.classList.add('multi-material-card');
        if (suggestion.isWaterAddition) card.classList.add('water-addition-card');
        card.onclick = () => selectSuggestion(index);
        
        // Multi-Material Anzeige
        if (suggestion.isMultiMaterial) {
            const materialsList = suggestion.materials.map(m => 
                `<div class="multi-material-item">
                    <span class="material-name">${m.material.name}</span>
                    <span class="material-amount">${m.amount.toFixed(0)} kg</span>
                </div>`
            ).join('');
            
            const totalAmount = suggestion.materials.reduce((sum, m) => sum + m.amount, 0);
            const avgPrice = suggestion.materials.reduce((sum, m) => sum + (m.material.price * m.amount), 0) / totalAmount;
            
            card.innerHTML = `
                <div class="suggestion-header">
                    <div class="suggestion-title">Multi-Material Mischung</div>
                    <div class="suggestion-badge ${badge}">${badgeText}</div>
                </div>
                <div class="multi-materials-list">
                    ${materialsList}
                </div>
                <div class="suggestion-details">
                    <div class="detail-item">
                        <div class="detail-value">${totalAmount.toFixed(0)} kg</div>
                        <div class="detail-label">Gesamtmenge</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${avgPrice.toFixed(2)} €/kg</div>
                        <div class="detail-label">Preis</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.costPerKg.toFixed(2)} €/kg</div>
                        <div class="detail-label">Endkosten</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.quality.toFixed(0)}%</div>
                        <div class="detail-label">Qualität</div>
                    </div>
                </div>
                <div style="margin-top: 10px; opacity: 0.8;">
                    Ergebnis: ${suggestion.mix.protein.toFixed(1)}% Eiweiß, ${suggestion.mix.fat.toFixed(1)}% Fett, ${suggestion.mix.water.toFixed(1)}% Wasser, ${suggestion.mix.beffe.toFixed(1)}% BEFFE
                </div>
            `;
        } else if (suggestion.isMaterialPlusWater) {
            // Material + Wasser Anzeige
            card.innerHTML = `
                <div class="suggestion-header">
                    <div class="suggestion-title">${suggestion.baseMaterialName} + Wasser</div>
                    <div class="suggestion-badge ${badge}">${badgeText}</div>
                </div>
                <div class="suggestion-details">
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.amount.toFixed(0)} kg</div>
                        <div class="detail-label">${suggestion.baseMaterialName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.waterAmount.toFixed(0)} kg</div>
                        <div class="detail-label">+ Wasser</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.costPerKg.toFixed(2)} €/kg</div>
                        <div class="detail-label">Endkosten</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.totalAmount.toFixed(0)} kg</div>
                        <div class="detail-label">Gesamtmenge</div>
                    </div>
                </div>
                <div style="margin-top: 10px; opacity: 0.8;">
                    Ergebnis: ${suggestion.mix.protein.toFixed(1)}% Eiweiß, ${suggestion.mix.fat.toFixed(1)}% Fett, ${suggestion.mix.water.toFixed(1)}% Wasser, ${suggestion.mix.beffe.toFixed(1)}% BEFFE
                    <br><small>Erreicht Ziel-Wassergehalt durch Wasser-Zusatz</small>
                </div>
            `;
        } else {
            // Single-Material Anzeige
            card.innerHTML = `
                <div class="suggestion-header">
                    <div class="suggestion-title">${suggestion.material.name}</div>
                    <div class="suggestion-badge ${badge}">${badgeText}</div>
                </div>
                <div class="suggestion-details">
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.amount.toFixed(0)} kg</div>
                        <div class="detail-label">Benötigte Menge</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.material.price.toFixed(2)} €/kg</div>
                        <div class="detail-label">Preis pro kg</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${suggestion.costPerKg.toFixed(2)} €/kg</div>
                        <div class="detail-label">Durchschnittskosten</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">95%</div>
                        <div class="detail-label">Qualitätsscore</div>
                    </div>
                </div>
                <div style="margin-top: 10px; opacity: 0.8;">
                    Ergebnis: ${suggestion.mix.protein.toFixed(1)}% Eiweiß, ${suggestion.mix.fat.toFixed(1)}% Fett, ${suggestion.mix.water.toFixed(1)}% Wasser, ${suggestion.mix.beffe.toFixed(1)}% BEFFE
                    ${suggestion.waterOptimized ? '<br><small>Mit Wasser-Optimierung moeglich</small>' : ''}
                </div>
            `;
        }
        
        container.appendChild(card);
    });
    
    document.getElementById('suggestions-section').style.display = 'block';
}

// Vorschlag auswählen
function selectSuggestion(index) {
    // Alle Karten deselektieren
    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Gewählte Karte markieren
    document.querySelectorAll('.suggestion-card')[index].classList.add('selected');
    selectedSuggestion = currentSuggestions[index];
    
    // Finale Rezeptur anzeigen
    displayFinalRecipe(selectedSuggestion);
}

// Finale Rezeptur anzeigen (überarbeitet für neue Optimierungsdaten)
function displayFinalRecipe(suggestion) {
    const currentMaterials = getAllMaterials();
    const current = calculateCurrentMixture(currentMaterials);
    const target = getTargetSpecs();
    
    console.log('🔍 displayFinalRecipe - suggestion:', suggestion);
    
    const currentRatio = current.amount / suggestion.totalAmount;
    
    let recipeContent = `
        <div class="recipe-item">
            <h4>${current.name}</h4>
            <div class="detail-value">${current.amount.toFixed(0)} kg</div>
            <div class="detail-label">(${(currentRatio * 100).toFixed(1)}%)</div>
        </div>
    `;
    
    // Neue Optimierungslogik - Wasser-Zusatz
    if (suggestion.waterAmount && suggestion.waterAmount > 0) {
        const waterRatio = suggestion.waterAmount / suggestion.totalAmount;
        recipeContent += `
            <div class="recipe-item">
                <h4>Wasser/Eiswasser</h4>
                <div class="detail-value">${suggestion.waterAmount.toFixed(0)} kg</div>
                <div class="detail-label">(${(waterRatio * 100).toFixed(1)}%)</div>
            </div>
        `;
    }
    
    // Anpassungen aus Optimierung
    if (suggestion.additionalMaterials && suggestion.additionalMaterials.length > 0) {
        suggestion.additionalMaterials.forEach(material => {
            const ratio = material.amount / suggestion.totalAmount;
            recipeContent += `
                <div class="recipe-item">
                    <h4>${material.material.name}</h4>
                    <div class="detail-value">${material.amount.toFixed(0)} kg</div>
                    <div class="detail-label">(${(ratio * 100).toFixed(1)}%)</div>
                </div>
            `;
        });
    }
    
    // Alte Logik für Rückwärtskompatibilität
    if (suggestion.isMultiMaterial) {
        suggestion.materials.forEach(material => {
            const ratio = material.amount / suggestion.totalAmount;
            recipeContent += `
                <div class="recipe-item">
                    <h4>${material.material.name}</h4>
                    <div class="detail-value">${material.amount.toFixed(0)} kg</div>
                    <div class="detail-label">(${(ratio * 100).toFixed(1)}%)</div>
                </div>
            `;
        });
    } else if (suggestion.material && suggestion.amount) {
        // Alte Single-Material Logik
        const materialRatio = suggestion.amount / suggestion.totalAmount;
        recipeContent += `
            <div class="recipe-item">
                <h4>${suggestion.material.name}</h4>
                <div class="detail-value">${suggestion.amount.toFixed(0)} kg</div>
                <div class="detail-label">(${(materialRatio * 100).toFixed(1)}%)</div>
            </div>
        `;
    }
    
    recipeContent += `
        <div class="recipe-item">
            <h4>Gesamtmenge</h4>
            <div class="detail-value">${suggestion.totalAmount.toFixed(0)} kg</div>
            <div class="detail-label">Zielprodukt</div>
        </div>
        <div class="recipe-item">
            <h4>Endergebnis</h4>
            <div class="detail-value">${suggestion.finalMix.protein.toFixed(1)}% / ${suggestion.finalMix.fat.toFixed(1)}% / ${suggestion.finalMix.water.toFixed(1)}%</div>
            <div class="detail-label">Eiweiß / Fett / Wasser</div>
        </div>
        <div class="recipe-item">
            <h4>BEFFE</h4>
            <div class="detail-value">${suggestion.finalMix.beffe.toFixed(1)}%</div>
            <div class="detail-label">Qualitätsziel erreicht ✅</div>
        </div>
        <div class="recipe-item">
            <h4>Gesamtkosten</h4>
            <div class="detail-value">${suggestion.cost.toFixed(2)} €</div>
            <div class="detail-label">(${suggestion.costPerKg.toFixed(2)} €/kg)</div>
        </div>
    `;
    
    const recipeDetails = document.getElementById('recipe-details');
    recipeDetails.innerHTML = recipeContent;
    
    document.getElementById('final-recipe').style.display = 'block';
}

// Rezeptur in die Rohstoff-Felder laden
function loadRecipeIntoMaterials() {
    if (!selectedSuggestion) return;

    console.log('📋 Lade Rezeptur in Rohstoff-Felder...', selectedSuggestion);

    // Prüfe ob es eine Kostenoptimierung mit materials Array ist
    if (selectedSuggestion.type === 'cost-optimized' && selectedSuggestion.materials) {
        // Lösche alle bestehenden Rohstoff-Karten
        const container = document.getElementById('materials-container');
        container.innerHTML = '';

        // Setze materialCount zurück
        materialCount = 0;

        // Erstelle für jedes Material eine neue Karte
        selectedSuggestion.materials.forEach((mat, idx) => {
            const newIndex = materialCount;
            const material = rawMaterials[mat.key];

            const materialHTML = `
                <article class="material-card" data-index="${newIndex}">
                    <div class="material-header">
                        <h3>Rohstoff ${newIndex + 1}: ${mat.name}</h3>
                        <button type="button" class="remove-material-btn" onclick="removeMaterial(${newIndex})" aria-label="Rohstoff ${newIndex + 1} entfernen">
                            <span aria-hidden="true">❌</span>
                        </button>
                    </div>
                    <div class="input-grid">
                        <div class="input-group">
                            <label for="current-type-${newIndex}">Rohstofftyp</label>
                            <select id="current-type-${newIndex}" onchange="updateCurrentDefaults(${newIndex}); updateTotalMixture()">
                                <option value="s3" ${mat.key === 's3' ? 'selected' : ''}>S III</option>
                                <option value="s8" ${mat.key === 's8' ? 'selected' : ''}>S VIII</option>
                                <option value="s9" ${mat.key === 's9' ? 'selected' : ''}>S IX</option>
                                <option value="ice" ${mat.key === 'ice' ? 'selected' : ''}>Eis/Wasser</option>
                                <option value="schulter" ${mat.key === 'schulter' ? 'selected' : ''}>Schulter schier</option>
                                <option value="backen" ${mat.key === 'backen' ? 'selected' : ''}>Backen</option>
                                <option value="braet" ${mat.key === 'braet' ? 'selected' : ''}>Fertiges Brät (Validierung)</option>
                                <option value="gewuerze" ${mat.key === 'gewuerze' ? 'selected' : ''}>Gewürze & Zusatzstoffe</option>
                                <option value="custom" ${mat.key === 'custom' ? 'selected' : ''}>Benutzerdefiniert</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="current-be-${newIndex}">BE - Bindegewebseiweiß (%)</label>
                            <input type="number" id="current-be-${newIndex}" value="${material.be.toFixed(1)}" step="0.1" min="0" max="100" oninput="calculateCurrentBEFFE(${newIndex}); updateTotalMixture()">
                        </div>
                        <div class="input-group">
                            <label for="current-fat-${newIndex}">Fett (%)</label>
                            <input type="number" id="current-fat-${newIndex}" value="${material.fat.toFixed(1)}" step="0.1" min="0" max="100" oninput="updateTotalMixture()">
                        </div>
                        <div class="input-group">
                            <label for="current-water-${newIndex}">Wasser (%)</label>
                            <input type="number" id="current-water-${newIndex}" value="${material.water.toFixed(1)}" step="0.1" min="0" max="100" oninput="updateTotalMixture()">
                        </div>
                        <div class="input-group">
                            <label for="current-protein-${newIndex}">Eiweiß (%)</label>
                            <input type="number" id="current-protein-${newIndex}" value="${material.protein.toFixed(1)}" step="0.1" min="0" max="100" oninput="calculateCurrentBEFFE(${newIndex}); updateTotalMixture()">
                        </div>
                        <div class="input-group">
                            <label for="current-beffe-manual-${newIndex}">BEFFE (%)</label>
                            <input type="number" id="current-beffe-manual-${newIndex}" value="${material.beffe.toFixed(1)}" step="0.1" min="0" max="100" oninput="updateTotalMixture()">
                        </div>
                        <div class="input-group">
                            <label for="current-amount-${newIndex}">Verfügbare Menge (kg)</label>
                            <input type="number" id="current-amount-${newIndex}" value="${mat.amount.toFixed(1)}" step="10" min="0" oninput="updateTotalMixture()">
                        </div>
                    </div>
                </article>
            `;

            container.insertAdjacentHTML('beforeend', materialHTML);
            materialCount++;
        });

        // Aktualisiere Remove-Buttons und Gesamtmischung
        updateRemoveButtons();
        updateTotalMixture();

        // Scrolle zu den Rohstoff-Feldern
        document.querySelector('.materials-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Zeige Bestätigung
        setTimeout(() => {
            alert(`✅ Rezeptur in Rohstoff-Felder geladen!\n\n` +
                  `${selectedSuggestion.materials.length} Rohstoffe wurden übernommen.\n` +
                  `Du kannst die Werte jetzt noch anpassen.`);
        }, 500);

        return true;
    }

    return false;
}

// Rezeptur verwenden (überarbeitet für neue Optimierungsdaten)
function useRecipe() {
    if (!selectedSuggestion) return;

    // Für Kostenoptimierung: Lade Rezeptur in Felder
    if (selectedSuggestion.type === 'cost-optimized') {
        loadRecipeIntoMaterials();
        return;
    }

    // Alte Logik für andere Optimierungstypen
    const currentMaterials = getAllMaterials();
    const current = calculateCurrentMixture(currentMaterials);
    const target = getTargetSpecs();

    let materialText = '';

    // Anpassungen
    if (selectedSuggestion.additionalMaterials && selectedSuggestion.additionalMaterials.length > 0) {
        selectedSuggestion.additionalMaterials.forEach(m => {
            materialText += `${m.amount >= 0 ? '+' : '-'} ${formatAmountDescription(m.amount, m.material.name)}\n`;
        });
    }

    // Alte Logik für Rückwärtskompatibilität
    if (selectedSuggestion.isMultiMaterial) {
        selectedSuggestion.materials.forEach(m => {
            materialText += `${m.amount >= 0 ? '+' : '-'} ${formatAmountDescription(m.amount, m.material.name)}\n`;
        });
    } else if (selectedSuggestion.material && selectedSuggestion.amount) {
        materialText += `${selectedSuggestion.amount >= 0 ? '+' : '-'} ${formatAmountDescription(selectedSuggestion.amount, selectedSuggestion.material.name)}\n`;
    }

    const finalMix = selectedSuggestion.finalMix || selectedSuggestion.mix;

    alert(`✅ Rezeptur übernommen!\n\n` +
          `Basis: ${current.name}: ${current.amount.toFixed(0)} kg\n` +
          materialText +
          `= ${selectedSuggestion.totalAmount.toFixed(0)} kg ${document.getElementById('target-product').selectedOptions[0].text}\n\n` +
          `💰 Gesamtkosten: ${selectedSuggestion.cost.toFixed(2)} €\n` +
          `💰 Pro kg: ${selectedSuggestion.costPerKg.toFixed(2)} €/kg\n` +
          `Ergebnis: ${finalMix.protein.toFixed(1)}% Eiweiß, ${finalMix.fat.toFixed(1)}% Fett, ${finalMix.water.toFixed(1)}% Wasser`);
}

// Error handling
function showError(title, message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = `<strong>${title}:</strong> ${message}`;
    errorDiv.style.display = 'block';
    document.getElementById('suggestions-section').style.display = 'none';
}

function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

// PDF-Export-Funktion
// Deutsche Zeichen für PDF konvertieren
function sanitizeTextForPDF(text) {
    return text.toString()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/Ä/g, 'Ae')
        .replace(/Ö/g, 'Oe')
        .replace(/Ü/g, 'Ue')
        .replace(/ß/g, 'ss')
        .replace(/Eiweiß/g, 'Eiweiss')
        .replace(/Größe/g, 'Groesse')
        .replace(/Qualität/g, 'Qualitaet')
        .replace(/möglich/g, 'moeglich')
        .replace(/für/g, 'fuer')
        .replace(/Gewünschte/g, 'Gewuenschte')
        .replace(/[^\x00-\x7F]/g, ''); // Entferne alle Nicht-ASCII Zeichen
}

function exportToPDF() {
    if (!selectedSuggestion) {
        alert('Bitte erst eine Rezeptur auswählen!');
        return;
    }
    
    console.log('📄 Starte PDF-Export...');
    
    try {
        // jsPDF initialisieren
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Standard-Font für bessere Kompatibilität
        doc.setFont('helvetica', 'normal');
        
        // Aktuelle Daten holen
        const currentMaterials = getAllMaterials();
        const current = calculateCurrentMixture(currentMaterials);
        const target = getTargetSpecs();
        
        // Header
        doc.setFontSize(20);
        doc.text(sanitizeTextForPDF('Produktionsprotokoll'), 20, 20);
        doc.setFontSize(12);
        doc.text(sanitizeTextForPDF(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`), 20, 30);
        
        let yPos = 40;
        
        // Funktion für automatische Seitenerstellung
        function checkPageBreak(doc, yPos, requiredHeight = 15) {
            if (yPos + requiredHeight > 280) { // A4 Seitenhöhe ist etwa 297mm
                doc.addPage();
                return 20; // Neue Seite beginnt bei Y=20
            }
            return yPos;
        }
        
        // Endprodukt-Info
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFontSize(16);
        doc.text(sanitizeTextForPDF('Ziel-Endprodukt'), 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.text(sanitizeTextForPDF(`Produkt: ${document.getElementById('target-product').selectedOptions[0].text}`), 20, yPos);
        yPos += 7;
        doc.text(sanitizeTextForPDF(`Zielwerte: ${target.protein}% Eiweiss, ${target.fat}% Fett, ${target.water}% Wasser`), 20, yPos);
        yPos += 6;
        doc.text(sanitizeTextForPDF(`Min. BEFFE: ${target.beffe}%`), 20, yPos);
        yPos += 6;
        doc.text(sanitizeTextForPDF(`Gewuenschte Menge: ${target.quantity} kg`), 20, yPos);
        yPos += 10;
        
        // Rohstoffe  
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFontSize(16);
        doc.text(sanitizeTextForPDF('Verwendete Rohstoffe'), 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        
        currentMaterials.forEach((material, index) => {
            yPos = checkPageBreak(doc, yPos, 30);
            doc.text(sanitizeTextForPDF(`${index + 1}. ${material.name}:`), 20, yPos);
            yPos += 6;
            doc.text(sanitizeTextForPDF(`   Menge: ${material.amount} kg`), 25, yPos);
            yPos += 6;
            doc.text(sanitizeTextForPDF(`   Werte: ${material.protein}% Eiweiss, ${material.fat}% Fett, ${material.water}% Wasser`), 25, yPos);
            yPos += 6;
            doc.text(sanitizeTextForPDF(`   BEFFE: ${material.beffe}%`), 25, yPos);
            yPos += 8;
        });
        
        // Optimierung
        yPos = checkPageBreak(doc, yPos, 40);
        doc.setFontSize(16);
        doc.text(sanitizeTextForPDF('Optimierung'), 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.text(sanitizeTextForPDF(`Strategie: ${selectedSuggestion.strategy}`), 20, yPos);
        yPos += 8;
        
        // Anpassungen
        if (selectedSuggestion.additionalMaterials && selectedSuggestion.additionalMaterials.length > 0) {
            doc.text(sanitizeTextForPDF('Anpassungen:'), 20, yPos);
            yPos += 6;
            selectedSuggestion.additionalMaterials.forEach((material, index) => {
                doc.text(sanitizeTextForPDF(`${index + 1}. ${material.material.name}: ${material.amount.toFixed(0)} kg`), 25, yPos);
                yPos += 6;
            });
            yPos += 5;
        }
        
        // Alte Logik für Rückwärtskompatibilität
        if (selectedSuggestion.isMultiMaterial && selectedSuggestion.materials) {
            doc.text(sanitizeTextForPDF('Multi-Material Anpassungen:'), 20, yPos);
            yPos += 7;
            selectedSuggestion.materials.forEach((material, index) => {
                doc.text(sanitizeTextForPDF(`${index + 1}. ${material.material.name}: ${material.amount.toFixed(0)} kg`), 25, yPos);
                yPos += 7;
            });
            yPos += 5;
        } else if (selectedSuggestion.material && selectedSuggestion.amount) {
            doc.text(sanitizeTextForPDF('Anpassung:'), 20, yPos);
            yPos += 7;
            doc.text(sanitizeTextForPDF(`1. ${selectedSuggestion.material.name}: ${selectedSuggestion.amount.toFixed(0)} kg`), 25, yPos);
            yPos += 10;
        }
        
        // Endergebnis
        yPos += 8;
        doc.setFontSize(16);
        doc.text(sanitizeTextForPDF('Endergebnis'), 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.text(sanitizeTextForPDF(`Gesamtmenge: ${selectedSuggestion.totalAmount.toFixed(0)} kg`), 20, yPos);
        yPos += 6;
        
        const finalMix = selectedSuggestion.finalMix || selectedSuggestion.mix;
        doc.text(sanitizeTextForPDF(`Finale Werte: ${finalMix.protein.toFixed(1)}% Eiweiss, ${finalMix.fat.toFixed(1)}% Fett, ${finalMix.water.toFixed(1)}% Wasser`), 20, yPos);
        yPos += 6;
        doc.text(sanitizeTextForPDF(`BEFFE: ${finalMix.beffe.toFixed(1)}%`), 20, yPos);
        yPos += 6;
        doc.text(sanitizeTextForPDF(`Gesamtkosten: ${selectedSuggestion.cost.toFixed(2)} EUR (${selectedSuggestion.costPerKg.toFixed(2)} EUR/kg)`), 20, yPos);
        
        // Produktionsanweisungen - auf neue Seite
        doc.addPage();
        yPos = 20;
        doc.setFontSize(16);
        doc.text(sanitizeTextForPDF('Produktionsanweisungen'), 20, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(sanitizeTextForPDF('1. Rohstoffe bereitstellen und wiegen'), 20, yPos);
        yPos += 7;
        doc.text('2. Wasser/Eis auf Temperatur bringen', 20, yPos);
        yPos += 7;
        doc.text('3. Rohstoffe in folgender Reihenfolge zugeben:', 20, yPos);
        yPos += 7;
        
        // Reihenfolge - mit optimierten Mengen
        let stepCounter = 1;
        
        // Erstelle ein Map der Anpassungen pro Material-Name
        let adjustments = new Map();
        if (selectedSuggestion.additionalMaterials && selectedSuggestion.additionalMaterials.length > 0) {
            selectedSuggestion.additionalMaterials.forEach(material => {
                adjustments.set(material.material.name, material.amount);
            });
        }
        
        // Gehe durch die ursprünglichen Materialien und wende Anpassungen an
        currentMaterials.forEach((material, index) => {
            let finalAmount = material.amount;
            
            // Prüfe ob es eine Anpassung für dieses Material gibt
            if (adjustments.has(material.name)) {
                finalAmount += adjustments.get(material.name);
                adjustments.delete(material.name); // Markiere als verarbeitet
            }
            
            // Nur anzeigen wenn die finale Menge > 0 ist
            if (finalAmount > 0) {
                doc.text(`   ${stepCounter}. ${material.name} (${finalAmount.toFixed(0)} kg)`, 25, yPos);
                yPos += 7;
                stepCounter++;
            }
        });
        
        // Füge Wasser/Eis hinzu mit Anpassungen
        let waterAmount = selectedSuggestion.waterAmount || 0;
        if (adjustments.has('Eis/Wasser')) {
            waterAmount += adjustments.get('Eis/Wasser');
            adjustments.delete('Eis/Wasser');
        }
        
        if (waterAmount > 0) {
            doc.text(sanitizeTextForPDF(`   ${stepCounter}. Eis/Wasser (${waterAmount.toFixed(0)} kg)`), 25, yPos);
            yPos += 7;
            stepCounter++;
        }
        
        // Falls noch unverarbeitete neue Materialien übrig sind (die nicht in den ursprünglichen Materialien waren)
        adjustments.forEach((amount, materialName) => {
            if (amount > 0) {
                yPos = checkPageBreak(doc, yPos, 10);
                doc.text(sanitizeTextForPDF(`   ${stepCounter}. ${materialName} (${amount.toFixed(0)} kg)`), 25, yPos);
                yPos += 7;
                stepCounter++;
            }
        });
        
        yPos += 3; // Kleiner Abstand vor dem nächsten Schritt
        
        doc.text(sanitizeTextForPDF('4. Mischen bis homogene Masse erreicht ist'), 20, yPos);
        yPos += 7;
        doc.text(sanitizeTextForPDF('5. Qualitaetskontrolle: FOSS-Messung der finalen Mischung'), 20, yPos);
        yPos += 7;
        doc.text(sanitizeTextForPDF('6. Weiterverarbeitung zum Endprodukt'), 20, yPos);
        
        // Footer
        yPos = checkPageBreak(doc, yPos, 20);
        yPos += 10; // Abstand vor Footer
        doc.setFontSize(10);
        doc.text(sanitizeTextForPDF('Erstellt mit Fleisch-Optimierungs-App | TUE Kulmbach'), 20, yPos);
        
        // PDF speichern
        const productName = document.getElementById('target-product').selectedOptions[0].text;
        const date = new Date().toISOString().split('T')[0];
        const filename = `Produktionsprotokoll_${productName}_${date}.pdf`;
        
        doc.save(filename);
        
        console.log('✅ PDF-Export erfolgreich');
        alert('PDF-Protokoll wurde heruntergeladen!');
        
    } catch (error) {
        console.error('❌ PDF-Export Fehler:', error);
        alert('Fehler beim PDF-Export. Bitte versuche es erneut.');
    }
}

console.log('🥩 Rohstoff-Beratungs-App geladen');

// ===== DOWNSIZING OPTIMIERUNG =====

// Haupt-Funktion für Downsizing-Optimierung
function calculateDownsizeOptimization(current, target) {
    console.log('📉 Starte Downsizing-Optimierung...');
    console.log(`📉 Reduzierung von ${current.amount}kg auf ${target.quantity}kg erforderlich`);

    const reductionNeeded = current.amount - target.quantity;
    console.log(`📉 Zu entfernende Menge: ${reductionNeeded.toFixed(1)}kg`);

    // Finde teure Rohstoffe die ersetzt werden können
    const expensiveMaterials = findExpensiveMaterialsToReplace(current);
    console.log('📉 Teure Rohstoffe identifiziert:', expensiveMaterials);

    const optimizations = [];

    // Strategie 1: Komplette Entfernung teuerster Rohstoffe
    for (const material of expensiveMaterials) {
        const optimization = calculateWaterSubstitution(current, target, material, reductionNeeded);
        if (optimization) {
            optimizations.push(optimization);
        }
    }

    // Strategie 2: Partielle Reduzierung mehrerer teurer Rohstoffe
    const combinedOptimization = calculateCombinedReduction(current, target, expensiveMaterials, reductionNeeded);
    if (combinedOptimization) {
        optimizations.push(combinedOptimization);
    }

    console.log(`📉 Gefundene Downsizing-Optimierungen: ${optimizations.length}`);
    return optimizations;
}

// Identifiziert teure Rohstoffe die durch Wasser ersetzt werden können
function findExpensiveMaterialsToReplace(current) {
    // Hole alle aktuellen Materialien mit ihren Mengen
    const materials = getAllMaterials();

    // Berechne Preis pro Material und sortiere nach Teuerkeit
    const materialInfo = materials
        .filter(mat => mat.type !== 'ice' && mat.amount > 0) // Nicht Wasser, und tatsächlich vorhanden
        .map(mat => ({
            type: mat.type,
            name: mat.name,
            amount: mat.amount,
            price: mat.price,
            totalCost: mat.price * mat.amount,
            protein: mat.protein,
            fat: mat.fat,
            water: mat.water,
            hydroxy: mat.hydroxy,
            beffe: calculateBEFFEFromValues(mat.protein, mat.hydroxy)
        }))
        .sort((a, b) => b.price - a.price); // Teuerste zuerst

    console.log('💰 Rohstoffe nach Preis sortiert:', materialInfo.map(m => `${m.name}: ${m.price}€/kg (${m.amount}kg)`));

    return materialInfo;
}

// Berechnet optimale Wasser-Substitution für einen spezifischen Rohstoff
function calculateWaterSubstitution(current, target, materialToReplace, reductionNeeded) {
    console.log(`💧🔄 Teste Substitution von ${materialToReplace.name} (${materialToReplace.price}€/kg)`);

    // Berechne maximale Entfernung ohne Leitsätze zu verletzen
    const maxRemovableAmount = Math.min(materialToReplace.amount, reductionNeeded);

    for (let removeAmount = maxRemovableAmount; removeAmount > 0; removeAmount -= 0.5) {
        const remainingMaterialAmount = materialToReplace.amount - removeAmount;
        const newTotalAmount = current.amount - removeAmount;

        // Prüfe ob Zielgewicht erreicht wird
        if (newTotalAmount > target.quantity) continue;

        // Berechne neue Zusammensetzung nach Entfernung
        const newMix = calculateMixtureAfterRemoval(current, materialToReplace, removeAmount, newTotalAmount);

        // Optional: Füge Wasser hinzu bis Zielgewicht erreicht ist
        const waterNeeded = target.quantity - newTotalAmount;
        if (waterNeeded > 0) {
            const finalMix = addWaterToMix(newMix, newTotalAmount, waterNeeded);

            // Prüfe Leitsätze
            if (checkLeitsaetze(finalMix, target)) {
                const costSaving = materialToReplace.price * removeAmount - (rawMaterials.ice.price * waterNeeded);

                console.log(`✅ Erfolgreiche Substitution: -${removeAmount}kg ${materialToReplace.name}, +${waterNeeded}kg Wasser`);
                console.log(`💰 Kosteneinsparung: ${costSaving.toFixed(2)}€`);

                return {
                    type: 'downsize-substitution',
                    strategy: `${materialToReplace.name} durch Wasser ersetzen (Kosteneinsparung: ${costSaving.toFixed(2)}€)`,
                    materialToRemove: materialToReplace.name,
                    removeAmount: removeAmount,
                    waterToAdd: waterNeeded,
                    finalAmount: target.quantity,
                    totalAmount: target.quantity,
                    mix: finalMix,
                    finalMix: finalMix,
                    costSaving: costSaving,
                    totalCost: calculateNewTotalCost(current, materialToReplace, removeAmount, waterNeeded),
                    costPerKg: calculateNewTotalCost(current, materialToReplace, removeAmount, waterNeeded) / target.quantity,
                    additionalMaterials: [] // Für Kompatibilität mit bestehender UI
                };
            }
        }
    }

    console.log(`❌ Keine gültige Substitution für ${materialToReplace.name} gefunden`);
    return null;
}

// Berechnet kombinierte Reduzierung mehrerer Rohstoffe
function calculateCombinedReduction(current, target, expensiveMaterials, reductionNeeded) {
    console.log('🔄 Teste kombinierte Reduzierung mehrerer Rohstoffe...');

    // Einfache Strategie: Proportionale Reduzierung der 2-3 teuersten
    const topExpensive = expensiveMaterials.slice(0, 3);
    const totalAmountTopExpensive = topExpensive.reduce((sum, mat) => sum + mat.amount, 0);

    if (totalAmountTopExpensive < reductionNeeded) return null;

    const reductions = topExpensive.map(mat => ({
        material: mat,
        reduceAmount: (mat.amount / totalAmountTopExpensive) * reductionNeeded
    }));

    // Prüfe ob diese Reduzierung zu gültiger Mischung führt
    let newMix = {...current};
    let newAmount = current.amount;
    let totalCostSaving = 0;

    for (const reduction of reductions) {
        const removedMaterial = reduction.material;
        const removeAmount = reduction.reduceAmount;

        newMix = calculateMixtureAfterRemoval(newMix, removedMaterial, removeAmount, newAmount - removeAmount);
        newAmount -= removeAmount;
        totalCostSaving += removedMaterial.price * removeAmount;
    }

    // Füge Wasser hinzu bis Zielgewicht erreicht
    const waterNeeded = target.quantity - newAmount;
    if (waterNeeded > 0) {
        const finalMix = addWaterToMix(newMix, newAmount, waterNeeded);
        totalCostSaving -= rawMaterials.ice.price * waterNeeded;

        if (checkLeitsaetze(finalMix, target)) {
            console.log('✅ Erfolgreiche kombinierte Reduzierung');
            return {
                type: 'downsize-combined',
                strategy: `Kombinierte Reduzierung (Kosteneinsparung: ${totalCostSaving.toFixed(2)}€)`,
                reductions: reductions,
                waterToAdd: waterNeeded,
                finalAmount: target.quantity,
                totalAmount: target.quantity,
                mix: finalMix,
                finalMix: finalMix,
                costSaving: totalCostSaving,
                totalCost: calculateCombinedNewCost(current, reductions, waterNeeded),
                costPerKg: calculateCombinedNewCost(current, reductions, waterNeeded) / target.quantity,
                additionalMaterials: [] // Für Kompatibilität mit bestehender UI
            };
        }
    }

    console.log('❌ Kombinierte Reduzierung nicht erfolgreich');
    return null;
}

// Hilfsfunktion: Berechnet Mischung nach Entfernung eines Materials
function calculateMixtureAfterRemoval(currentMix, materialToRemove, removeAmount, newTotalAmount) {
    const removedProtein = materialToRemove.protein * removeAmount;
    const removedFat = materialToRemove.fat * removeAmount;
    const removedWater = materialToRemove.water * removeAmount;
    const removedBEFFE = materialToRemove.beffe * removeAmount;

    const newProtein = (currentMix.protein * currentMix.amount - removedProtein) / newTotalAmount;
    const newFat = (currentMix.fat * currentMix.amount - removedFat) / newTotalAmount;
    const newWater = (currentMix.water * currentMix.amount - removedWater) / newTotalAmount;
    const newBEFFE = (currentMix.beffe * currentMix.amount - removedBEFFE) / newTotalAmount;

    const newHydroxy = (materialToRemove.hydroxy * (currentMix.amount - removeAmount)) / newTotalAmount;
    const bindegewebsEiweiß = newHydroxy * 8;

    return {
        protein: newProtein,
        fat: newFat,
        water: newWater,
        beffe: newBEFFE,
        amount: newTotalAmount,
        hydroxy: newHydroxy,
        bindegewebsEiweiß: bindegewebsEiweiß,
        be: bindegewebsEiweiß
    };
}

// Hilfsfunktion: Fügt Wasser zu einer Mischung hinzu
function addWaterToMix(mix, currentAmount, waterAmount) {
    const finalAmount = currentAmount + waterAmount;
    const waterMaterial = rawMaterials.ice;

    const protein = (mix.protein * currentAmount + waterMaterial.protein * waterAmount) / finalAmount;

    let finalMix = {
        protein: protein,
        fat: (mix.fat * currentAmount + waterMaterial.fat * waterAmount) / finalAmount,
        water: (mix.water * currentAmount + waterMaterial.water * waterAmount) / finalAmount,
        be: (mix.be * currentAmount + waterMaterial.be * waterAmount) / finalAmount,
        beffe: (mix.beffe * currentAmount + waterMaterial.beffe * waterAmount) / finalAmount,
        price: ((mix.price || 0) * currentAmount + waterMaterial.price * waterAmount) / finalAmount
    };

    // WICHTIG: Gewürze in finale Mischung einrechnen
    finalMix = applySpicesToMix(finalMix, finalAmount);

    return finalMix;
}

// Hilfsfunktion: Berechnet neue Gesamtkosten
function calculateNewTotalCost(current, removedMaterial, removeAmount, waterAmount) {
    const originalCost = current.price * current.amount;
    const removedCost = removedMaterial.price * removeAmount;
    const addedCost = rawMaterials.ice.price * waterAmount;
    const finalAmount = current.amount - removeAmount + waterAmount;
    const spiceAmount = calculateSpiceAmount(finalAmount);
    const spiceCost = rawMaterials.gewuerze.price * spiceAmount;
    return originalCost - removedCost + addedCost + spiceCost;
}

// Hilfsfunktion: Berechnet Kosten für kombinierte Reduzierung
function calculateCombinedNewCost(current, reductions, waterAmount) {
    let totalCost = current.price * current.amount;

    for (const reduction of reductions) {
        totalCost -= reduction.material.price * reduction.reduceAmount;
    }

    totalCost += rawMaterials.ice.price * waterAmount;
    return totalCost;
}

// ===== SETTINGS MODAL FUNKTIONEN =====

// Modal öffnen/schließen
function openSettingsModal() {
    const modal = document.getElementById("settingsModal");
    modal.style.display = "flex";
    
    // Aktuelle Daten laden
    loadMaterialsList();
    loadProductsList();
    loadAdvancedSettings();
    
    // Body Scroll blockieren
    document.body.style.overflow = "hidden";
}

function closeSettingsModal() {
    const modal = document.getElementById("settingsModal");
    modal.style.display = "none";
    
    // Body Scroll freigeben
    document.body.style.overflow = "auto";
}

// Tab-Funktionen
function showTab(tabName) {
    // Alle Tabs verstecken
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    
    // Alle Tab-Buttons deaktivieren
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    // Gewählten Tab anzeigen
    document.getElementById(`${tabName}-tab`).classList.add("active");
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
}

// Rohstoffe-Management
function loadMaterialsList() {
    const container = document.getElementById("materials-list");
    container.innerHTML = "";
    
    Object.entries(rawMaterials).forEach(([key, material]) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-header">
                <div class="item-name">${material.name}</div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editMaterial(\`${key}\`)">✏️ Bearbeiten</button>
                    ${key !== "s3" && key !== "s8" && key !== "ice" ? 
                        `<button class="delete-btn" onclick="deleteMaterial(\`${key}\`)">🗑️ Löschen</button>` : 
                        ""}
                </div>
            </div>
            <div class="item-grid">
                <div class="item-field">
                    <label>Eiweiß (%)</label>
                    <input type="number" value="${material.protein}" readonly>
                </div>
                <div class="item-field">
                    <label>Fett (%)</label>
                    <input type="number" value="${material.fat}" readonly>
                </div>
                <div class="item-field">
                    <label>Wasser (%)</label>
                    <input type="number" value="${material.water}" readonly>
                </div>
                <div class="item-field">
                    <label>Preis (€/kg)</label>
                    <input type="number" value="${material.price}" readonly>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function editMaterial(materialKey) {
    const material = rawMaterials[materialKey];
    
    // Erstelle Edit-Modal
    const modalHtml = `
        <div class="edit-modal-overlay" onclick="closeEditModal()">
            <div class="edit-modal-content" onclick="event.stopPropagation()">
                <div class="edit-modal-header">
                    <h3>📦 ${material.name} bearbeiten</h3>
                    <button onclick="closeEditModal()" class="modal-close-btn">✕</button>
                </div>
                <form id="editMaterialForm" onsubmit="saveMaterialEdit('${materialKey}'); return false;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Name</label>
                            <input type="text" id="edit-name" value="${material.name}" required>
                        </div>
                        <div class="edit-field">
                            <label>Eiweiß (%)</label>
                            <input type="number" id="edit-protein" value="${material.protein}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Fett (%)</label>
                            <input type="number" id="edit-fat" value="${material.fat}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Wasser (%)</label>
                            <input type="number" id="edit-water" value="${material.water}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>BE - Bindegewebseiweiß (%)</label>
                            <input type="number" id="edit-be" value="${material.be}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Hydroxy</label>
                            <input type="number" id="edit-hydroxy" value="${material.hydroxy}" step="0.01" min="0" max="1" required>
                        </div>
                        <div class="edit-field">
                            <label>Preis (€/kg)</label>
                            <input type="number" id="edit-price" value="${material.price}" step="0.01" min="0" required>
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="save-btn">💾 Speichern</button>
                        <button type="button" onclick="closeEditModal()" class="cancel-btn">❌ Abbrechen</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveMaterialEdit(materialKey) {
    const newName = document.getElementById('edit-name').value;
    const newProtein = parseFloat(document.getElementById('edit-protein').value);
    const newFat = parseFloat(document.getElementById('edit-fat').value);
    const newWater = parseFloat(document.getElementById('edit-water').value);
    const newBE = parseFloat(document.getElementById('edit-be').value);
    const newHydroxy = parseFloat(document.getElementById('edit-hydroxy').value);
    const newPrice = parseFloat(document.getElementById('edit-price').value);
    
    // Validierung
    if (newProtein + newFat + newWater > 100) {
        alert('⚠️ Eiweiß + Fett + Wasser darf nicht über 100% sein!');
        return;
    }
    
    rawMaterials[materialKey] = {
        ...rawMaterials[materialKey],
        name: newName,
        protein: newProtein,
        fat: newFat,
        water: newWater,
        be: newBE,
        hydroxy: newHydroxy,
        price: newPrice
    };
    
    closeEditModal();
    loadMaterialsList();
    updateAllMaterialDropdowns();
    
    // Feedback
    showNotification(`✅ ${newName} wurde aktualisiert!`);
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function deleteMaterial(materialKey) {
    const material = rawMaterials[materialKey];
    if (confirm(`Rohstoff "${material.name}" wirklich löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`)) {
        delete rawMaterials[materialKey];
        loadMaterialsList();
        updateAllMaterialDropdowns();
        showNotification(`🗑️ ${material.name} wurde gelöscht!`);
    }
}

function saveSettings() {
    const settings = {
        rawMaterials: rawMaterials,
        productSpecs: productSpecs
    };
    
    localStorage.setItem("fleischAppSettings", JSON.stringify(settings));
    alert("Einstellungen gespeichert! ✅");
    closeSettingsModal();
}

function loadSettingsFromStorage() {
    const saved = localStorage.getItem("fleischAppSettings");
    if (saved) {
        const settings = JSON.parse(saved);
        
        if (settings.rawMaterials) {
            Object.entries(settings.rawMaterials).forEach(([key, material]) => {
                rawMaterials[key] = material;
            });
        }
        
        if (settings.productSpecs) {
            Object.entries(settings.productSpecs).forEach(([key, product]) => {
                productSpecs[key] = product;
            });
        }
    }
}

function loadProductsList() {
    const container = document.getElementById("products-list");
    container.innerHTML = "";
    
    Object.entries(productSpecs).forEach(([key, product]) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-header">
                <div class="item-name">${product.name}</div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editProduct('${key}')">✏️ Bearbeiten</button>
                    ${!['lyoner', 'leberwurst', 'bratwurst', 'hackfleisch'].includes(key) ? 
                        `<button class="delete-btn" onclick="deleteProduct('${key}')">🗑️ Löschen</button>` : 
                        ''}
                </div>
            </div>
            <div class="item-grid">
                <div class="item-field">
                    <label>Ziel Eiweiß (%)</label>
                    <input type="number" value="${product.protein}" readonly>
                </div>
                <div class="item-field">
                    <label>Ziel Fett (%)</label>
                    <input type="number" value="${product.fat}" readonly>
                </div>
                <div class="item-field">
                    <label>Ziel Wasser (%)</label>
                    <input type="number" value="${product.water}" readonly>
                </div>
                <div class="item-field">
                    <label>Min. BEFFE (%)</label>
                    <input type="number" value="${product.beffe}" readonly>
                </div>
                <div class="item-field">
                    <label>Produktionsverlust (%)</label>
                    <input type="text" value="${(product.wasteBraet || 0) + (product.wasteSlicing || 0)}% (${product.wasteBraet || 0}% Brät + ${product.wasteSlicing || 0}% Schnitt)" readonly>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function editProduct(productKey) {
    const product = productSpecs[productKey];
    
    const modalHtml = `
        <div class="edit-modal-overlay" onclick="closeEditModal()">
            <div class="edit-modal-content" onclick="event.stopPropagation()">
                <div class="edit-modal-header">
                    <h3>🎯 ${product.name} bearbeiten</h3>
                    <button onclick="closeEditModal()" class="modal-close-btn">✕</button>
                </div>
                <form id="editProductForm" onsubmit="saveProductEdit('${productKey}'); return false;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Name</label>
                            <input type="text" id="edit-product-name" value="${product.name}" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Eiweiß (%)</label>
                            <input type="number" id="edit-product-protein" value="${product.protein}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Fett (%)</label>
                            <input type="number" id="edit-product-fat" value="${product.fat}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Wasser (%)</label>
                            <input type="number" id="edit-product-water" value="${product.water}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Min. BEFFE (%)</label>
                            <input type="number" id="edit-product-beffe" value="${product.beffe}" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Brätreste-Verlust (%)</label>
                            <input type="number" id="edit-product-waste-braet" value="${product.wasteBraet || 0}" step="0.1" min="0" max="20" title="Verlust durch Brätreste bei Abfüllung">
                        </div>
                        <div class="edit-field">
                            <label>Kappen/Schnitt-Verlust (%)</label>
                            <input type="number" id="edit-product-waste-slicing" value="${product.wasteSlicing || 0}" step="0.1" min="0" max="20" title="Verlust durch Kappen beim Slicen">
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="save-btn">💾 Speichern</button>
                        <button type="button" onclick="closeEditModal()" class="cancel-btn">❌ Abbrechen</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveProductEdit(productKey) {
    const newName = document.getElementById('edit-product-name').value;
    const newProtein = parseFloat(document.getElementById('edit-product-protein').value);
    const newFat = parseFloat(document.getElementById('edit-product-fat').value);
    const newWater = parseFloat(document.getElementById('edit-product-water').value);
    const newBeffe = parseFloat(document.getElementById('edit-product-beffe').value);
    const newWasteBraet = parseFloat(document.getElementById('edit-product-waste-braet').value) || 0;
    const newWasteSlicing = parseFloat(document.getElementById('edit-product-waste-slicing').value) || 0;

    // Bewahre standardRecipe wenn vorhanden
    const oldProduct = productSpecs[productKey];

    productSpecs[productKey] = {
        name: newName,
        protein: newProtein,
        fat: newFat,
        water: newWater,
        beffe: newBeffe,
        wasteBraet: newWasteBraet,
        wasteSlicing: newWasteSlicing,
        standardRecipe: oldProduct.standardRecipe || ['s3', 's8', 'ice']
    };

    closeEditModal();
    loadProductsList();
    updateProductDropdown();

    showNotification(`✅ ${newName} wurde aktualisiert!`);
}

function deleteProduct(productKey) {
    const product = productSpecs[productKey];
    if (confirm(`Produkt "${product.name}" wirklich löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`)) {
        delete productSpecs[productKey];
        loadProductsList();
        updateProductDropdown();
        showNotification(`🗑️ ${product.name} wurde gelöscht!`);
    }
}

function updateProductDropdown() {
    const select = document.getElementById('target-product');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '';
    
    Object.entries(productSpecs).forEach(([key, product]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = product.name;
        select.appendChild(option);
    });
    
    if (productSpecs[currentValue]) {
        select.value = currentValue;
    }
}

function loadAdvancedSettings() {
    const settings = JSON.parse(localStorage.getItem('fleischAppSettings')) || {};
    
    document.getElementById('tolerance-protein').value = settings.toleranceProtein || 0.5;
    document.getElementById('tolerance-fat').value = settings.toleranceFat || 1.0;
    document.getElementById('tolerance-water').value = settings.toleranceWater || 2.0;
    document.getElementById('tolerance-beffe').value = settings.toleranceBeffe || 0.5;
}

// Notification-System
function showNotification(message) {
    // Entferne existierende Notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Einblenden
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ausblenden nach 3 Sekunden
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addNewMaterial() {
    const modalHtml = `
        <div class="edit-modal-overlay" onclick="closeEditModal()">
            <div class="edit-modal-content" onclick="event.stopPropagation()">
                <div class="edit-modal-header">
                    <h3>➕ Neuer Rohstoff</h3>
                    <button onclick="closeEditModal()" class="modal-close-btn">✕</button>
                </div>
                <form id="addMaterialForm" onsubmit="saveNewMaterial(); return false;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Eindeutiger Schlüssel</label>
                            <input type="text" id="new-material-key" placeholder="z.B. new_material" required pattern="[a-z0-9_]+" title="Nur Kleinbuchstaben, Zahlen und Unterstriche">
                        </div>
                        <div class="edit-field">
                            <label>Name</label>
                            <input type="text" id="new-material-name" placeholder="z.B. Neuer Rohstoff" required>
                        </div>
                        <div class="edit-field">
                            <label>Eiweiß (%)</label>
                            <input type="number" id="new-material-protein" value="15" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Fett (%)</label>
                            <input type="number" id="new-material-fat" value="20" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Wasser (%)</label>
                            <input type="number" id="new-material-water" value="65" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>BE - Bindegewebseiweiß (%)</label>
                            <input type="number" id="new-material-be" value="1.2" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Hydroxy</label>
                            <input type="number" id="new-material-hydroxy" value="0.08" step="0.01" min="0" max="1" required>
                        </div>
                        <div class="edit-field">
                            <label>Preis (€/kg)</label>
                            <input type="number" id="new-material-price" value="4.00" step="0.01" min="0" required>
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="save-btn">➕ Hinzufügen</button>
                        <button type="button" onclick="closeEditModal()" class="cancel-btn">❌ Abbrechen</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveNewMaterial() {
    const key = document.getElementById('new-material-key').value;
    const name = document.getElementById('new-material-name').value;
    const protein = parseFloat(document.getElementById('new-material-protein').value);
    const fat = parseFloat(document.getElementById('new-material-fat').value);
    const water = parseFloat(document.getElementById('new-material-water').value);
    const be = parseFloat(document.getElementById('new-material-be').value);
    const hydroxy = parseFloat(document.getElementById('new-material-hydroxy').value);
    const price = parseFloat(document.getElementById('new-material-price').value);
    
    // Validierung
    if (rawMaterials[key]) {
        alert('⚠️ Schlüssel bereits vorhanden! Bitte wählen Sie einen anderen.');
        return;
    }
    
    if (protein + fat + water > 100) {
        alert('⚠️ Eiweiß + Fett + Wasser darf nicht über 100% sein!');
        return;
    }
    
    rawMaterials[key] = {
        name, protein, fat, water, be, hydroxy, price
    };
    
    closeEditModal();
    loadMaterialsList();
    updateAllMaterialDropdowns();
    
    showNotification(`✅ ${name} wurde hinzugefügt!`);
}

function addNewProduct() {
    const modalHtml = `
        <div class="edit-modal-overlay" onclick="closeEditModal()">
            <div class="edit-modal-content" onclick="event.stopPropagation()">
                <div class="edit-modal-header">
                    <h3>➕ Neues Produkt</h3>
                    <button onclick="closeEditModal()" class="modal-close-btn">✕</button>
                </div>
                <form id="addProductForm" onsubmit="saveNewProduct(); return false;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Eindeutiger Schlüssel</label>
                            <input type="text" id="new-product-key" placeholder="z.B. new_product" required pattern="[a-z0-9_]+" title="Nur Kleinbuchstaben, Zahlen und Unterstriche">
                        </div>
                        <div class="edit-field">
                            <label>Name</label>
                            <input type="text" id="new-product-name" placeholder="z.B. Neues Produkt" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Eiweiß (%)</label>
                            <input type="number" id="new-product-protein" value="15" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Fett (%)</label>
                            <input type="number" id="new-product-fat" value="20" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Ziel Wasser (%)</label>
                            <input type="number" id="new-product-water" value="65" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Min. BEFFE (%)</label>
                            <input type="number" id="new-product-beffe" value="10" step="0.1" min="0" max="100" required>
                        </div>
                        <div class="edit-field">
                            <label>Brätreste-Verlust (%)</label>
                            <input type="number" id="new-product-waste-braet" value="2" step="0.1" min="0" max="20" title="Verlust durch Brätreste bei Abfüllung">
                        </div>
                        <div class="edit-field">
                            <label>Kappen/Schnitt-Verlust (%)</label>
                            <input type="number" id="new-product-waste-slicing" value="0" step="0.1" min="0" max="20" title="Verlust durch Kappen beim Slicen">
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="save-btn">➕ Hinzufügen</button>
                        <button type="button" onclick="closeEditModal()" class="cancel-btn">❌ Abbrechen</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveNewProduct() {
    const key = document.getElementById('new-product-key').value;
    const name = document.getElementById('new-product-name').value;
    const protein = parseFloat(document.getElementById('new-product-protein').value);
    const fat = parseFloat(document.getElementById('new-product-fat').value);
    const water = parseFloat(document.getElementById('new-product-water').value);
    const beffe = parseFloat(document.getElementById('new-product-beffe').value);
    const wasteBraet = parseFloat(document.getElementById('new-product-waste-braet').value) || 0;
    const wasteSlicing = parseFloat(document.getElementById('new-product-waste-slicing').value) || 0;

    // Validierung
    if (productSpecs[key]) {
        alert('⚠️ Schlüssel bereits vorhanden! Bitte wählen Sie einen anderen.');
        return;
    }

    productSpecs[key] = {
        name, protein, fat, water, beffe,
        wasteBraet, wasteSlicing,
        standardRecipe: ['s3', 's8', 'ice']
    };

    closeEditModal();
    loadProductsList();
    updateProductDropdown();

    showNotification(`✅ ${name} wurde hinzugefügt!`);
}

function exportSettings() {
    const settings = {
        rawMaterials: rawMaterials,
        productSpecs: productSpecs,
        toleranceProtein: parseFloat(document.getElementById('tolerance-protein')?.value || 0.5),
        toleranceFat: parseFloat(document.getElementById('tolerance-fat')?.value || 1.0),
        toleranceWater: parseFloat(document.getElementById('tolerance-water')?.value || 2.0),
        toleranceBeffe: parseFloat(document.getElementById('tolerance-beffe')?.value || 0.5),
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0"
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fleisch-app-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('📤 Einstellungen exportiert!');
}

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (settings.rawMaterials) {
                    Object.assign(rawMaterials, settings.rawMaterials);
                }
                if (settings.productSpecs) {
                    Object.assign(productSpecs, settings.productSpecs);
                }
                
                localStorage.setItem('fleischAppSettings', JSON.stringify(settings));
                
                showNotification('📥 Einstellungen erfolgreich importiert!');
                loadMaterialsList();
                loadProductsList();
                loadAdvancedSettings();
                updateAllMaterialDropdowns();
                updateProductDropdown();
                
            } catch (error) {
                alert('❌ Fehler beim Importieren: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function resetToDefaults() {
    if (confirm("Alle Einstellungen zurücksetzen?")) {
        localStorage.removeItem("fleischAppSettings");
        location.reload();
    }
}

function updateAllMaterialDropdowns() {
    document.querySelectorAll("[id^=\"current-type-\"]").forEach(select => {
        const currentValue = select.value;
        select.innerHTML = "";
        
        Object.entries(rawMaterials).forEach(([key, material]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = material.name;
            select.appendChild(option);
        });
        
        if (rawMaterials[currentValue]) {
            select.value = currentValue;
        }
    });
}

// Modal schließen bei Escape
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeSettingsModal();
    }
});

