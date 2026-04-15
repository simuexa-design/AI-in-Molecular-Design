# Molecular AI Laboratory Bench - Setup Guide

## Installation & Setup

### 1. Install Python Dependencies

The website requires a Python backend with RDKit for molecular feature extraction.

#### Windows (PowerShell)

```powershell
# Install required packages
pip install flask flask-cors rdkit

# Or use conda (recommended for RDKit)
conda create -n rdkit-env python=3.10
conda activate rdkit-env
conda install -c conda-forge rdkit flask flask-cors
```

#### macOS / Linux

```bash
# Using conda (recommended)
conda create -n rdkit-env python=3.10
conda activate rdkit-env
conda install -c conda-forge rdkit flask flask-cors

# Or using pip
pip install flask flask-cors rdkit
```

### 2. Run the Backend Server

From the `antigravity` project directory:

```powershell
# Windows
python backend.py
```

```bash
# macOS / Linux
python3 backend.py
```

You should see:
```
Starting Molecular AI Backend Server...
RDKit molecular feature extraction enabled
Server running on http://localhost:5000
```

### 3. Open the Website

Keep the backend running and open the website in your browser:

```
file:///d:/programming languages/antigravity/index.html
```

## Features

### 1. **Molecular Features (RDKit Analysis)**
- **Atom Composition**: Count of each element in the molecule
- **Molecular Descriptors**: 
  - Molar Weight (g/mol)
  - LogP (lipophilicity)
  - TPSA (topological polar surface area)
  - Molar Refractivity
  - Sp³ Fraction
- **Lipinski Rules**:
  - H-bond Donors/Acceptors
  - Rotatable Bonds
  - Aromatic & Aliphatic Rings
  - Saturated Rings
- **Functional Groups**: Detected groups with counts

### 2. **Molecular Properties & Predictions**
- Drug-Likeness (Lipinski's Rule of Five)
- Solubility Prediction
- Toxicity Risk Assessment
- Bioavailability Score

### 3. **3D Molecular Viewer**
- Interactive 3D structure visualization
- Multiple rendering styles (Ball-and-stick, Space-filling, Wire Ribbon)
- Background toggle
- Atom selection for angle calculation

### 4. **Bond Angle Calculator**
- Click 3 atoms to calculate bond angles
- Visual feedback on selection

## API Endpoints

### POST /api/analyze
Analyzes a molecule SMILES string

**Request:**
```json
{
  "smiles": "CCO"
}
```

**Response:**
```json
{
  "success": true,
  "formula": "C2H6O",
  "atoms": {
    "total": 9,
    "heavy": 3,
    "bonds": 8,
    "heteroatoms": 1,
    "composition": {"C": 2, "H": 6, "O": 1}
  },
  "descriptors": {
    "molar_weight": 46.04,
    "log_p": -0.31,
    "tpsa": 20.23,
    ...
  },
  "lipinski": {...},
  "functional_groups": [...]
}
```

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "RDKit Backend"
}
```

## Troubleshooting

### Backend connection error
- Ensure backend is running: `python backend.py`
- Check if port 5000 is available
- Make sure Flask and RDKit are installed

### RDKit installation issues
- Use conda instead of pip when possible
- For Windows, use: `conda install -c conda-forge rdkit`
- Ensure Python 3.8+ is installed

### SMILES analysis fails
- Verify SMILES string is valid at pubchem.ncbi.nlm.nih.gov
- Check browser console for error messages

## Example Molecules

Try these to see different molecular features:

- **Aspirin**: C1=CC=C(C(=C1)C(=O)OC)C(=O)O
- **Caffeine**: CN1C=NC2=C1C(=O)N(C(=O)N2C)C
- **Glucose**: C([C@@H]1[C@H]([C@@H]([C@H](C(=O)O1)O)O)O)O
- **Ethanol**: CCO
- **Morphine**: CNc1ccc2c3ccc4c(O)ccc(c4O3)c2c1

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Viewer**: 3Dmol.js
- **Data**: PubChem API
- **Backend**: Python, Flask
- **Molecular Analysis**: RDKit
- **PDF Export**: jsPDF

## Project Structure

```
antigravity/
├── index.html          # Main website
├── app.js              # Frontend logic
├── style.css           # Styling
├── backend.py          # Python RDKit server
└── README.md           # This file
```
