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
    toc: true
    toc-depth: 3
    toc-location: left
---

# Project Management and Software Specification

## 1. Overview
This project produces **three interrelated JavaScript deliverables** for simulating and analyzing DNA melting curves, each targeting a distinct educational or analytical role:

1. **Teaching App** – Interactive and configurable, used for classroom instruction and demonstrations.
2. **Testing & Tuning App** – Parameter fitting tool to tune simulation algorithms against reference data, with built-in optimization using **hpjs**.
3. **Shared Code Library** – Reusable computation and data-generation functions used by both apps.

The work is part of the *cybertoryTNG* ecosystem and will be implemented entirely client-side using **JavaScript**, **HTML**, and **CSS**, with optional **Web Workers** for computational tasks. All visualization will use **D3.js** for precise pedagogical control.

---

## 2. Deliverables

### 2.1 Teaching App

**Purpose:** An interactive, configurable simulation environment for teaching DNA melting behavior.

**Key Features:**

- Teacher configuration interface or JSON config file for customizing lessons.
- Modes for basic, comparative, and dataset-generation use cases.
- Sequence input or automatic generation with defined GC content.
- Dynamic D3.js visualization of melting curves and first derivatives.
- Difference curves and multi-curve comparisons.
- Export of plots and datasets for offline use.

**Educational Use Cases:**

1. **Teaching basic melting curves** – Show dsDNA vs ssDNA, fraction melted, and derivative curves.
2. **Virus strain identification** – Based on **Figure 1 from [PMC11003490](https://pmc.ncbi.nlm.nih.gov/articles/PMC11003490/)**, comparing variant and reference melting curves.
3. **Simulated dataset generation** – Create synthetic sequences and compute Tm under variable conditions for ML or statistical modeling.

**Outputs:** Interactive plots, configurable views, and downloadable datasets.

---

### 2.2 Testing and Tuning App

**Purpose:** Tune and validate melting simulation parameters to best match reference datasets.

**Functionality:**

- Load multiple reference melting curves (JSON/CSV), each with sequence, conditions, and temperature–fraction data.
- Generate simulated curves using algorithms from the shared library.
- Compute a fit error (e.g., RMSE, MAE) for each dataset.
- Invoke an optimizer (e.g., **hpjs**) to minimize global error across all references.
- Visualize fitting progress and parameter convergence.

**Outputs:**

- Best-fit parameter sets for each algorithm.
- Summary report of fit quality.
- Exportable configuration for reuse in the Teaching App.

---

### 2.3 Shared Code Library

**Purpose:** Modular, reusable computational engine for melting curve simulation and data manipulation.

**Modules:**

1. **Simulation Algorithms:**
   - *Sigmoid model* – Simplified logistic approximation.
   - *Transfer-matrix model* – Per-base probabilities via statistical mechanics.
   - *Partition-function DP model* – Ensemble base-pair probabilities.
   - *HMM model* – Pedagogical per-base melting.
2. **Thermodynamic Utilities:**
   - *Nearest-neighbor thermodynamics (SantaLucia, 1998)* for ΔH°, ΔS°, ΔG° estimation.
   - *Ionic Correction Functions* to adjust thermodynamic predictions for ionic conditions using empirical relationships (Owczarzy et al., 2004; 2008; and others).
3. **Helper Functions:**
   - Derivative computation (dF/dT).
   - Difference curves and RMSE metrics.
   - Sequence generation (length, GC content).
4. **Optimization Utilities:**
   - Unified interface to **hpjs** for parameter search.
5. **Export Tools:**
   - CSV/JSON data output for experimental comparisons.

**Ionic Corrections Notes:**

- Algorithms may apply or bypass ionic corrections depending on fidelity and performance goals.
- Example correction strategies implemented as independent functions:
  - `convertMgToNaEquivalent([Mg], [Na])` — empirical equivalence (approximate, valid for low [Mg²⁺]).
  - `owczarzy2008Correction(TmNa, [Mg], [Mon])` — polynomial/logarithmic correction per Owczarzy et al. (2008).
  - `ionicStrengthCorrection([Na], [K], [Mg], [Tris])` — general ionic strength approximation.
- Simulation algorithms may invoke these corrections before computing ΔG°, ΔH°, and ΔS° or omit them for pedagogical simplicity.
- Each correction function documents its domain of validity (e.g., invalid for high [Mg²⁺], mixed solvents, or complex structures).

---

## 3. Integration and Architecture

| Component | Depends On | Provides For |
|------------|-------------|--------------|
| Teaching App | Shared Library | Classroom instruction and demonstrations |
| Testing & Tuning App | Shared Library, hpjs | Researchers, educators, and algorithm developers |
| Shared Library | None | Both apps and future projects |

**Data Flow Summary:**

1. Input parameters and DNA sequence → computation module.
2. Simulation → returns array of {T, F(T)}.
3. Visualization (D3.js) renders results interactively.
4. Optimizer (hpjs) refines algorithm parameters when applicable.

---

## 4. Implementation Plan

The project will be completed in **six weeks** by three parallel teams, one per deliverable. Teams will coordinate weekly to maintain compatibility.

| Team | Roles | Core Responsibilities | Timeline |
|------|--------|-----------------------|-----------|
| **Teaching App Team** | Teaching App Dev Lead; Exercise Developer & Documentarian | Build interactive D3.js app; design and document example exercises. | Weeks 1–6 |
| **Testing & Tuning App Team** | Testing App Dev; Testing Data Guru | Implement hpjs optimization; gather and validate reference data. | Weeks 1–6 |
| **Library Team** | Algorithm Developer | Implement algorithms and utilities; ensure API compliance. | Weeks 1–3 (core), support through week 6 |

---

## 5. Milestones

| Week | Deliverable | Responsible Team |
|-------|--------------|------------------|
| **1** | Repository scaffolding and Standard Simulation API defined | All |
| **2** | Shared Library core implemented (Sigmoid, Transfer-Matrix) | Library |
| **3** | Teaching App prototype integrated with library | Teaching |
| **4** | Tuning App prototype integrated with hpjs and dataset loader | Testing & Tuning |
| **5** | Exercise examples complete; algorithms refined | Teaching, Library |
| **6** | Final testing, documentation, and GitHub Pages deployment | All |

---

## 6. Evaluation Criteria

| Category | Evaluation Metrics | Responsible Team(s) |
|-----------|-------------------|---------------------|
| **Functionality & Accuracy** | Correctness of simulation outputs; optimizer convergence. | Library, Testing |
| **Pedagogical Value** | Educational clarity and engagement of Teaching App exercises. | Teaching |
| **Configurability** | Flexibility of UI and parameter customization. | Teaching, Library |
| **Documentation Quality** | Completeness of exercises, guides, and inline docs. | Teaching |
| **Code Quality** | Modular, documented, and reusable code with consistent API. | All |
| **Performance & Responsiveness** | Efficient computation and smooth visualization. | Library, Teaching |
| **Data Management** | Integrity and reproducibility of reference datasets. | Testing & Tuning |
| **Collaboration** | On-time deliverables and cross-team communication. | All |

---

## 7. Team Roles and Task Breakdown

| Role | Team | Primary Responsibilities |
|------|-------|---------------------------|
| **Teaching App Dev Lead** | Teaching App | Develops D3.js teaching interface; integrates with library. |
| **Exercise Developer & Documentarian** | Teaching App | Creates example exercises; writes documentation and guides. |
| **Testing App Dev** | Testing & Tuning | Builds optimization interface; manages hpjs workflows. |
| **Testing Data Guru** | Testing & Tuning | Curates reference datasets; formats and validates data. |
| **Algorithm Developer** | Library | Implements algorithms and thermodynamic utilities; maintains Standard Simulation API. |

**Coordination:**

- Weekly integration meetings synchronize progress.
- The Library Team provides early algorithm builds for app integration.
- Teaching and Testing teams supply feedback for improvements.
- All teams share a GitHub repository for version control, code review, and milestones.

---

## 8. Summary

This project unites algorithm development, data analysis, and educational visualization into a coherent toolset for exploring DNA melting behavior. With three coordinated teams and a six-week schedule, the project will deliver scientifically accurate simulations, effective teaching modules, and a robust shared code base for future extensions.

---

## Appendix A: Simulation Algorithms and Implementation Guides

This appendix summarizes the **melting curve simulation algorithms** included in the shared library (nearest-neighbor thermodynamics is treated separately as a utility). Each entry includes a reference, conceptual overview, pseudocode, a Codex prompt (with citation + pseudocode + requirements), and a short **Tunable Parameters** section. All functions conform to the **Standard Simulation API**.

### A.1 Simple Sigmoidal Melting Model

**Purpose:** Fast, pedagogical approximation.

**Concept:** Logistic function of temperature to approximate the melt transition.

**Pseudocode:**
```text
for each T in temperatures:
  f = 1 / (1 + exp(-k*(Tm - T)))
  push({T, f})
```

**Codex Implementation Prompt:**
```text
# Reference
Educational logistic sigmoid approximation for DNA melting.

# Task
Implement `simulateSigmoidMelting({ sequence, temperatures, conditions, params })` conforming to the Standard Simulation API.

# Algorithm Outline (pseudocode)
for (const T of temperatures):
  const f = 1 / (1 + Math.exp(-params.k * (params.Tm - T)))
  fractionMelted.push(f)
return { temperatures, fractionMelted }

# Requirements
- Inputs follow the Standard Simulation API.
- Ignore sequence in computation (pedagogical model), but accept it for API consistency.
- `conditions.scale` indicates °C vs K; document assumption.
```
**Tunable Parameters:** `params.k` (slope), `params.Tm` (center).

---

### A.2 Transfer-Matrix Statistical Mechanics Model (Michoel, 2006)
**Reference:** Michoel T. et al. (2006) *Phys. Rev. E* 73:011908.

**Purpose:** Per-base open probabilities via a two-state, nearest-neighbor-coupled transfer matrix.

**Pseudocode:**
```text
F[0]=init; for i=1..N: F[i]=M(i)*F[i-1]
B[N]=init; for i=N-1..0: B[i]=M(i+1)^T*B[i+1]
Z = sum_states F[i]*B[i]
P_open[i](T) = (F[i]_open * B[i]_open) / Z
F(T) = average_i P_open[i](T)
```

**Codex Implementation Prompt:**
```text
# Reference
Michoel T. et al. (2006) Phys. Rev. E 73:011908 — transfer-matrix model for DNA denaturation.

# Task
Implement `simulateTransferMatrix({ sequence, temperatures, conditions, params })` using the Standard Simulation API, returning `fractionMelted` and optional `perBase`.

# Algorithm Outline (pseudocode)
for each T:
  build temperature-dependent 2x2 local matrices M_i(T) from stacking/free energy parameters
  forward/backward passes to get F[i], B[i]
  compute P_open[i] and F(T)
return { temperatures, fractionMelted: F, perBase: P_open_over_T }

# Requirements
- Use ΔG(T)=ΔH−TΔS from nearest-neighbor thermodynamics + ion corrections (utility module).
- `params` may include cooperativity, stacking energies, and numerical stabilization options.
```
**Tunable Parameters:** `cooperativity`, `stacking_energies`, `entropy_penalty`.

---

### A.3 Dynamic-Programming Partition-Function Algorithm (Chitsaz et al., 2009)
**Reference:** Chitsaz H. et al. (2009) *Bioinformatics* 25(12):i365–i373.

**Purpose:** Ensemble partition function to obtain base-pair probabilities; derive F(T).

**Pseudocode (simplified duplex case):**
```text
for len=1..N: for i: j=i+len:
  Z[i,j] = Z[i+1,j] + Z[i,j-1] - Z[i+1,j-1]
  if can_pair(i,j):
    Z[i,j] += exp(-E(i,j)/RT) * (1 + sum_over_k Z[i+1,k-1]*Z[k+1,j-1])
P[i,j] = exp(-E(i,j)/RT) * Z[i+1,j-1] / Z[1,N]
P_open[i] = 1 - sum_j P[i,j]
F(T) = average_i P_open[i]
```

**Codex Implementation Prompt:**
```text
# Reference
Chitsaz H. et al. (2009) Bioinformatics 25(12):i365–i373 — DP partition function for interacting nucleic acids.

# Task
Implement `simulatePartitionFunction({ sequence, temperatures, conditions, params })` per the Standard Simulation API, returning `fractionMelted` and optional `perBase`.

# Algorithm Outline (pseudocode)
for each T:
  fill DP tables for partition sums using ΔG(T)
  compute base-pair probabilities and P_open[i]
  compute F(T) as average open probability
return results

# Requirements
- Use nearest-neighbor thermodynamics + ion corrections from the utility module to compute ΔG(T).
- Provide a cutoff for sequence length and O(N^2) memory management.
```
**Tunable Parameters:** `energy_scale`, `temperature_offset`, `max_loop_length` (if modeled).

---

### A.4 Hidden Markov Model for Base-by-Base Melting (Horton)
**Purpose:** Pedagogical per-base melting with cooperative transitions.

**Pseudocode:**
```text
for each T:
  alpha = forward(seq, A(T), E(T))
  beta  = backward(seq, A(T), E(T))
  P_open[i](T) = normalize(alpha[i,open]*beta[i,open])
F(T) = average_i P_open[i](T)
```

**Codex Implementation Prompt:**
```text
# Reference
Horton educational HMM for DNA melting — two-state model.

# Task
Implement `simulateHMM({ sequence, temperatures, conditions, params })` per the Standard Simulation API.

# Algorithm Outline (pseudocode)
for each T in temperatures:
  build transition matrix A(T) using cooperativity and ΔG(T)
  build emission E(T)
  run forward/backward to get P_open[i]
  compute F(T)
return { temperatures, fractionMelted, perBase }

# Requirements
- Two hidden states: helical/melted; transitions depend on temperature and cooperativity.
- Accept `params` with { cooperativity, p_hm0, p_mh0, emission_scalars }.
```
**Tunable Parameters:** `p_hm`, `p_mh`, `cooperativity_constant`, `emission_mean`, `emission_sigma`.

---

### Communicating the Standard Simulation API to Codex

When asking Codex (or another code generation model) to implement a melting simulation algorithm, always include these instructions verbatim at the start of the prompt:

```text
# Standard Simulation API Specification
All simulation functions must conform to this interface:

function simulateAlgorithm({
  sequence,               // string: DNA sequence (5'→3')
  temperatures,           // number[]: list of temperatures (°C or K)
  conditions,             // object: { scale: 'C'|'K', Na: mM, Mg: mM, ... }
  params,                 // object: algorithm-specific parameters
  options                 // object: { returnPerBase?: boolean, seed?: number }
}) → {
  temperatures: number[],               // returned temperature array
  fractionMelted: number[],             // overall melt fraction per temperature
  perBase?: number[][]                  // optional base-by-base probabilities
}

# Implementation Requirements
- Input and output objects must exactly match the specification above.
- The function name must begin with `simulate` followed by the algorithm name.
- Include JSDoc comments describing arguments and return types.
- Ensure that temperatures and fractions are equal-length arrays.
- If per-base data are unavailable, omit the `perBase` field.
- Return values should be easily serializable to JSON.
```

Provide this header before any algorithm-specific instructions so Codex always generates compatible code.

---

### Notes

- **Nearest-neighbor thermodynamics (SantaLucia, 1998) + ion corrections (Owczarzy, 2008)** are implemented in a separate **Thermodynamic Utilities** module shared by all algorithms; they are **not** melting algorithms themselves.
- All melting algorithms must call the same utility functions for thermodynamic parameters and ionic corrections to maintain consistency across simulations.
- Parameter tuning functions (hpjs-based) can adjust algorithm-specific parameters but should leave global constants (e.g., gas constant R, reference temperature) unchanged.
- Document versioning and metadata for each algorithm will be maintained within the shared library, ensuring reproducibility and traceability of results.

---

**End of Document**
