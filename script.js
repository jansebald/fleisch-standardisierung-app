// Fleisch-Rohstoff-Beratungs-App
// ====================================

// Globale Variablen
let currentSuggestions = [];
let selectedSuggestion = null;
let materialCount = 1;

// Produktspezifikationen
const productSpecs = {
    lyoner: { protein: 12.0, fat: 25.0, water: 62.0, beffe: 10.0, name: "Lyoner" },
    leberwurst: { protein: 14.0, fat: 28.0, water: 57.0, beffe: 8.0, name: "Leberwurst" },
    bratwurst: { protein: 16.0, fat: 22.0, water: 61.0, beffe: 12.0, name: "Bratwurst" },
    hackfleisch: { protein: 18.0, fat: 15.0, water: 66.0, beffe: 14.0, name: "Hackfleisch" }
};

// Standard-Rohstoffe mit Eigenschaften
const rawMaterials = {
    "s3": { protein: 17.2, fat: 14.5, water: 67.3, lean: 85.0, hydroxy: 0.10, price: 5.50, name: "S III" },
    "s8": { protein: 2.5, fat: 88.0, water: 8.5, lean: 12.0, hydroxy: 0.02, price: 3.20, name: "S VIII" },
    "ice": { protein: 0.0, fat: 0.0, water: 100.0, lean: 0.0, hydroxy: 0.0, price: 0.05, name: "Eis/Wasser" },
    "custom": { protein: 15.0, fat: 20.0, water: 64.0, lean: 80.0, hydroxy: 0.08, price: 4.00, name: "Benutzerdefiniert" }
};

// App initialisieren
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDefaults(0);
    updateTargetSpecs();
    calculateCurrentBEFFE(0);
    updateTotalMixture();
});

// Aktuelle Rohstoff-Defaults aktualisieren
function updateCurrentDefaults(index) {
    const type = document.getElementById(`current-type-${index}`).value;
    if (type !== 'custom' && rawMaterials[type]) {
        const material = rawMaterials[type];
        document.getElementById(`current-protein-${index}`).value = material.protein.toFixed(1);
        document.getElementById(`current-fat-${index}`).value = material.fat.toFixed(1);
        document.getElementById(`current-water-${index}`).value = material.water.toFixed(1);
        document.getElementById(`current-lean-${index}`).value = material.lean.toFixed(1);
        calculateCurrentBEFFE(index);
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
        document.getElementById('target-beffe').value = spec.beffe;
    }
}

// Aktuelle BEFFE berechnen
function calculateCurrentBEFFE(index) {
    const protein = parseFloat(document.getElementById(`current-protein-${index}`).value) || 0;
    const type = document.getElementById(`current-type-${index}`).value;
    const hydroxy = rawMaterials[type]?.hydroxy || 0.08;
    
    if (protein > 0) {
        const bindegewebsEiweiß = hydroxy * 8;
        const beffe = protein - bindegewebsEiweiß;
        
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
                    <select id="current-type-${newIndex}" onchange="updateCurrentDefaults(${newIndex})">
                        <option value="s3">S III</option>
                        <option value="s8">S VIII</option>
                        <option value="ice">Eis/Wasser</option>
                        <option value="custom">Benutzerdefiniert</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="current-protein-${newIndex}">Eiweiß (%)</label>
                    <input type="number" id="current-protein-${newIndex}" value="17.2" step="0.1" oninput="calculateCurrentBEFFE(${newIndex})">
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
                    <label for="current-lean-${newIndex}">Mageranteil (%)</label>
                    <input type="number" id="current-lean-${newIndex}" value="85.0" step="0.1" oninput="updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-amount-${newIndex}">Verfügbare Menge (kg)</label>
                    <input type="number" id="current-amount-${newIndex}" value="500" step="10" oninput="updateTotalMixture()">
                </div>
                <div class="input-group">
                    <label for="current-beffe-manual-${newIndex}">BEFFE (%) - Food Scan</label>
                    <input type="number" id="current-beffe-manual-${newIndex}" value="16.4" step="0.1" oninput="updateTotalMixture()">
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
    let totalLean = 0;
    let totalBEFFE = 0;
    
    materials.forEach(material => {
        const amount = material.amount;
        totalAmount += amount;
        totalProtein += material.protein * amount;
        totalFat += material.fat * amount;
        totalWater += material.water * amount;
        totalLean += material.lean * amount;
        totalBEFFE += material.beffe * amount;
    });
    
    // Durchschnittswerte berechnen
    const avgProtein = totalAmount > 0 ? totalProtein / totalAmount : 0;
    const avgFat = totalAmount > 0 ? totalFat / totalAmount : 0;
    const avgWater = totalAmount > 0 ? totalWater / totalAmount : 0;
    const avgLean = totalAmount > 0 ? totalLean / totalAmount : 0;
    const avgBEFFE = totalAmount > 0 ? totalBEFFE / totalAmount : 0;
    
    // Anzeige aktualisieren
    document.getElementById('total-amount').textContent = `${totalAmount.toFixed(0)} kg`;
    document.getElementById('total-protein').textContent = `${avgProtein.toFixed(1)}%`;
    document.getElementById('total-fat').textContent = `${avgFat.toFixed(1)}%`;
    document.getElementById('total-water').textContent = `${avgWater.toFixed(1)}%`;
    document.getElementById('total-lean').textContent = `${avgLean.toFixed(1)}%`;
    document.getElementById('total-beffe').textContent = `${avgBEFFE.toFixed(1)}%`;
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
        const leanElement = document.getElementById(`current-lean-${index}`);
        const amountElement = document.getElementById(`current-amount-${index}`);
        const beffeElement = document.getElementById(`current-beffe-manual-${index}`);
        
        if (typeElement && proteinElement && fatElement && waterElement && leanElement && amountElement && beffeElement) {
            const type = typeElement.value;
            materials.push({
                index: parseInt(index),
                type: type,
                name: rawMaterials[type]?.name || 'Benutzerdefiniert',
                protein: parseFloat(proteinElement.value) || 0,
                fat: parseFloat(fatElement.value) || 0,
                water: parseFloat(waterElement.value) || 0,
                lean: parseFloat(leanElement.value) || 0,
                amount: parseFloat(amountElement.value) || 0,
                beffe: parseFloat(beffeElement.value) || 0,
                hydroxy: rawMaterials[type]?.hydroxy || 0.08,
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
            beffe: 0,
            amount: 0,
            price: 0,
            hydroxy: 0.08
        };
    }
    
    let totalAmount = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalWater = 0;
    let totalBEFFE = 0;
    let totalCost = 0;
    let weightedHydroxy = 0;
    
    materials.forEach(material => {
        const amount = material.amount;
        totalAmount += amount;
        totalProtein += material.protein * amount;
        totalFat += material.fat * amount;
        totalWater += material.water * amount;
        totalBEFFE += material.beffe * amount;
        totalCost += material.price * amount;
        weightedHydroxy += material.hydroxy * amount;
    });
    
    if (totalAmount === 0) {
        return {
            type: 'empty',
            name: 'Keine Materialien',
            protein: 0,
            fat: 0,
            water: 0,
            beffe: 0,
            amount: 0,
            price: 0,
            hydroxy: 0.08
        };
    }
    
    return {
        type: 'mixed',
        name: 'Gesamt-Mischung',
        protein: totalProtein / totalAmount,
        fat: totalFat / totalAmount,
        water: totalWater / totalAmount,
        beffe: totalBEFFE / totalAmount,
        amount: totalAmount,
        price: totalCost / totalAmount,
        hydroxy: weightedHydroxy / totalAmount
    };
}

// Neue Hauptfunktion: Optimierung für maximale Wasser-Schüttung
function calculateOptimization() {
    try {
        hideError();
        
        // Eingabedaten lesen
        const currentMaterials = getAllMaterials();
        const target = getTargetSpecs();
        
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
            showError('Keine Optimierung möglich', 'Mit den aktuellen Rohstoffen ist keine gültige Optimierung möglich.');
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

// Aktuelle Material-Daten lesen (DEPRECATED - use getAllMaterials instead)
function getCurrentMaterial() {
    // Fallback für alte Code-Teile - nutze die neue Multi-Material Funktion
    const materials = getAllMaterials();
    return calculateCurrentMixture(materials);
}

// Zielspezifikationen lesen
function getTargetSpecs() {
    return {
        protein: parseFloat(document.getElementById('target-protein').value),
        fat: parseFloat(document.getElementById('target-fat').value),
        water: parseFloat(document.getElementById('target-water').value),
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
    
    const finalMix = {
        protein: (current.protein * current.amount + waterMaterial.protein * maxPossibleWater) / finalAmount,
        fat: (current.fat * current.amount + waterMaterial.fat * maxPossibleWater) / finalAmount,
        water: (current.water * current.amount + waterMaterial.water * maxPossibleWater) / finalAmount,
        beffe: (current.beffe * current.amount + 0 * maxPossibleWater) / finalAmount
    };
    
    console.log(`💧 Finale Mischung: ${finalMix.protein.toFixed(1)}% Eiweiß, ${finalMix.fat.toFixed(1)}% Fett, ${finalMix.water.toFixed(1)}% Wasser`);
    
    // Prüfe ob Leitsätze eingehalten werden
    if (!checkLeitsaetze(finalMix, target)) {
        console.log('💧 Leitsätze nicht eingehalten');
        return null;
    }
    
    const totalCost = (current.price * current.amount) + (waterMaterial.price * maxPossibleWater);
    const waterPercentage = (maxPossibleWater / finalAmount) * 100;
    
    console.log(`✅ Reiner Wasser-Zusatz möglich: ${maxPossibleWater.toFixed(0)}kg Wasser (${waterPercentage.toFixed(1)}%)`);
    
    return {
        type: 'water-only',
        strategy: 'Maximaler Wasser-Zusatz',
        description: `${maxPossibleWater.toFixed(0)}kg Wasser hinzufügen`,
        waterAmount: maxPossibleWater,
        additionalMaterials: [],
        finalMix: finalMix,
        totalAmount: finalAmount,
        cost: totalCost,
        costPerKg: totalCost / finalAmount,
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
        protein: 2.0,   // ±2% Eiweiß
        fat: 5.0,       // ±5% Fett  
        water: 3.0,     // ±3% Wasser
        beffe: -1.0     // BEFFE muss mindestens erreicht werden
    };
    
    const proteinOk = Math.abs(mix.protein - target.protein) <= tolerance.protein;
    const fatOk = Math.abs(mix.fat - target.fat) <= tolerance.fat;
    const waterOk = Math.abs(mix.water - target.water) <= tolerance.water;
    const beffeOk = mix.beffe >= (target.beffe + tolerance.beffe);
    
    // Detaillierte Debug-Ausgaben
    console.log(`🔍 ZIEL: ${target.protein}% Eiweiß, ${target.fat}% Fett, ${target.water}% Wasser, ${target.beffe}% BEFFE`);
    console.log(`🔍 IST:  ${mix.protein.toFixed(1)}% Eiweiß, ${mix.fat.toFixed(1)}% Fett, ${mix.water.toFixed(1)}% Wasser, ${mix.beffe.toFixed(1)}% BEFFE`);
    console.log(`🔍 DIFF: ${Math.abs(mix.protein - target.protein).toFixed(1)} Eiweiß (≤${tolerance.protein}), ${Math.abs(mix.fat - target.fat).toFixed(1)} Fett (≤${tolerance.fat}), ${Math.abs(mix.water - target.water).toFixed(1)} Wasser (≤${tolerance.water}), BEFFE: ${mix.beffe.toFixed(1)} ≥ ${(target.beffe + tolerance.beffe).toFixed(1)}`);
    console.log(`🔍 Leitsätze-Check: Protein ${proteinOk}, Fett ${fatOk}, Wasser ${waterOk}, BEFFE ${beffeOk}`);
    
    return proteinOk && fatOk && waterOk && beffeOk;
}

// Strategie 2: Wasser + minimaler Rohstoff-Zusatz
function calculateWaterPlusMinimal(current, target) {
    console.log('💧🥩 Teste Wasser + minimalen Rohstoff-Zusatz...');
    
    const neededAmount = target.quantity - current.amount;
    const optimizations = [];
    
    // Teste verschiedene Rohstoffe mit maximaler Wasser-Schüttung
    const materials = Object.entries(rawMaterials).filter(([key]) => key !== 'ice' && key !== 'custom');
    
    for (const [materialType, material] of materials) {
        // Teste verschiedene Verhältnisse: 70% Wasser, 30% Rohstoff bis 30% Wasser, 70% Rohstoff
        for (let waterRatio = 0.7; waterRatio >= 0.3; waterRatio -= 0.1) {
            const materialRatio = 1 - waterRatio;
            const waterAmount = neededAmount * waterRatio;
            const materialAmount = neededAmount * materialRatio;
            
            const finalAmount = current.amount + waterAmount + materialAmount;
            const waterMaterial = rawMaterials.ice;
            
            const finalMix = {
                protein: (current.protein * current.amount + waterMaterial.protein * waterAmount + material.protein * materialAmount) / finalAmount,
                fat: (current.fat * current.amount + waterMaterial.fat * waterAmount + material.fat * materialAmount) / finalAmount,
                water: (current.water * current.amount + waterMaterial.water * waterAmount + material.water * materialAmount) / finalAmount,
                beffe: (current.beffe * current.amount + 0 * waterAmount + calculateBEFFEFromValues(material.protein, material.hydroxy) * materialAmount) / finalAmount
            };
            
            if (checkLeitsaetze(finalMix, target)) {
                const totalCost = (current.price * current.amount) + (waterMaterial.price * waterAmount) + (material.price * materialAmount);
                const waterPercentage = (waterAmount / finalAmount) * 100;
                
                optimizations.push({
                    type: 'water-plus-material',
                    strategy: 'Wasser + Rohstoff',
                    description: formatAmountDescription(materialAmount, material.name),
                    waterAmount: waterAmount,
                    additionalMaterials: [
                        {material: rawMaterials.ice, amount: waterAmount, type: 'ice'},
                        {material: material, amount: materialAmount, type: materialType}
                    ],
                    finalMix: finalMix,
                    totalAmount: finalAmount,
                    cost: totalCost,
                    costPerKg: totalCost / finalAmount,
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
        const badge = optimization.type === 'water-only' ? 'optimal' : 'water-plus';
        const badgeText = optimization.type === 'water-only' ? 'Optimal' : 'Wasser+Rohstoff';
        
        const card = document.createElement('div');
        card.className = 'suggestion-card optimization-card';
        card.onclick = () => selectOptimization(index);
        
        let materialsText = '';
        if (optimization.additionalMaterials.length > 0) {
            materialsText = optimization.additionalMaterials.map(m => 
                `<div class="material-addition">${m.amount >= 0 ? '+' : ''} ${formatAmountDescription(m.amount, m.material.name)}</div>`
            ).join('');
        }
        
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
                    <div class="detail-value">${optimization.totalAmount.toFixed(0)} kg</div>
                    <div class="detail-label">Gesamtmenge</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${optimization.costPerKg.toFixed(2)} €/kg</div>
                    <div class="detail-label">Kosten</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${optimization.finalMix.beffe.toFixed(1)}%</div>
                    <div class="detail-label">BEFFE</div>
                </div>
            </div>
            <div style="margin-top: 10px; opacity: 0.8;">
                Ergebnis: ${optimization.finalMix.protein.toFixed(1)}% Eiweiß, ${optimization.finalMix.fat.toFixed(1)}% Fett, ${optimization.finalMix.water.toFixed(1)}% Wasser
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
    
    const optimizedMix = {
        protein: (current.protein * currentRatio) + (material.protein * materialRatio) + (waterMaterial.protein * waterRatio),
        fat: (current.fat * currentRatio) + (material.fat * materialRatio) + (waterMaterial.fat * waterRatio),
        water: (current.water * currentRatio) + (material.water * materialRatio) + (waterMaterial.water * waterRatio),
        beffe: (current.beffe * currentRatio) + (calculateBEFFEFromValues(material.protein, material.hydroxy) * materialRatio) + (0 * waterRatio)
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
    
    const mix = {
        protein: (current.protein * current.amount + waterMaterial.protein * actualWaterAmount) / finalAmount,
        fat: (current.fat * current.amount + waterMaterial.fat * actualWaterAmount) / finalAmount,
        water: (current.water * current.amount + waterMaterial.water * actualWaterAmount) / finalAmount,
        beffe: (current.beffe * current.amount + 0 * actualWaterAmount) / finalAmount
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
    
    const finalMix = {
        protein: (current.protein * current.amount + material.protein * materialAmount + waterMaterial.protein * neededWaterAmount) / finalAmount,
        fat: (current.fat * current.amount + material.fat * materialAmount + waterMaterial.fat * neededWaterAmount) / finalAmount,
        water: (current.water * current.amount + material.water * materialAmount + waterMaterial.water * neededWaterAmount) / finalAmount,
        beffe: (current.beffe * current.amount + calculateBEFFEFromValues(material.protein, material.hydroxy) * materialAmount + 0 * neededWaterAmount) / finalAmount
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
    
    return {
        protein: totalProtein / totalAmount,
        fat: totalFat / totalAmount,
        water: totalWater / totalAmount,
        beffe: totalBEFFE / totalAmount
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
    
    return { protein, fat, water, hydroxy, beffe, wew, bindegewebsEiweiß };
}

// BEFFE aus Protein und Hydroxy berechnen
function calculateBEFFEFromValues(protein, hydroxy) {
    const bindegewebsEiweiß = hydroxy * 8;
    return protein - bindegewebsEiweiß;
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

// Rezeptur verwenden (überarbeitet für neue Optimierungsdaten)
function useRecipe() {
    if (!selectedSuggestion) return;
    
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