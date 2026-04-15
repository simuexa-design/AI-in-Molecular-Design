/* ================================================
   MOLECULAR AI — LABORATORY BENCH app.js
   ================================================ */

console.log("✓ app.js script loaded successfully");

// ─── State ─────────────────────────────────────
let viewer;
let selectedAtoms = [];
let isSpaceFilling = false;
let isWireRibbon = false;
let isDarkBg = true;
let currentMolData = null;
let currentCID = null;

// ─── Molecule Descriptions ──────────────────────
const MOL_DESCRIPTIONS = {
    caffeine: "A central nervous system stimulant of the methylxanthine class. Found naturally in coffee, tea, and cocoa. Blocks adenosine receptors, preventing drowsiness. Used medically for neonatal apnea and as an adjuvant in pain medications.",
    aspirin: "Acetylsalicylic acid — one of the world's oldest and most widely used medications. An NSAID that irreversibly inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis. Used as an analgesic, antipyretic, anti-inflammatory, and antiplatelet agent.",
    dopamine: "A monoamine neurotransmitter and catecholamine that plays a key role in reward, motivation, memory, and motor control. Imbalances are linked to Parkinson's disease, schizophrenia, and ADHD. Also functions as a hormone produced by the adrenal gland.",
    morphine: "A potent opioid analgesic isolated from the opium poppy Papaver somniferum. Acts on μ-opioid receptors in the CNS to provide pain relief. The prototypical opioid and reference compound for analgesic potency comparisons.",
    ibuprofen: "A non-steroidal anti-inflammatory drug (NSAID) that inhibits cyclooxygenase enzymes COX-1 and COX-2. Widely used for fever, pain, and inflammation. One of the most common OTC analgesics globally.",
    "penicillin": "Penicillin G is a β-lactam antibiotic that inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs). The first true antibiotic, discovered by Alexander Fleming in 1928. Effective against many Gram-positive bacteria.",
    cholesterol: "A lipid molecule essential for cell membrane integrity, hormone synthesis (steroids), bile acid production, and vitamin D metabolism. Transported in the blood by lipoproteins. High LDL levels are associated with cardiovascular disease.",
    glucose: "A monosaccharide sugar and the primary energy source for cellular metabolism. Processed via glycolysis, the citric acid cycle, and oxidative phosphorylation to produce ATP. Blood glucose regulation is central to diabetes management.",
    taxol: "Paclitaxel — a chemotherapy drug used to treat ovarian, breast, lung, and pancreatic cancers. Promotes microtubule polymerization and prevents depolymerization, blocking cell division. Originally isolated from the Pacific yew tree bark.",
    serotonin: "5-hydroxytryptamine (5-HT) — a monoamine neurotransmitter that regulates mood, appetite, sleep, and cognition. Most serotonin is produced in the gut. Low levels are associated with depression. Target of SSRI antidepressants.",
    adrenaline: "Epinephrine — a hormone and neurotransmitter released from the adrenal medulla in response to stress. Central to the fight-or-flight response. Used medically to treat anaphylaxis, cardiac arrest, and severe asthma attacks.",
    lidocaine: "A local anesthetic and antiarrhythmic agent that blocks voltage-gated sodium channels, preventing nerve signal transmission. Used in dental procedures, minor surgeries, and as an antiarrhythmic for ventricular tachycardia.",
};

// ─── DOM Ready ─────────────────────────────────
console.log("Setting up DOMContentLoaded listener...");
document.addEventListener("DOMContentLoaded", () => {
    console.log("✓ DOMContentLoaded fired");
    console.log("Initializing viewer...");
    initViewer();
    console.log("✓ Viewer initialized");
    console.log("Setting up event listeners...");
    setupListeners();
    console.log("✓ Event listeners set up");
    console.log("Loading caffeine...");
    loadMolecule("caffeine");
    console.log("✓ Caffeine load triggered");
});

/* ================================================
   VIEWER INIT
   ================================================ */
function initViewer() {
    console.log("initViewer() called");
    const el = document.getElementById("container-01");
    console.log("Container element found:", !!el);
    console.log("$3Dmol available:", !!window.$3Dmol);
    
    if (!el) {
        console.error("Container element 'container-01' not found!");
        return;
    }
    
    if (!window.$3Dmol) {
        console.error("$3Dmol library not loaded!");
        return;
    }
    
    viewer = $3Dmol.createViewer(el, {
        backgroundColor: "black",
        antialias: true,
    });
    console.log("Viewer created:", !!viewer);
}

/* ================================================
   EVENT LISTENERS
   ================================================ */
function setupListeners() {
    // Search functionality
    document.getElementById("search-btn")?.addEventListener("click", () => {
        const q = document.getElementById("mol-search").value.trim();
        if (q) loadMolecule(q);
    });

    document.getElementById("mol-search")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const q = e.target.value.trim();
            if (q) loadMolecule(q);
        }
    });

    // Reset angle
    document.getElementById("reset-angle-btn")?.addEventListener("click", resetAngle);

    // Style toggle (ball-stick vs space-filling)
    document.getElementById("toggle-style")?.addEventListener("click", (e) => {
        isSpaceFilling = !isSpaceFilling;
        isWireRibbon = false;
        document.getElementById("toggle-ribbon")?.classList.remove("active");
        e.currentTarget.textContent = isSpaceFilling ? "Space-Filling" : "Ball-and-Stick";
        e.currentTarget.classList.toggle("active", !isSpaceFilling);
        if (viewer) applyStyle();
    });

    // Wire ribbon toggle
    document.getElementById("toggle-ribbon")?.addEventListener("click", (e) => {
        isWireRibbon = !isWireRibbon;
        isSpaceFilling = false;
        document.getElementById("toggle-style").textContent = "Ball-and-Stick";
        document.getElementById("toggle-style").classList.add("active");
        e.currentTarget.classList.toggle("active", isWireRibbon);
        if (viewer) applyStyle();
    });

    // Background toggle
    document.getElementById("toggle-bg")?.addEventListener("click", (e) => {
        isDarkBg = !isDarkBg;
        if (viewer) {
            viewer.setBackgroundColor(isDarkBg ? "black" : "#0a1628");
            viewer.render();
        }
        e.currentTarget.classList.toggle("active", isDarkBg);
    });

    // Reset view
    document.getElementById("reset-view-btn")?.addEventListener("click", () => {
        if (viewer) {
            viewer.zoomTo();
            viewer.spin("y", 0.5);
            viewer.render();
        }
    });
}

/* ================================================
   LOAD MOLECULE
   ================================================ */
function loadMolecule(query) {
    clearError();

    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;

    fetch(url)
        .then(r => {
            console.log("PubChem response status:", r.status);
            if (!r.ok) throw new Error(`Molecule "${query}" not found. Try another name.`);
            return r.json();
        })
        .then(data => {
            console.log("PubChem response data:", data);
            const props = data?.PropertyTable?.Properties?.[0];
            if (!props) throw new Error("No data returned from PubChem.");

            currentCID = props.CID;
            console.log("Setting currentCID:", currentCID);
            currentMolData = {
                name: query,
                cid: props.CID,
                smiles: props.CanonicalSMILES || "—",
                iupac: props.IUPACName || query,
                formula: props.MolecularFormula || "—",
                mass: props.MolecularWeight ? `${props.MolecularWeight} g/mol` : "—",
            };

            updateUI(currentMolData, query);
            load3D(currentCID);
        })
        .catch(err => showError(err.message));
}

/* ================================================
   UPDATE UI
   ================================================ */
function updateUI(data, query) {
    console.log("\n=== UPDATE UI CALLED ===");
    console.log("Query:", query);
    console.log("Data:", data);
    
    // Name display
    const displayName = query.charAt(0).toUpperCase() + query.slice(1);
    console.log("Setting name to:", displayName);
    setText("mol-name-display", displayName);

    // Identity
    console.log("Setting SMILES to:", data.smiles);
    setText("iupac-name", data.iupac);
    setHTML("formula", formatFormula(data.formula));
    setText("mass", data.mass);
    setText("pub-cid", data.cid || "—");
    setText("smiles-val", data.smiles);


    // Viewer tag
    setText("viewer-mol-tag", displayName + " · CID " + data.cid);

    // Description element removed

    // Show export buttons
    const sdfBtn = document.getElementById("export-sdf");
    const pdfBtn = document.getElementById("export-pdf");
    const hint   = document.getElementById("export-hint");

    // Export elements removed - keeping for backward compatibility if needed

    // Run property predictions
    predictProperties();

    // Fetch RDKit features (or use JS fallback) - Always run analysis
    console.log("UpdateUI called with data:", { smiles: data.smiles, formula: data.formula });
    analyzeWithPubChemData(data);
}

/* ================================================
   RDKIT FALLBACK - LOCAL JS ANALYSIS
   ================================================ */

// Optional: try backend if you want advanced RDKit analysis
async function analyzeWithBackend(smiles) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch("http://127.0.0.1:5000/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ smiles: smiles }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const backendData = await response.json();
            if (backendData.success) {
                console.log("Backend RDKit analysis successful");
                return backendData;
            }
        }
    } catch (err) {
        console.log("Backend not available:", err.message);
    }
    return null;
}

function analyzeWithPubChemData(data) {
    try {
        console.log("=== ANALYSIS START ===");
        console.log("Data received:", data);
        
        if (!data || !data.formula) {
            console.error("Missing formula data");
            showRDKitError("Missing formula data");
            return;
        }

        // Parse formula to get atom counts
        console.log("Parsing formula:", data.formula);
        const atomCounts = parseFormula(data.formula);
        console.log("Atom counts:", atomCounts);
        
        // Calculate descriptors from mass and formula
        console.log("Calculating descriptors...");
        const descriptors = calculateDescriptors(data, atomCounts);
        console.log("Descriptors:", descriptors);
        
        // Get Lipinski metrics  
        console.log("Calculating Lipinski...");
        const lipinski = calculateLipinski(atomCounts);
        console.log("Lipinski:", lipinski);
        
        // Detect functional groups from SMILES
        console.log("Detecting functional groups from:", data.smiles);
        const functionalGroups = detectFunctionalGroups(data.smiles);
        console.log("Functional groups:", functionalGroups);

        // Hide loading
        console.log("Hiding loading indicator...");
        const loadingEl = document.getElementById("features-loading");
        if (loadingEl) {
            loadingEl.style.display = "none";
            console.log("Loading hidden");
        }
        
        // Hide error
        const errorEl = document.getElementById("features-error");
        if (errorEl) {
            errorEl.style.display = "none";
        }

        // Display all
        console.log("Calling display functions...");
        console.log("1. Displaying atom composition...");
        displayAtomComposition(atomCounts);
        
        console.log("2. Displaying descriptors...");
        displayDescriptorsLocal(descriptors);
        
        console.log("3. Displaying Lipinski...");
        displayLipinski(lipinski);
        
        console.log("4. Displaying functional groups...");
        displayFunctionalGroups(functionalGroups);
        
        console.log("=== ANALYSIS COMPLETE ===");
    } catch (err) {
        console.error("Analysis error:", err);
        console.error("Stack:", err.stack);
        showRDKitError("Could not analyze molecule: " + err.message);
    }
}

function calculateDescriptors(data, atoms) {
    // Extract numeric value from mass string (e.g., "46.04 g/mol" -> 46.04)
    const massStr = String(data.mass).split(' ')[0];
    const mass = parseFloat(massStr) || 0;
    const carbons = atoms.C || 0;
    const hydrogens = atoms.H || 0;
    const nitrogens = atoms.N || 0;
    const oxygens = atoms.O || 0;
    const sulfurs = atoms.S || 0;
    const phosphorus = atoms.P || 0;

    // Estimate LogP (simple Wildman-Crippen)
    let logp = -0.5;  // base
    logp += carbons * 0.5;       // carbons increase lipophilicity
    logp -= oxygens * 1.0;        // oxygens decrease
    logp -= nitrogens * 0.7;      // nitrogens decrease
    logp += sulfurs * 0.3;

    // TPSA estimation (complex but we approximate)
    let tpsa = nitrogens * 12 + oxygens * 20.23;

    // Molar Refractivity (simple estimation)
    let refractivity = carbons * 2.503 + hydrogens * 1.03 + oxygens * 1.08 + nitrogens * 2.31;

    // Fraction of sp3 carbons
    const sp3fraction = carbons > 0 ? Math.max(0, Math.min(1, (hydrogens / (carbons * 4)))) : 0;

    return {
        molar_weight: mass,
        log_p: logp.toFixed(2),
        tpsa: tpsa.toFixed(2),
        molar_refractivity: refractivity.toFixed(2),
        fraction_sp3: sp3fraction.toFixed(3)
    };
}

function calculateLipinski(atoms) {
    return {
        h_donors: (atoms.N || 0) + (atoms.O || 0),      // Approximate
        h_acceptors: ((atoms.N || 0) * 1.2 + (atoms.O || 0) * 2),  // Approximate
        rotatable_bonds: Math.max(0, ((atoms.C || 0) - 2)),  // Rough estimate
        aromatic_rings: 0,       // Can't detect from formula
        aliphatic_rings: 0,      // Can't detect from formula
        saturated_rings: 0       // Can't detect from formula
    };
}

function detectFunctionalGroups(smiles) {
    if (!smiles || smiles === "—") return [];

    const groups = [];
    const patterns = {
        "Hydroxyl": /\[?O?\]?(O|[O-])/,
        "Carbonyl": /C(=O)/,
        "Carboxylic Acid": /C(=O)O/,
        "Ester": /C(=O)O[^H]/,
        "Amine": /N/,
        "Amide": /C(=O)N/,
        "Alkene": /C=C/,
        "Alkyne": /C#C/,
        "Benzene": /c1ccccc1/,
        "Halogen": /[FClBrI]/,
        "Nitrile": /C#N/,
        "Sulfone": /S(=O)(=O)/,
        "Sulfide": /[SX2]/,
    };

    Object.entries(patterns).forEach(([name, pattern]) => {
        const matches = (smiles.match(pattern) || []);
        if (matches.length > 0) {
            groups.push({ name, count: matches.length });
        }
    });

    return groups.sort((a, b) => b.count - a.count);
}

function parseFormula(formula) {
    const counts = {};
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
        const atom = match[1];
        const count = match[2] ? parseInt(match[2]) : 1;
        counts[atom] = (counts[atom] || 0) + count;
    }
    return counts;
}

function hideRDKitSections() {
    const sections = [
        "atom-composition",
        "descriptors-section",
        "lipinski-section",
        "funcgroup-section"
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

function showRDKitError(msg) {
    const errorEl = document.getElementById("features-error");
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
    }
}

function displayAtomComposition(composition) {
    console.log("[displayAtomComposition] Called with:", composition);
    
    if (!composition) {
        console.error("[displayAtomComposition] Composition is null/undefined");
        return;
    }

    const section = document.getElementById("atom-composition");
    const grid = document.getElementById("atom-grid");
    
    console.log("[displayAtomComposition] Section found:", !!section);
    console.log("[displayAtomComposition] Grid found:", !!grid);
    
    if (!grid) {
        console.error("[displayAtomComposition] Grid element not found!");
        return;
    }

    grid.innerHTML = "";
    const entries = Object.entries(composition);
    console.log("[displayAtomComposition] Creating cards for atoms:", entries);
    
    entries
        .sort((a, b) => b[1] - a[1])
        .forEach(([atom, count]) => {
            const card = document.createElement("div");
            card.className = "atom-card";
            card.innerHTML = `
                <div class="atom-symbol">${atom}</div>
                <div class="atom-count">×${count}</div>
            `;
            grid.appendChild(card);
        });

    if (section) {
        section.style.display = "block";
        console.log("[displayAtomComposition] Section displayed - style.display set to 'block'");
    } else {
        console.error("[displayAtomComposition] Section element not found!");
    }
}

function displayDescriptorsLocal(descriptors) {
    console.log("[displayDescriptorsLocal] Called with:", descriptors);
    
    if (!descriptors) {
        console.error("[displayDescriptorsLocal] Descriptors is null/undefined");
        return;
    }

    const section = document.getElementById("descriptors-section");
    const grid = document.getElementById("desc-grid");
    
    console.log("[displayDescriptorsLocal] Section found:", !!section);
    console.log("[displayDescriptorsLocal] Grid found:", !!grid);
    
    if (!grid) {
        console.error("[displayDescriptorsLocal] Grid element not found!");
        return;
    }

    grid.innerHTML = "";
    const names = {
        molar_weight: "Molar Weight",
        log_p: "LogP",
        tpsa: "TPSA",
        molar_refractivity: "Molar Refractivity",
        fraction_sp3: "Sp³ Fraction"
    };

    const entries = Object.entries(descriptors);
    console.log("[displayDescriptorsLocal] Creating items for descriptors:", entries);
    
    entries.forEach(([key, value]) => {
        const item = document.createElement("div");
        item.className = "desc-item";
        item.innerHTML = `
            <div class="desc-name">${names[key] || key}</div>
            <div class="desc-value">${typeof value === 'number' ? value.toFixed(2) : value}</div>
        `;
        grid.appendChild(item);
    });

    if (section) {
        section.style.display = "block";
        console.log("[displayDescriptorsLocal] Section displayed - style.display set to 'block'");
    } else {
        console.error("[displayDescriptorsLocal] Section element not found!");
    }
}

function displayLipinski(lipinski) {
    console.log("[displayLipinski] Called with:", lipinski);
    
    if (!lipinski) {
        console.error("[displayLipinski] Lipinski is null/undefined");
        return;
    }

    const section = document.getElementById("lipinski-section");
    const grid = document.getElementById("lipinski-grid");
    
    console.log("[displayLipinski] Section found:", !!section);
    console.log("[displayLipinski] Grid found:", !!grid);
    
    if (!grid) {
        console.error("[displayLipinski] Grid element not found!");
        return;
    }

    grid.innerHTML = "";
    const names = {
        h_donors: "H-Donors",
        h_acceptors: "H-Acceptors",
        rotatable_bonds: "Rotatable Bonds",
        aromatic_rings: "Aromatic Rings",
        aliphatic_rings: "Aliphatic Rings",
        saturated_rings: "Saturated Rings"
    };

    const entries = Object.entries(lipinski);
    console.log("[displayLipinski] Creating items for metrics:", entries);
    
    entries.forEach(([key, value]) => {
        const item = document.createElement("div");
        item.className = "lipinski-item";
        item.innerHTML = `
            <div class="lipinski-name">${names[key] || key}</div>
            <div class="lipinski-value">${Math.round(value)}</div>
        `;
        grid.appendChild(item);
    });

    if (section) {
        section.style.display = "block";
        console.log("[displayLipinski] Section displayed - style.display set to 'block'");
    } else {
        console.error("[displayLipinski] Section element not found!");
    }
}

function displayFunctionalGroups(groups) {
    console.log("[displayFunctionalGroups] Called with:", groups);
    
    if (!groups || groups.length === 0) {
        console.log("[displayFunctionalGroups] No functional groups found");
        const section = document.getElementById("funcgroup-section");
        if (section) {
            section.style.display = "none";
            console.log("[displayFunctionalGroups] Section hidden");
        }
        return;
    }

    const section = document.getElementById("funcgroup-section");
    const list = document.getElementById("funcgroup-list");
    
    console.log("[displayFunctionalGroups] Section found:", !!section);
    console.log("[displayFunctionalGroups] List found:", !!list);
    
    if (!list) {
        console.error("[displayFunctionalGroups] List element not found!");
        return;
    }

    list.innerHTML = "";
    const sorted = groups.sort((a, b) => b.count - a.count);
    console.log("[displayFunctionalGroups] Creating items for groups:", sorted);
    
    sorted.forEach(group => {
        const item = document.createElement("div");
        item.className = "funcgroup-item";
        item.innerHTML = `
            <div class="funcgroup-name">${group.name}</div>
            <div class="funcgroup-badge">×${group.count}</div>
        `;
        list.appendChild(item);
    });

    if (section) {
        section.style.display = "block";
        console.log("[displayFunctionalGroups] Section displayed - style.display set to 'block'");
    } else {
        console.error("[displayFunctionalGroups] Section element not found!");
    }
}

/* ================================================
   3D MODEL
   ================================================ */
function load3D(cid) {
    if (!viewer) return;
    resetAngle();
    viewer.clear();

    $3Dmol.download(`cid:${cid}`, viewer, {}, () => {
        applyStyle();
        viewer.setClickable({}, true, handleAtomClick);
        viewer.render();
        viewer.zoomTo();
        viewer.spin("y", 0.5);
    });
}

function applyStyle() {
    if (!viewer) return;

    if (isWireRibbon) {
        // Wire ribbon / cartoon representation
        viewer.setStyle({}, { cartoon: { colorscheme: "spectrum" } });
        viewer.setStyle({}, { stick: {}, sphere: { scale: 0.25 } });
    } else if (isSpaceFilling) {
        viewer.setStyle({}, { sphere: { scale: 1.0, colorscheme: "Jmol" } });
    } else {
        viewer.setStyle({}, {
            stick: { radius: 0.15, colorscheme: "Jmol" },
            sphere: { radius: 0.38, colorscheme: "Jmol" },
        });
    }

    // Re-highlight selected atoms
    selectedAtoms.forEach(atom => {
        viewer.setStyle({ serial: atom.serial }, {
            stick: { radius: 0.15 },
            sphere: { radius: isSpaceFilling ? 1.05 : 0.58, color: "#0bf4c8" },
        });
    });

    viewer.render();
}

/* ================================================
   ATOM CLICK / BOND ANGLE
   ================================================ */
function handleAtomClick(atom) {
    if (selectedAtoms.length >= 3) return;
    viewer.spin(false);
    selectedAtoms.push(atom);

    // Highlight selected atom
    viewer.setStyle({ serial: atom.serial }, {
        stick: { radius: 0.15 },
        sphere: { radius: isSpaceFilling ? 1.05 : 0.58, color: "#0bf4c8" },
    });
    viewer.render();

    // Update slot UI
    const idx = selectedAtoms.length;
    const slotEl = document.getElementById(`atom-${idx}`);
    const boxEl  = document.getElementById(`slot-${idx}`);
    if (slotEl) slotEl.textContent = atom.elem + atom.serial;
    if (boxEl) boxEl.classList.add("filled");

    if (selectedAtoms.length === 3) computeAngle();
}

function computeAngle() {
    const [A, B, C] = selectedAtoms;
    const vBA = { x: A.x - B.x, y: A.y - B.y, z: A.z - B.z };
    const vBC = { x: C.x - B.x, y: C.y - B.y, z: C.z - B.z };
    const magBA = Math.sqrt(vBA.x**2 + vBA.y**2 + vBA.z**2);
    const magBC = Math.sqrt(vBC.x**2 + vBC.y**2 + vBC.z**2);
    const dot = vBA.x*vBC.x + vBA.y*vBC.y + vBA.z*vBC.z;
    const angle = (Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * 180) / Math.PI;

    const valEl = document.getElementById("angle-value");
    const resEl = document.getElementById("angle-result");
    if (valEl) {
        valEl.textContent = angle.toFixed(2) + "°";
        valEl.classList.add("active");
    }
    if (resEl) resEl.classList.add("calculated");
}

function resetAngle() {
    selectedAtoms = [];
    for (let i = 1; i <= 3; i++) {
        const slot = document.getElementById(`atom-${i}`);
        const box = document.getElementById(`slot-${i}`);
        if (slot) slot.textContent = "—";
        if (box) box.classList.remove("filled");
    }
    const valEl = document.getElementById("angle-value");
    const resEl = document.getElementById("angle-result");
    if (valEl) { valEl.textContent = "WAITING"; valEl.classList.remove("active"); }
    if (resEl) resEl.classList.remove("calculated");

    if (viewer && currentCID) {
        applyStyle();
        viewer.spin("y", 0.5);
    }
}

/* ================================================
   PDF EXPORT
   ================================================ */
function exportPDF() {
    if (!currentMolData || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Background
    doc.setFillColor(5, 8, 16);
    doc.rect(0, 0, 210, 297, "F");

    // Accent top bar
    doc.setFillColor(11, 244, 200);
    doc.rect(0, 0, 210, 4, "F");

    // Title
    doc.setTextColor(11, 244, 200);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    const name = currentMolData.name.charAt(0).toUpperCase() + currentMolData.name.slice(1);
    doc.text(`${name} — Molecular Report`, 18, 22);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("MolecularAI Laboratory Bench · Powered by PubChem", 18, 29);

    // Divider
    doc.setDrawColor(11, 244, 200);
    doc.setLineWidth(0.3);
    doc.line(18, 33, 192, 33);

    // Fields
    const fields = [
        { label: "IUPAC Name", value: currentMolData.iupac },
        { label: "Molecular Formula", value: currentMolData.formula },
        { label: "Molar Mass", value: currentMolData.mass },
        { label: "PubChem CID", value: String(currentMolData.cid) },
        { label: "Canonical SMILES", value: currentMolData.smiles },
    ];

    const angleEl = document.getElementById("angle-value");
    if (angleEl && angleEl.textContent !== "WAITING") {
        fields.push({ label: "Calculated Bond Angle", value: angleEl.textContent });
    }

    let y = 44;
    fields.forEach(f => {
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(f.label.toUpperCase(), 18, y);

        doc.setTextColor(226, 232, 240);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(f.value, 166);
        doc.text(lines, 18, y + 5.5);
        y += 6 + lines.length * 6.5;

        doc.setDrawColor(30, 35, 55);
        doc.setLineWidth(0.1);
        doc.line(18, y + 1.5, 192, y + 1.5);
        y += 7;
    });

    // Footer
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.text(`Generated: ${new Date().toLocaleString()} · Data: PubChem Open Access (NCBI)`, 18, 288);

    doc.save(`${name}_report.pdf`);
}

/* ================================================
   HELPERS
   ================================================ */
function setText(id, val) {
    const el = document.getElementById(id);
    console.log(`setText('${id}', '${val}') - element found:`, !!el);
    if (el) {
        el.textContent = val;
        console.log(`setText: Updated #${id} to '${val}'`);
    } else {
        console.error(`setText: Element #${id} not found!`);
    }
}

function setHTML(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
}

function formatFormula(f) {
    return f.replace(/(\d+)/g, "<sub>$1</sub>");
}

function showError(msg) {
    const el = document.getElementById("search-error");
    if (el) { el.textContent = msg; el.style.display = "block"; }
}

function clearError() {
    const el = document.getElementById("search-error");
    if (el) { el.textContent = ""; el.style.display = "none"; }
}

/* ================================================
   MOLECULAR PROPERTY PREDICTIONS
   ================================================ */

// Parse formula and count atoms


// Predict molecular properties
function predictProperties() {
    if (!currentMolData) return;

    const mass = parseFloat(currentMolData.mass) || 0;
    const formula = currentMolData.formula || "";
    const smiles = currentMolData.smiles || "";
    const atoms = parseFormula(formula);

    // ─── Lipinski's Rule of Five (Drug-Likeness) ───
    const lipinskiScore = assessDrugLikeness(mass, atoms, formula);
    
    // ─── Solubility Prediction ───
    const solubility = predictSolubility(mass, atoms);
    
    // ─── Toxicity Risk Assessment ───
    const toxicity = assessToxicity(atoms, smiles);
    
    // ─── Bioavailability ───
    const bioavail = assessBioavailability(mass, atoms);

    // Update UI
    updatePredictionUI(lipinskiScore, solubility, toxicity, bioavail);
}

function assessDrugLikeness(molarMass, atoms, formula) {
    const checks = {
        mw: molarMass <= 500,        // Molecular weight rule
        hbd: (atoms.O || 0) + (atoms.N || 0) <= 5,  // H-bond donors (approx)
        hba: (atoms.O || 0) * 2 + (atoms.N || 0) <= 10,  // H-bond acceptors (approx)
        logp: true  // Simplified: assume most drugs pass this
    };

    const passCount = Object.values(checks).filter(v => v).length;
    const score = (passCount / 4) * 100;

    let badge = "good";
    let text = "DRUG-LIKE";
    let details = [];

    if (passCount <= 1) { badge = "bad"; text = "HIGH VIOLATION"; }
    else if (passCount <= 2) { badge = "warning"; text = "MODERATE VIOLATION"; }

    if (!checks.mw) details.push("⚠️ MW > 500");
    if (!checks.hbd) details.push("⚠️ Too many H-donors");
    if (!checks.hba) details.push("⚠️ Too many H-acceptors");

    return { badge, text, score, details: details.join(", ") };
}

function predictSolubility(molarMass, atoms) {
    // Simple heuristic: smaller molecules with more O/N tend to be more soluble
    const oxygenNitrogen = (atoms.O || 0) + (atoms.N || 0);
    const carbohydrateRatio = oxygenNitrogen / Math.max(1, (atoms.C || 1));
    
    let solubility = 50; // Base score
    
    if (molarMass > 500) solubility -= 20;
    if (molarMass > 1000) solubility -= 20;
    if (carbohydrateRatio > 0.5) solubility += 30;
    if (carbohydrateRatio > 1.0) solubility += 20;
    if (atoms.F) solubility += 10;  // Fluorine increases solubility
    if ((atoms.Br || 0) > 2) solubility -= 15;  // Too many halogen increases lipophilicity
    
    solubility = Math.max(10, Math.min(100, solubility));

    const category = solubility > 70 ? "HIGHLY SOLUBLE" : solubility > 40 ? "MODERATELY SOLUBLE" : "LOW SOLUBILITY";
    
    return { score: solubility, text: category };
}

function assessToxicity(atoms, smiles) {
    let riskScore = 20;  // Base risk
    const alerts = [];

    // Structural alerts for toxicity
    if ((atoms.S || 0) > 2) { riskScore += 15; alerts.push("Multiple sulfur"); }
    if ((atoms.Cl || 0) > 3) { riskScore += 20; alerts.push("Highly chlorinated"); }
    if ((atoms.N || 0) > 5) { riskScore += 10; alerts.push("Highly nitrogenated"); }
    if (smiles?.includes("N(=O)=O")) { riskScore += 12; alerts.push("Nitro group"); }
    if (smiles?.includes("[S](=O)(=O)")) { riskScore += 8; alerts.push("Sulfonyl"); }
    if ((atoms.P || 0) > 0) { riskScore += 10; alerts.push("Phosphorus present"); }
    
    riskScore = Math.max(10, Math.min(90, riskScore));

    const category = riskScore > 60 ? "HIGH RISK" : riskScore > 35 ? "MODERATE RISK" : "LOW RISK";
    
    return { score: riskScore, text: category, alerts: alerts.join(", ") };
}

function assessBioavailability(molarMass, atoms) {
    let bioavailScore = 70;  // Optimistic base
    
    const oxygenNitrogen = (atoms.O || 0) + (atoms.N || 0);
    const rotatable = Math.max(0, (atoms.C || 0) - (atoms.N || 0) - (atoms.O || 0));
    
    if (molarMass > 500) bioavailScore -= 25;
    if (molarMass > 800) bioavailScore -= 20;
    if (rotatable > 10) bioavailScore -= 15;
    if (oxygenNitrogen > 8) bioavailScore -= 10;
    if (oxygenNitrogen < 1) bioavailScore -= 20;  // No HBA/HBD usually bad
    
    bioavailScore = Math.max(15, Math.min(95, bioavailScore));

    const category = bioavailScore > 70 ? "EXCELLENT" : bioavailScore > 50 ? "GOOD" : bioavailScore > 30 ? "MODERATE" : "POOR";
    
    return { score: bioavailScore, text: category };
}

function updatePredictionUI(lipinski, solubility, toxicity, bioavail) {
    // Drug-likeness
    const drugBadge = document.getElementById("drug-likeness-badge");
    const drugDetails = document.getElementById("drug-likeness-details");
    if (drugBadge) {
        drugBadge.textContent = lipinski.text;
        drugBadge.className = `pred-badge ${lipinski.badge}`;
    }
    if (drugDetails) drugDetails.textContent = lipinski.details;

    // Solubility
    const solubBar = document.getElementById("solubility-bar");
    const solubVal = document.getElementById("solubility-pred");
    if (solubBar) solubBar.style.width = solubility.score + "%";
    if (solubVal) solubVal.textContent = solubility.text + ` (${Math.round(solubility.score)}%)`;

    // Toxicity
    const toxiBar = document.getElementById("toxicity-bar");
    const toxiVal = document.getElementById("toxicity-pred");
    if (toxiBar) toxiBar.style.width = toxicity.score + "%";
    if (toxiVal) toxiVal.textContent = toxicity.text + ` (${Math.round(toxicity.score)}%)`;

    // Bioavailability
    const bioBar = document.getElementById("bioavail-bar");
    const bioVal = document.getElementById("bioavail-pred");
    if (bioBar) bioBar.style.width = bioavail.score + "%";
    if (bioVal) bioVal.textContent = bioavail.text + ` (${Math.round(bioavail.score)}%)`;
}

/* ================================================
   RDKIT MOLECULAR FEATURE EXTRACTION
   ================================================ */

async function fetchRDKitFeatures(smiles) {
    const loadingEl = document.getElementById("features-loading");
    const errorEl = document.getElementById("features-error");
    
    // Show loading state
    if (loadingEl) loadingEl.style.display = "flex";
    if (errorEl) errorEl.style.display = "none";
    
    // Hide all sections
    hideRDKitSections();

    try {
        const response = await fetch("http://127.0.0.1:5000/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ smiles: smiles })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            showRDKitError(data.error);
            return;
        }

        // Hide loading
        if (loadingEl) loadingEl.style.display = "none";

        // Display features
        displayAtomComposition(data.atoms?.composition);
        displayDescriptorsLocal(data.descriptors);
        displayLipinski(data.lipinski);
        displayFunctionalGroups(data.functional_groups);

    } catch (err) {
        if (loadingEl) loadingEl.style.display = "none";
        showRDKitError(`Backend unavailable: ${err.message}`);
    }
}




