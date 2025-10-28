---
title: "DNA Melting Curve Simulation"
author: "Robert Horton"
date: today
date-format: "long"
description: ""
image: ""
image-alt: ""
categories: ""
code-fold: true
code-summary: "Show the code"
editor: source
format:
  html:
    toc: true # Enables the table of contents
    toc-depth: 3 # (Optional) Sets the depth of headers to include (e.g., h1, h2, h3)
    toc-location: left # (Optional) Places the table of contents on the left
---

# Project Management and Software Specification

## 1. Project Overview
This project is an educational, client-side **JavaScript web application** that simulates DNA melting curves for PCR and molecular biology instruction. It is part of the *cybertoryTNG* ecosystem and designed for use in teaching laboratories and interactive demonstrations. The app models the fraction of double-stranded DNA that remains hybridized as a function of temperature, sequence composition, and buffer conditions.

### 1.1 Educational Goals
- Visualize DNA melting as a dynamic, probabilistic process.
- Provide an interactive way for students to explore how GC content, salt concentration, and sequence length affect melting temperature (Tm).
- Introduce computational biophysics concepts (nearest-neighbor thermodynamics, HMMs, partition functions).

### 1.2 Scope
The app is fully client-side, using **JavaScript**, **HTML**, and **CSS**, and optionally **Web Workers** for heavy computation. It integrates with other cybertoryTNG components but functions independently.

---

## 2. Example Use Cases

### 2.1 Teaching about Melting Curves
**Primary Learning Objectives:**
- Understand that **double-stranded DNA (dsDNA)** can be distinguished from **single-stranded DNA (ssDNA)** by spectroscopy (e.g., absorbance at 260 nm).
- Recognize that a **melting curve** is a plot of the fraction melted (or equivalently, the fraction remaining double-stranded) versus temperature.
- Observe that **different regions of long DNA molecules melt at different temperatures**, depending on GC content and sequence context.
- Learn that the **first derivative** of the melting curve (dF/dT) accentuates melting transitions, making multi-domain melting behavior visible.

**Interactive Activities:**
- Students adjust temperature and see changes in the fraction melted in real time.
- Display both the melting curve and its derivative side-by-side.
- Compare synthetic sequences of differing GC content.

### 2.2 Identifying a Virus Strain from Simulated Melting Curves
**Scenario:**
Students simulate melting experiments for several viral DNA samples and compare their curves against a reference strain.

**Key Features:**
- Load reference and sample sequences.
- Generate and plot simulated melting curves for each.
- Compute and display **difference curves** (ΔF(T) = F_sample − F_reference).
- Identify characteristic deviations that distinguish strains (e.g., mutations altering local GC content or stability).

**Pedagogical Goal:**
Teach how minor sequence variations affect thermodynamic profiles, and how such profiles can serve as diagnostic fingerprints.

---

## 3. Functional Requirements

### 3.1 Core Simulation Features
- **Input**: DNA sequence(s), salt concentration, and temperature range.
- **Output**: Melting curve plot (fraction bound vs. temperature).
- **Algorithm Options**:
  - Nearest-neighbor (SantaLucia, 1998)
  - HMM-based per-base melt probability (Owczarzy et al., 2008)
  - Empirical sigmoid approximation for teaching mode.
- **Display**:
  - Interactive plot (D3.js or Plotly.js)
  - Real-time adjustable sliders for temperature and buffer composition.
  - Optional per-base probability map heatmap.

### 3.2 Pedagogical Enhancements
- Step-by-step visualization of strand separation.
- Annotation of key thermodynamic parameters (ΔH, ΔS, ΔG).
- “Challenge mode” allowing users to guess or predict Tm.
- Side-by-side comparison of multiple sequences.
- Derivative plot (dF/dT) highlighting distinct melting domains.
- Overlay and difference-curve visualization for comparative studies.

### 3.3 Export and Sharing
- Export data as CSV and plot as PNG.
- Generate reproducible URL with encoded parameters.
- Optional GitHub Pages integration for classroom deployment.

---

## 4. System Architecture

### 4.1 High-Level Overview
- **UI Layer**: HTML/CSS/JS frontend with reactive controls.
- **Computation Layer**: Modular JS functions for thermodynamic calculations; potentially offloaded to a Web Worker.
- **Visualization Layer**: Interactive SVG or Canvas rendering via D3.js.

### 4.2 Data Flow
1. User inputs parameters → validated by controller.
2. Thermodynamic module computes fraction bound vs. temperature.
3. Visualization module renders interactive curve.
4. User adjusts parameters → recompute and update plot in real time.

### 4.3 Dependencies
- `jstat` for numeric and statistical functions.
- `plotly.js` or `d3.js` for charting.
- `math.js` for symbolic and numerical expressions.
- `FileSaver.js` for export functions.

---

## 5. Algorithmic Design

### 5.1 Nearest-Neighbor Model
Implements ΔH and ΔS summations using SantaLucia 1998 parameters for 10 dinucleotide pairs, accounting for helix initiation and terminal corrections.

### 5.2 Partition Function / HMM Model
Computes base-by-base melt probabilities using forward–backward recursion. Optional per-base visualization for advanced users.

### 5.3 Empirical Approximation Mode
For fast classroom demonstration, model the melting curve as a logistic sigmoid:

$$ f(T) = \frac{1}{1 + e^{-k(T_m - T)}} $$

---

## 6. User Interface Design

### 6.1 Layout
- **Top Panel**: Sequence input, salt and concentration sliders.
- **Main Panel**: Interactive melting curve.
- **Side Panel**: Parameter summary and export options.
- **Bottom Bar**: Links to references, documentation, and GitHub.

### 6.2 Interactivity
- Sliders dynamically replot the curve.
- Mouse-over tooltips show local melt fraction.
- Option to freeze curves for comparison.
- Toggle between raw and derivative curves.

### 6.3 Accessibility
- Responsive design for desktop and tablet.
- Color-safe palettes for red-green color blindness.

---

## 7. Implementation Plan

| Phase | Duration | Goals |
|-------|-----------|-------|
| Phase 1 | Week 1–2 | Establish repository structure, UI wireframes, and baseline computation model. |
| Phase 2 | Week 3–4 | Implement nearest-neighbor algorithm and interactive plot. |
| Phase 3 | Week 5–6 | Add HMM/partition-function mode and comparison tools. |
| Phase 4 | Week 7–8 | Polish UI, export features, and documentation. |

---

## 8. Task Assignments

| Role | Student | Responsibilities |
|------|----------|------------------|
| Lead Developer | TBD | Core simulation code, data flow integration. |
| UI/UX Designer | TBD | Layout, controls, interactivity, and accessibility. |
| Visualization Engineer | TBD | Plotting logic and animation. |
| Documentation & QA | TBD | README, comments, and test coverage. |

---

## 9. Testing and Validation

### 9.1 Unit Testing
- Verify ΔH and ΔS summations for all dinucleotide pairs.
- Check partition-function recursion correctness.
- Validate sigmoid fit parameters against simulated data.

### 9.2 Integration Testing
- Ensure UI updates are synchronized with computation results.
- Validate export accuracy (CSV, PNG).

### 9.3 Educational Testing
- Evaluate usability and clarity with pilot students.
- Test pedagogical outcomes for both use cases.

---

## 10. Documentation and References

### 10.1 Primary Literature
- SantaLucia J. (1998). *A unified view of polymer, dumbbell, and oligonucleotide DNA nearest-neighbor thermodynamics.* **PNAS** 95:1460–1465.
- Owczarzy R. et al. (2008). *Predicting stability of DNA duplexes in solutions containing magnesium and monovalent cations.* **Biochemistry** 47:5336–5353.

### 10.2 Related Tools
- MeltSim (Rueda et al., 2004)
- DINAMelt Web Server
- OligoCalc

### 10.3 Future Enhancements
- Incorporate temperature-dependent salt corrections.
- Add RNA hybridization module.
- Extend visualization to multi-domain PCR amplicons.

---

## 11. Repository and Deployment

### 11.1 GitHub Structure
```
pcrsim/
  ├── melting_curves/
  │     ├── index.html
  │     ├── app.js
  │     ├── style.css
  │     ├── thermodynamics.js
  │     ├── visualization.js
  │     ├── readme.md
  │     └── tests/
  ├── shared_utils/
  └── docs/
```

### 11.2 Hosting
- Deployed via GitHub Pages.
- Auto-build workflow with GitHub Actions.

### 11.3 Versioning
- Semantic Versioning (SemVer): `vX.Y.Z`
- Tagged releases for major milestones.

---

## 12. Milestones and Deliverables

| Milestone | Deliverable | Due Date |
|------------|-------------|-----------|
| M1 | Repo initialized, project plan finalized | Week 1 |
| M2 | Prototype NN model & plot | Week 3 |
| M3 | HMM module integrated | Week 6 |
| M4 | Documentation and testing complete | Week 8 |

---

## 13. Evaluation Criteria
- Functionality: Accuracy and performance of simulations.
- Usability: Clear, intuitive, and engaging UI.
- Educational Value: Alignment with teaching objectives.
- Code Quality: Modularity, clarity, and documentation.
- Collaboration: Effective use of GitHub issues, commits, and pull requests.

---

## 14. Summary
This project combines biophysical modeling with interactive visualization to create a hands-on learning experience in molecular thermodynamics. The specification provides a roadmap for the team to deliver a scientifically accurate, visually engaging, and pedagogically valuable simulation tool.
