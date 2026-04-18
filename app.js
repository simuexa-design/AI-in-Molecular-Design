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

        // Extract atoms for Z-Matrix generation
        try {
            const model = viewer.getModel();
            if (model) {
                const atoms = model.selectedAtoms({});
                if (atoms && atoms.length > 0) {
                    generateZMatrix(atoms);
                }
            }
        } catch (err) {
            console.warn("[Z-Matrix] Could not extract atoms:", err.message);
        }
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


/* ================================================
   Z-MATRIX GENERATION (Internal Coordinates)
   ================================================ */

/**
 * Generate Z-Matrix from 3D Cartesian coordinates.
 * Called after the 3D model is loaded by the viewer.
 */
function generateZMatrix(atoms) {
    if (!atoms || atoms.length === 0) return;

    console.log("[Z-Matrix] Generating from", atoms.length, "atoms");

    const zRows = [];
    const variables = {};

    for (let i = 0; i < atoms.length; i++) {
        const row = { idx: i + 1, elem: atoms[i].elem };

        if (i >= 1) {
            // Bond length to closest previous atom (or atom 0)
            const refBond = findClosestPreceding(atoms, i);
            row.bondRef = refBond + 1;
            row.bondLength = distance3D(atoms[i], atoms[refBond]);
            const varName = `r${i + 1}`;
            variables[varName] = row.bondLength.toFixed(4);
        }

        if (i >= 2) {
            // Bond angle: atom i — bondRef — angleRef
            const refAngle = findAngleRef(atoms, i, row.bondRef - 1);
            row.angleRef = refAngle + 1;
            row.bondAngle = calcAngle3D(atoms[i], atoms[row.bondRef - 1], atoms[refAngle]);
            const varName = `a${i + 1}`;
            variables[varName] = row.bondAngle.toFixed(1);
        }

        if (i >= 3) {
            // Torsion/dihedral angle
            const refTorsion = findTorsionRef(atoms, i, row.bondRef - 1, row.angleRef - 1);
            row.torsionRef = refTorsion + 1;
            row.torsion = calcDihedral(atoms[i], atoms[row.bondRef - 1], atoms[row.angleRef - 1], atoms[refTorsion]);
            const varName = `d${i + 1}`;
            variables[varName] = row.torsion.toFixed(1);
        }

        zRows.push(row);
    }

    displayZMatrix(zRows, variables);
}

/** Euclidean distance between two atoms */
function distance3D(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Find closest preceding atom (for bond reference) */
function findClosestPreceding(atoms, idx) {
    let best = 0;
    let bestDist = Infinity;
    for (let j = 0; j < idx; j++) {
        const d = distance3D(atoms[idx], atoms[j]);
        if (d < bestDist) { bestDist = d; best = j; }
    }
    return best;
}

/** Find a suitable angle reference atom (different from bondRef) */
function findAngleRef(atoms, idx, bondRefIdx) {
    let best = -1;
    let bestDist = Infinity;
    for (let j = 0; j < idx; j++) {
        if (j === bondRefIdx) continue;
        const d = distance3D(atoms[bondRefIdx], atoms[j]);
        if (d < bestDist) { bestDist = d; best = j; }
    }
    return best >= 0 ? best : 0;
}

/** Find a suitable torsion reference atom */
function findTorsionRef(atoms, idx, bondRefIdx, angleRefIdx) {
    let best = -1;
    let bestDist = Infinity;
    for (let j = 0; j < idx; j++) {
        if (j === bondRefIdx || j === angleRefIdx) continue;
        const d = distance3D(atoms[angleRefIdx], atoms[j]);
        if (d < bestDist) { bestDist = d; best = j; }
    }
    if (best < 0) {
        // Fallback: use first available atom
        for (let j = 0; j < idx; j++) {
            if (j !== bondRefIdx && j !== angleRefIdx) return j;
        }
        return 0;
    }
    return best;
}

/** Bond angle A-B-C (degrees) — angle at vertex B */
function calcAngle3D(a, b, c) {
    const vBA = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const vBC = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const dot = vBA.x * vBC.x + vBA.y * vBC.y + vBA.z * vBC.z;
    const magBA = Math.sqrt(vBA.x ** 2 + vBA.y ** 2 + vBA.z ** 2);
    const magBC = Math.sqrt(vBC.x ** 2 + vBC.y ** 2 + vBC.z ** 2);
    if (magBA === 0 || magBC === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Dihedral angle A-B-C-D (degrees) */
function calcDihedral(a, b, c, d) {
    const b1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const b2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const b3 = { x: d.x - c.x, y: d.y - c.y, z: d.z - c.z };

    const cross = (u, v) => ({
        x: u.y * v.z - u.z * v.y,
        y: u.z * v.x - u.x * v.z,
        z: u.x * v.y - u.y * v.x
    });
    const dot = (u, v) => u.x * v.x + u.y * v.y + u.z * v.z;
    const mag = (u) => Math.sqrt(u.x ** 2 + u.y ** 2 + u.z ** 2);

    const n1 = cross(b1, b2);
    const n2 = cross(b2, b3);
    const m1 = cross(n1, b2);

    const magB2 = mag(b2);
    if (magB2 === 0) return 0;

    const x = dot(n1, n2);
    const y = dot(m1, n2) / magB2;

    return (Math.atan2(y, x) * 180) / Math.PI;
}

/* ================================================
   Z-MATRIX UI DISPLAY
   ================================================ */
function displayZMatrix(rows, variables) {
    const panel = document.getElementById("zmatrix-panel");
    const tbody = document.getElementById("zmatrix-tbody");
    const varGrid = document.getElementById("zmatrix-var-grid");

    if (!panel || !tbody) return;

    // Build table rows
    tbody.innerHTML = "";
    rows.forEach(row => {
        const tr = document.createElement("tr");
        const elemClass = `elem-${row.elem}`;

        // Index
        tr.innerHTML = `<td class="ztd-idx">${row.idx}</td>`;

        // Atom
        tr.innerHTML += `<td class="ztd-atom ${elemClass}">${row.elem}</td>`;

        // Bond ref & length
        if (row.bondLength !== undefined) {
            tr.innerHTML += `<td class="ztd-ref">${row.bondRef}</td>`;
            tr.innerHTML += `<td class="ztd-bond">${row.bondLength.toFixed(4)}</td>`;
        } else {
            tr.innerHTML += `<td class="ztd-empty">—</td><td class="ztd-empty">—</td>`;
        }

        // Angle ref & value
        if (row.bondAngle !== undefined) {
            tr.innerHTML += `<td class="ztd-ref">${row.angleRef}</td>`;
            tr.innerHTML += `<td class="ztd-angle">${row.bondAngle.toFixed(1)}</td>`;
        } else {
            tr.innerHTML += `<td class="ztd-empty">—</td><td class="ztd-empty">—</td>`;
        }

        // Torsion ref & value
        if (row.torsion !== undefined) {
            tr.innerHTML += `<td class="ztd-ref">${row.torsionRef}</td>`;
            tr.innerHTML += `<td class="ztd-torsion">${row.torsion.toFixed(1)}</td>`;
        } else {
            tr.innerHTML += `<td class="ztd-empty">—</td><td class="ztd-empty">—</td>`;
        }

        tbody.appendChild(tr);
    });

    // Build variable definitions
    if (varGrid) {
        varGrid.innerHTML = "";
        Object.entries(variables).forEach(([name, val]) => {
            const item = document.createElement("div");
            item.className = "zvar-item";
            item.innerHTML = `
                <span class="zvar-name">${name}</span>
                <span><span class="zvar-eq">=</span><span class="zvar-val">${val}</span></span>
            `;
            varGrid.appendChild(item);
        });
    }

    // Store for copy
    panel._zmatrixRows = rows;
    panel._zmatrixVars = variables;

    // Show the panel
    panel.style.display = "flex";
    console.log("[Z-Matrix] Displayed", rows.length, "rows");
}

/* ================================================
   Z-MATRIX COPY TO CLIPBOARD (IQmol format)
   ================================================ */
function zmatrixToText(rows, variables) {
    let lines = [];
    lines.push("0  1");  // charge  multiplicity

    rows.forEach(row => {
        let line = row.elem;
        if (row.bondLength !== undefined) {
            line += `  ${row.bondRef}  r${row.idx}`;
        }
        if (row.bondAngle !== undefined) {
            line += `  ${row.angleRef}  a${row.idx}`;
        }
        if (row.torsion !== undefined) {
            line += `  ${row.torsionRef}  d${row.idx}`;
        }
        lines.push(line);
    });

    lines.push("Variables:");
    Object.entries(variables).forEach(([name, val]) => {
        lines.push(`${name}= ${val}`);
    });

    return lines.join("\n");
}

// Setup copy button
document.addEventListener("DOMContentLoaded", () => {
    const copyBtn = document.getElementById("zmatrix-copy-btn");
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            const panel = document.getElementById("zmatrix-panel");
            if (!panel || !panel._zmatrixRows) return;

            const text = zmatrixToText(panel._zmatrixRows, panel._zmatrixVars);
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = "✓ Copied!";
                copyBtn.classList.add("copied");
                setTimeout(() => {
                    copyBtn.textContent = "📋 Copy";
                    copyBtn.classList.remove("copied");
                }, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
            });
        });
    }

    // Compare mode toggle
    setupCompareModeToggle();
});

/* ================================================
   COMPARE MODE - TOGGLE & INITIALIZATION
   ================================================ */
let isCompareMode = false;
let compareViewers = { mol1: null, mol2: null };
let compareMolData = { mol1: null, mol2: null };
let rotateSyncEnabled = false;

function setupCompareModeToggle() {
    const toggleBtn = document.getElementById("compare-mode-toggle");
    const mainBench = document.querySelector(".bench-main");
    const compareSection = document.getElementById("compare-mode-section");

    if (!toggleBtn || !mainBench || !compareSection) return;

    toggleBtn.addEventListener("click", () => {
        isCompareMode = !isCompareMode;
        toggleBtn.classList.toggle("active", isCompareMode);

        // Toggle visibility
        mainBench.style.display = isCompareMode ? "none" : "flex";
        compareSection.style.display = isCompareMode ? "block" : "none";

        if (isCompareMode) {
            initCompareViewers();
            setupCompareEventListeners();
        } else {
            cleanupCompareMode();
        }
    });
}

function initCompareViewers() {
    const el1 = document.getElementById("compare-container-1");
    const el2 = document.getElementById("compare-container-2");

    if (!el1 || !el2 || !window.$3Dmol) return;

    compareViewers.mol1 = $3Dmol.createViewer(el1, {
        backgroundColor: "black",
        antialias: true,
    });
    compareViewers.mol2 = $3Dmol.createViewer(el2, {
        backgroundColor: "black",
        antialias: true,
    });

    console.log("Compare viewers initialized");
}

function setupCompareEventListeners() {
    // Load buttons
    document.getElementById("compare-mol-1-load")?.addEventListener("click", () => {
        const query = document.getElementById("compare-mol-1-search")?.value.trim();
        if (query) loadCompareMolecule(query, 1);
    });

    document.getElementById("compare-mol-2-load")?.addEventListener("click", () => {
        const query = document.getElementById("compare-mol-2-search")?.value.trim();
        if (query) loadCompareMolecule(query, 2);
    });

    // Search on Enter
    document.getElementById("compare-mol-1-search")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = e.target.value.trim();
            if (query) loadCompareMolecule(query, 1);
        }
    });

    document.getElementById("compare-mol-2-search")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = e.target.value.trim();
            if (query) loadCompareMolecule(query, 2);
        }
    });

    // Style toggles
    document.getElementById("compare-style-1")?.addEventListener("click", (e) => {
        if (compareViewers.mol1) {
            applyCompareStyle(compareViewers.mol1, "ball", "compare-style-1", "compare-ribbon-1");
        }
    });

    document.getElementById("compare-ribbon-1")?.addEventListener("click", (e) => {
        if (compareViewers.mol1) {
            applyCompareStyle(compareViewers.mol1, "ribbon", "compare-style-1", "compare-ribbon-1");
        }
    });

    document.getElementById("compare-style-2")?.addEventListener("click", (e) => {
        if (compareViewers.mol2) {
            applyCompareStyle(compareViewers.mol2, "ball", "compare-style-2", "compare-ribbon-2");
        }
    });

    document.getElementById("compare-ribbon-2")?.addEventListener("click", (e) => {
        if (compareViewers.mol2) {
            applyCompareStyle(compareViewers.mol2, "ribbon", "compare-style-2", "compare-ribbon-2");
        }
    });

    // Reset view buttons
    document.getElementById("compare-reset-1")?.addEventListener("click", () => {
        if (compareViewers.mol1) {
            compareViewers.mol1.zoomTo();
            compareViewers.mol1.render();
        }
    });

    document.getElementById("compare-reset-2")?.addEventListener("click", () => {
        if (compareViewers.mol2) {
            compareViewers.mol2.zoomTo();
            compareViewers.mol2.render();
        }
    });

    // Sync rotations button
    document.getElementById("sync-rotations-btn")?.addEventListener("click", (e) => {
        rotateSyncEnabled = !rotateSyncEnabled;
        e.currentTarget.classList.toggle("active", rotateSyncEnabled);
        console.log("Rotation sync:", rotateSyncEnabled ? "ENABLED" : "DISABLED");
        
        if (rotateSyncEnabled) {
            setupRotationSync();
        } else {
            cleanupRotationSync();
        }
    });

    // Generate report button
    document.getElementById("compare-generate-report")?.addEventListener("click", generateComparisonReport);
}

function loadCompareMolecule(query, slot) {
    const slotNum = slot === 1 ? "mol1" : "mol2";
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;

    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error(`Molecule "${query}" not found`);
            return r.json();
        })
        .then(data => {
            const props = data?.PropertyTable?.Properties?.[0];
            if (!props) throw new Error("No data returned from PubChem");

            compareMolData[slotNum] = {
                name: query,
                cid: props.CID,
                smiles: props.CanonicalSMILES || "—",
                iupac: props.IUPACName || query,
                formula: props.MolecularFormula || "—",
                mass: props.MolecularWeight ? `${props.MolecularWeight}` : "—",
            };

            updateCompareUI(slot);
            load3DCompare(props.CID, slot);
        })
        .catch(err => console.error(`Compare load error (slot ${slot}):`, err.message));
}

function updateCompareUI(slot) {
    const data = compareMolData[slot === 1 ? "mol1" : "mol2"];
    if (!data) return;

    const prefix = `compare-mol-${slot}`;
    const displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    setText(`${prefix}-name`, displayName);
    setText(`${prefix}-formula`, data.formula);
    setText(`${prefix}-iupac`, data.iupac);
    setText(`${prefix}-mass`, data.mass);
    setText(`${prefix}-formula-full`, data.formula);
    setText(`${prefix}-logp`, (parseFloat(data.mass) * 0.5).toFixed(2)); // Dummy LogP
}

function load3DCompare(cid, slot) {
    const viewer = slot === 1 ? compareViewers.mol1 : compareViewers.mol2;
    if (!viewer) return;

    viewer.clear();
    $3Dmol.download(`cid:${cid}`, viewer, {}, () => {
        applyCompareStyle(viewer, "ball", `compare-style-${slot}`, `compare-ribbon-${slot}`);
        viewer.setClickable({}, false);
        viewer.render();
        viewer.zoomTo();
        viewer.spin("y", 0.5);
    });
}

function applyCompareStyle(viewer, style, ballBtnId, ribbonBtnId) {
    if (!viewer) return;

    if (style === "ribbon") {
        viewer.setStyle({}, { cartoon: { colorscheme: "spectrum" } });
        viewer.setStyle({}, { stick: {}, sphere: { scale: 0.25 } });
        document.getElementById(ribbonBtnId)?.classList.add("active");
        document.getElementById(ballBtnId)?.classList.remove("active");
    } else {
        viewer.setStyle({}, {
            stick: { radius: 0.15, colorscheme: "Jmol" },
            sphere: { radius: 0.38, colorscheme: "Jmol" },
        });
        document.getElementById(ballBtnId)?.classList.add("active");
        document.getElementById(ribbonBtnId)?.classList.remove("active");
    }
    viewer.render();
}

function cleanupCompareMode() {
    if (compareViewers.mol1) {
        compareViewers.mol1.clear();
        compareViewers.mol1 = null;
    }
    if (compareViewers.mol2) {
        compareViewers.mol2.clear();
        compareViewers.mol2 = null;
    }
    compareMolData = { mol1: null, mol2: null };
    rotateSyncEnabled = false;
    cleanupRotationSync();
}

/* ================================================
   3D VIEW ROTATION SYNC
   ================================================ */
let syncRotationTimer = null;
let lastSyncedCamera = { mol1: null, mol2: null };

function setupRotationSync() {
    if (!compareViewers.mol1 || !compareViewers.mol2) return;

    const container1 = document.getElementById("compare-container-1");
    const container2 = document.getElementById("compare-container-2");

    if (!container1 || !container2) return;

    // Listen for mouse events on viewer 1
    container1.addEventListener("mousedown", onViewer1MouseDown, true);
    container1.addEventListener("mousemove", onViewer1MouseMove, true);
    container1.addEventListener("mouseup", onViewer1MouseUp, true);
    container1.addEventListener("touchstart", onViewer1TouchStart, true);
    container1.addEventListener("touchmove", onViewer1TouchMove, true);
    container1.addEventListener("touchend", onViewer1TouchEnd, true);

    // Listen for mouse events on viewer 2
    container2.addEventListener("mousedown", onViewer2MouseDown, true);
    container2.addEventListener("mousemove", onViewer2MouseMove, true);
    container2.addEventListener("mouseup", onViewer2MouseUp, true);
    container2.addEventListener("touchstart", onViewer2TouchStart, true);
    container2.addEventListener("touchmove", onViewer2TouchMove, true);
    container2.addEventListener("touchend", onViewer2TouchEnd, true);

    console.log("[RotationSync] Enabled");
}

function cleanupRotationSync() {
    const container1 = document.getElementById("compare-container-1");
    const container2 = document.getElementById("compare-container-2");

    if (container1) {
        container1.removeEventListener("mousedown", onViewer1MouseDown, true);
        container1.removeEventListener("mousemove", onViewer1MouseMove, true);
        container1.removeEventListener("mouseup", onViewer1MouseUp, true);
        container1.removeEventListener("touchstart", onViewer1TouchStart, true);
        container1.removeEventListener("touchmove", onViewer1TouchMove, true);
        container1.removeEventListener("touchend", onViewer1TouchEnd, true);
    }

    if (container2) {
        container2.removeEventListener("mousedown", onViewer2MouseDown, true);
        container2.removeEventListener("mousemove", onViewer2MouseMove, true);
        container2.removeEventListener("mouseup", onViewer2MouseUp, true);
        container2.removeEventListener("touchstart", onViewer2TouchStart, true);
        container2.removeEventListener("touchmove", onViewer2TouchMove, true);
        container2.removeEventListener("touchend", onViewer2TouchEnd, true);
    }

    if (syncRotationTimer) {
        clearInterval(syncRotationTimer);
        syncRotationTimer = null;
    }

    console.log("[RotationSync] Disabled");
}

let isViewer1Rotating = false;
let isViewer2Rotating = false;

function onViewer1MouseDown(e) {
    isViewer1Rotating = true;
    syncCameraState(compareViewers.mol1, compareViewers.mol2);
}

function onViewer1MouseMove(e) {
    if (isViewer1Rotating && rotateSyncEnabled) {
        if (syncRotationTimer) clearTimeout(syncRotationTimer);
        syncRotationTimer = setTimeout(() => {
            syncCameraState(compareViewers.mol1, compareViewers.mol2);
        }, 16); // ~60fps
    }
}

function onViewer1MouseUp(e) {
    isViewer1Rotating = false;
}

function onViewer1TouchStart(e) {
    if (e.touches.length > 0) {
        isViewer1Rotating = true;
        syncCameraState(compareViewers.mol1, compareViewers.mol2);
    }
}

function onViewer1TouchMove(e) {
    if (isViewer1Rotating && rotateSyncEnabled && e.touches.length > 0) {
        if (syncRotationTimer) clearTimeout(syncRotationTimer);
        syncRotationTimer = setTimeout(() => {
            syncCameraState(compareViewers.mol1, compareViewers.mol2);
        }, 16);
    }
}

function onViewer1TouchEnd(e) {
    if (e.touches.length === 0) {
        isViewer1Rotating = false;
    }
}

function onViewer2MouseDown(e) {
    isViewer2Rotating = true;
    syncCameraState(compareViewers.mol2, compareViewers.mol1);
}

function onViewer2MouseMove(e) {
    if (isViewer2Rotating && rotateSyncEnabled) {
        if (syncRotationTimer) clearTimeout(syncRotationTimer);
        syncRotationTimer = setTimeout(() => {
            syncCameraState(compareViewers.mol2, compareViewers.mol1);
        }, 16);
    }
}

function onViewer2MouseUp(e) {
    isViewer2Rotating = false;
}

function onViewer2TouchStart(e) {
    if (e.touches.length > 0) {
        isViewer2Rotating = true;
        syncCameraState(compareViewers.mol2, compareViewers.mol1);
    }
}

function onViewer2TouchMove(e) {
    if (isViewer2Rotating && rotateSyncEnabled && e.touches.length > 0) {
        if (syncRotationTimer) clearTimeout(syncRotationTimer);
        syncRotationTimer = setTimeout(() => {
            syncCameraState(compareViewers.mol2, compareViewers.mol1);
        }, 16);
    }
}

function onViewer2TouchEnd(e) {
    if (e.touches.length === 0) {
        isViewer2Rotating = false;
    }
}

function syncCameraState(sourceViewer, targetViewer) {
    if (!sourceViewer || !targetViewer) return;

    try {
        // Extract camera state from source
        const camera = sourceViewer.getCamera();
        if (!camera) return;

        // Apply to target viewer
        targetViewer.setCamera(camera);
        targetViewer.render();
    } catch (err) {
        console.warn("[RotationSync] Error syncing camera:", err.message);
    }
}

function generateComparisonReport() {
    const mol1 = compareMolData.mol1;
    const mol2 = compareMolData.mol2;

    if (!mol1 || !mol2) {
        alert("Please load both molecules first");
        return;
    }

    if (!window.jspdf) {
        alert("PDF library not available");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFillColor(5, 8, 16);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(11, 244, 200);
    doc.rect(0, 0, 210, 4, "F");

    // Title
    doc.setTextColor(11, 244, 200);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Molecular Comparison Report", 18, 22);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text("MolecularAI Laboratory Bench", 18, 29);

    // Divider
    doc.setDrawColor(11, 244, 200);
    doc.setLineWidth(0.3);
    doc.line(18, 33, 192, 33);

    let y = 44;

    // Molecule 1
    doc.setTextColor(11, 244, 200);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Molecule 1:", 18, y);
    y += 6;

    doc.setTextColor(226, 232, 240);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${mol1.name}`, 20, y);
    y += 5;
    doc.text(`Formula: ${mol1.formula}`, 20, y);
    y += 5;
    doc.text(`Mass: ${mol1.mass} g/mol`, 20, y);
    y += 5;
    doc.text(`IUPAC: ${mol1.iupac.substring(0, 60)}...`, 20, y);
    y += 8;

    // Molecule 2
    doc.setTextColor(11, 244, 200);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Molecule 2:", 18, y);
    y += 6;

    doc.setTextColor(226, 232, 240);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${mol2.name}`, 20, y);
    y += 5;
    doc.text(`Formula: ${mol2.formula}`, 20, y);
    y += 5;
    doc.text(`Mass: ${mol2.mass} g/mol`, 20, y);
    y += 5;
    doc.text(`IUPAC: ${mol2.iupac.substring(0, 60)}...`, 20, y);
    y += 8;

    // Footer
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 18, 288);

    doc.save("molecular_comparison.pdf");
}




