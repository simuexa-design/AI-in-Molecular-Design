#!/usr/bin/env python3
"""
MOLECULAR AI — RDKit Backend Server
Extracts detailed molecular features from SMILES strings
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski, Crippen, AllChem
from rdkit.Chem import Descriptors3D
import json

app = Flask(__name__)
CORS(app)

def extract_functional_groups(mol):
    """Identify common functional groups in a molecule"""
    if not mol:
        return []
    
    smarts_patterns = {
        "Hydroxyl": "[OX2H]",
        "Carbonyl": "[#6]=[#8]",
        "Carboxylic Acid": "[CX3](=O)[OX2H1]",
        "Ester": "[#6][CX3](=O)[OX2H0]",
        "Amine": "[NX3,NX4]",
        "Amide": "[C,c][CX3](=O)[N]",
        "Sulfhydryl": "[#16X2H]",
        "Disulfide": "[#16X2][#16X2]",
        "Alkene": "[CX3]=[CX3]",
        "Alkyne": "[#6]#[#6]",
        "Benzene": "c:c:c:c:c:c",
        "Halogen": "[F,Cl,Br,I]",
        "Nitrile": "[#6]#[#7]",
        "Sulfone": "[SX4](=O)(=O)",
        "Phosphate": "[#15](=O)(O)(O)O",
    }
    
    functional_groups = []
    for name, smarts in smarts_patterns.items():
        pattern = Chem.MolFromSmarts(smarts)
        if pattern and mol.HasSubstructMatch(pattern):
            matches = mol.GetSubstructMatches(pattern)
            count = len(matches)
            functional_groups.append({"name": name, "count": count})
    
    return functional_groups

def extract_molecular_features(smiles):
    """Extract comprehensive molecular features from SMILES string"""
    try:
        mol = Chem.MolFromSmiles(smiles)
        
        if mol is None:
            return {"error": "Invalid SMILES string"}
        
        # Basic Descriptors
        mw = Descriptors.MolWt(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        
        # Atom Counts
        num_atoms = mol.GetNumAtoms()
        num_heavy_atoms = mol.GetNumHeavyAtoms()
        num_bonds = mol.GetNumBonds()
        
        # Atom composition
        atom_counts = {}
        for atom in mol.GetAtoms():
            symbol = atom.GetSymbol()
            atom_counts[symbol] = atom_counts.get(symbol, 0) + 1
        
        # Lipinski Features
        h_donors = Descriptors.NumHDonors(mol)
        h_acceptors = Descriptors.NumHAcceptors(mol)
        rotatable_bonds = Descriptors.NumRotatableBonds(mol)
        aromatic_rings = Descriptors.NumAromaticRings(mol)
        
        # Molecular Properties
        logp = Crippen.MolLogP(mol)
        tpsa = Descriptors.TPSA(mol)  # Topological Polar Surface Area
        molar_refractivity = Crippen.MolMR(mol)
        
        # Advanced Metrics
        fraction_sp3 = Descriptors.FractionCsp3(mol)
        num_aliphatic_rings = Descriptors.NumAliphaticRings(mol)
        num_saturated_rings = Descriptors.NumSaturatedRings(mol)
        num_heteroatoms = Descriptors.NumHeteroatoms(mol)
        
        # Functional Groups
        functional_groups = extract_functional_groups(mol)
        
        # Topological Features
        num_bridgeheads = Descriptors.NumBridgeheads(mol)
        num_spiro_atoms = Descriptors.NumSpiro(mol)
        
        return {
            "success": True,
            "formula": formula,
            "atoms": {
                "total": num_atoms,
                "heavy": num_heavy_atoms,
                "bonds": num_bonds,
                "heteroatoms": num_heteroatoms,
                "composition": dict(sorted(atom_counts.items()))
            },
            "descriptors": {
                "molar_weight": round(mw, 2),
                "log_p": round(logp, 2),
                "tpsa": round(tpsa, 2),
                "molar_refractivity": round(molar_refractivity, 2),
                "fraction_sp3": round(fraction_sp3, 3)
            },
            "lipinski": {
                "h_donors": h_donors,
                "h_acceptors": h_acceptors,
                "rotatable_bonds": rotatable_bonds,
                "aromatic_rings": aromatic_rings,
                "aliphatic_rings": num_aliphatic_rings,
                "saturated_rings": num_saturated_rings
            },
            "topology": {
                "bridgeheads": num_bridgeheads,
                "spiro_atoms": num_spiro_atoms
            },
            "functional_groups": functional_groups
        }
    
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/analyze', methods=['POST'])
def analyze_molecule():
    """API endpoint to analyze molecular features"""
    data = request.json
    smiles = data.get('smiles', '')
    
    if not smiles:
        return jsonify({"error": "SMILES string required"}), 400
    
    features = extract_molecular_features(smiles)
    return jsonify(features)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "RDKit Backend"})

if __name__ == '__main__':
    print("Starting Molecular AI Backend Server...")
    print("RDKit molecular feature extraction enabled")
    print("Server running on http://localhost:5000")
    app.run(debug=True, port=5000, host='127.0.0.1')
