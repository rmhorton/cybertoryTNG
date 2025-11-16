---
title: "DNA Melting Curve Simulation"
author: "Robert Horton"
code-fold: true
code-summary: "Show the code"
editor: source
format:
  html:
    toc: true
    toc-depth: 3
    toc-location: left
---

# DNA Melting Curve Simulation Project Management Plan 
## Focus Period: Weeks 9–11 (Nov–Dec 2025)

---

## 1. Project Status (Start of Week 9)

- **Testing App** and **Shared Library** are completed or near-complete. Remaining polish and any final fixes will be handled by the **Library and Testing Dev**.
- The **Polymer** DNA melting algorithm is validated and performs extremely well. It was taken directly from the reference simulator and closely matches simulated reference curves. No further tuning of this algorithm is required.
- Experimental datasets to be used for validation:
  1. **PhiX174** sequencing and melting curve (5.3 kb phage genome).
  2. **Phongroop et al. (2023)**: 99 bp amplicons.
- Major remaining objectives (Weeks 9–11):
  1. Compare Polymer simulations with experimental datasets.
  2. Develop two sets of student exercises.
  3. Add features to support those exercises in **Teaching App**.
  4. Produce comprehensive documentation.

---

## 2. Project Roles

- **Teaching App Product Manager** — Oversees app vision, ensures pedagogical alignment, coordinates team.
- **Teaching App Dev** — Implements Teaching App feature updates, UI/UX polish, instructional components.
- **Data Wrangler** — Extracts, digitizes, cleans, and formats experimental melting curves; handles DNA sequence retrieval, preprocessing, and **multiple sequence alignments (MSAs)** for viral and other sequence-based workflows.
- **Exercise Author** — Designs student exercises, learning pathways, and instructional assessments.
- **Library and Testing Dev** — Maintains testing app, shared library, simulation correctness, and handles Polymer algorithm comparisons.

---

## 3. Remaining Tasks (Weeks 9–11)

### 3.1 Simulation vs Experimental Data
**Responsible:** Library and Testing Dev, Data Wrangler

**Objectives:**

- Format the experimental results as reference curves that can be imported into the testing app.
- Use Polymer simulator to generate predicted curves for the sequences present in the experimental datasets.
- Compare simulated and experimental melting curves using quantitative and visual metrics.
- Document mismatches, noise sources, and expected limitations.

**Deliverables:**

- Cleaned experimental datasets in reference curve format.
- Comparison plots and error summaries.
- Documentation describing how well the simulation matches real experimental data.

---

### 3.2 Student Exercises
**Responsible:** Exercise Author (with review by Product Manager & Library/Testing Dev)

**Exercises to create:**

1. **Intro to DNA Melting Curves** — Students learn how melting curves are generated, interpreted, and used.
2. **Virus Strain Identification via Melting Curves** — Students use melting‑curve differences to identify sequence variants.

**Expanded plan for Virus Strain Identification exercise:**

- The **Data Wrangler** investigates the NCBI Influenza Virus Alignment tool:
  https://www.ncbi.nlm.nih.gov/genomes/FLU/Database/nph-select.cgi#mainform
  to generate multiple sequence alignments (MSAs) of viral variants.

- The exercise will be based on a curated set of aligned sequences representing **amplicons** amplified from multiple strains.

- To ensure the task is approachable for students, the selected variant set should have **melting curves that differ in easily detectable ways**.

- Process for selecting strains:
  - Begin with a large collection of strain candidate sequences.
  - For each candidate sequence, compute the simulated melting curve using the Polymer model.
  - Measure similarity between melting curves using **RMSE** as the distance metric.
  - Perform **clustering** on the melting curves (e.g., hierarchical clustering or k‑means) using the RMSE matrix.
  - Select representative strains from **well‑separated clusters**, ensuring strong curve‑level differences.
  - Choose groups with clearly distinguishable melting features to modulate exercise difficulty.

- Outcome for students:
  - Given a set of unknown melting curves, students match them to the correct viral strain based on curve shape and derived metrics.
  - Advanced versions may include noise, partial curves, or ambiguous clusters.

**Deliverables:**

- Full exercise text, datasets, expected student outputs.
- Instructor notes.

---

### 3.3 App Feature Additions & Polish (Teaching App)
**Responsible:** Teaching App Dev, Teaching App Product Manager

**Features to add:**

- **Sequence Simulation Module** using logic from the RMarkdown file:  
  `test_data/create_meltDNA_reference_curve_dataset.Rmd`

- **Strain Identification Workflow**, including:
  - ability to load curated viral strain panels,
  - display and compare melting curves,
  - interface for matching unknown curves to strain candidates,
  - optional difficulty modes based on cluster separation.

- **In-app instructional UI**, including:
  - tutorial steps,
  - embedded explanations,
  - quizzes or interactive checks-for-understanding for both exercises.

- **General UI polish** and integration of new features.

**Deliverables:**

- Updated Teaching App with simulation, strain-identification workflow, exercise support, and help/instructions.
- Internal testing report.

---

### 3.4 Documentation
**Responsible:** Library and Testing Dev (lead), Teaching App Product Manager, Exercise Author

**Required documentation:**

- Intro to DNA melting curves for distinguishing amplicons.
- How to use the software (Teaching App + library).
- How to complete the exercises.
- Guide: *How to use LLMs in a collaborative software project*.

**Deliverables:**

- Markdown/RMarkdown documentation integrated into repository.
- Screenshots, figures, code examples.

---

## 4. Week-by-Week Plan

### **Week 9 (Nov 17–23, 2025)
**Team Meeting:** *Tuesday, Nov 18*

**Focus:** Begin data comparison, outline exercises, start app feature specs.

**Planned Outcomes:**

- Data Wrangler: Import, digitize, and format PhiX174 & Phongroop curves; **begin investigating Influenza viral sequences** and explore the NCBI Influenza Virus Alignment tool to generate preliminary MSAs for strain selection.
- Library/Testing Dev: Generate Polymer simulations for those sequences and produce visual overlays; begin computing melting curves for viral MSA candidates.
- Exercise Author: Create outlines for both exercises, including preliminary structure for the Virus Strain Identification workflow.
- Teaching App Dev: Identify UI requirements for sequence simulation, quiz integration, and strain-identification workflow support.
- Documentation: Begin writing *Introduction to DNA Melting Curves*. *Introduction to DNA Melting Curves*.

---

### **Week 10 (Nov 24–30, 2025)
**Team Meeting:** *Tuesday, Nov 25*

**Focus:** Heavy development + writing week.

**Planned Outcomes:**

- Simulation comparison refined with metrics and polished plots.
- Data Wrangler & Library/Testing Dev: Compute melting curves for a wide set of viral candidates; produce RMSE distance matrix; run clustering to select pedagogically appropriate strains.
- Exercises: Full drafts ready (text, instructions, datasets, assessment items), including curated strain panels for Virus Strain Identification.
- Teaching App Dev: Implement sequence simulation module; begin integrating instructional UI and strain‑matching workflow.
- Product Manager: Review UX, coordinate iteration.
- Documentation expanded to include software usage, exercise instructions, and viral‑strain workflow details. to include software usage and exercise instructions.

---

### **Week 11 (Dec 1–7, 2025)
**Team Meeting:** *Tuesday, Dec 2*

**Focus:** Finalization, integration, polishing, release packaging.

**Planned Outcomes:**

- Simulation comparison completed and documented.
- Final exercise materials tested and polished, including the Virus Strain Identification dataset, clustering explanation, and curated strain set.
- Teaching App finalized with all necessary features, including strain‑identification UI elements and cleaned‑up interface.
- Documentation complete and integrated into GitHub, including full viral workflow and sequence‑selection rationale.
- End-of-project summary and release instructions..

---

## 5. Risks & Mitigation

- **Experimental data formatting issues** → Early Week 9 focus on preprocessing.

- **Influenza strain MSA retrieval difficulties** → Data Wrangler will begin NCBI tool exploration early in Week 9; fallback: use curated public datasets if tool is unavailable.

- **Clustering-based strain selection may yield insufficiently distinct melting curves** → Use larger candidate pool; adjust RMSE thresholds; allow Exercise Author & Dev to tune difficulty by selecting clusters with clear separation.

- **Time pressure on instructional UI and strain-identification workflow** → Prioritize minimal viable version of tutorial, quiz features, and strain-matching interface.

- **Documentation overload** → Build documentation continuously across Weeks 9–11.

- **Sequence simulation complexity** → Use existing tested logic from the RMarkdown generator to minimize new bugs and ensure consistency across simulated viral amplicons.** → Use existing tested logic from the RMarkdown generator to minimize new bugs.

---

## 6. Success Criteria by End of Week 11

- Polymer algorithm validated against both experimental datasets.

- Two fully developed student exercises ready for instructional deployment, **including a complete Virus Strain Identification workflow** with:
  - MSA-derived viral amplicon sequences,
  - melting-curve simulations,
  - RMSE-based curve clustering,
  - curated strain panels chosen for pedagogical clarity.

- Teaching App supports all exercise workflows and includes:
  - sequence simulation,
  - instructional UI,
  - quiz or assessment components,
  - **strain-identification interface** for matching melting curves to viral variants.

- Complete documentation covering:
  - DNA melting curve fundamentals,
  - how to use the Teaching App and library,
  - how to perform both exercises,
  - **details of the viral workflow (MSA import, curve clustering, strain selection)**,
  - the role of LLMs in the project.

- All materials published in the GitHub repository, ready for use in teaching.

---

## 7. Immediate Next Steps (Start of Week 9)

- Data Wrangler finishes digitizing the two experimental curve sources and formatting them as reference curves.
- **Data Wrangler begins investigating Influenza viral sequences and exploring the NCBI Influenza Virus Alignment tool to generate preliminary multiple sequence alignments for candidate strains.**
- Library and Testing Dev loads the experimentally derived reference curves into the Testing App and compares them to the Polymer simulations; begins computing melting curves for preliminary viral candidates.
- Exercise Author drafts learning objectives and outlines for both exercises, including the viral-strain identification workflow.
- Product Manager drafts design notes for required Teaching App features.
- Teaching App Dev generates Codex prompts to implement Teaching App features, including strain-identification components.

**End of Document**
