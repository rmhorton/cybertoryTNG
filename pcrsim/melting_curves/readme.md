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

# DNA Melting Curve Simulation Project Management Plan, 
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
- **Data Wrangler** — Extracts, digitizes, cleans, and formats experimental melting curves.
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
2. **Virus Strain Identification via Melting Curves** — Students use melting-curve differences to identify sequence variants.

**Deliverables:**

- Full exercise text, datasets, expected student outputs.
- Instructor notes.

---

### 3.3 App Feature Additions & Polish (Teaching App)
**Responsible:** Teaching App Dev, Teaching App Product Manager

**Features to add:**

- **Sequence Simulation Module** using logic from the RMarkdown file:  
  `test_data/create_meltDNA_reference_curve_dataset.Rmd`
- **In-app instructional UI**, including:
  - tutorial steps,
  - embedded explanations,
  - quizzes or interactive checks-for-understanding.
- **General UI polish** and integration of new features.

**Deliverables:**

- Updated Teaching App with simulation, exercises support, help/instructions.
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

### **Week 9 (Nov 17–23, 2025)**
**Team Meeting:** *Tuesday, Nov 18*

**Focus:** Begin data comparison, outline exercises, start app feature specs.

**Planned Outcomes:**

- Data Wrangler: Import, digitize, and format PhiX174 & Phongroop curves.
- Library/Testing Dev: Generate Polymer simulations for those sequences and produce visual overlays.
- Exercise Author: Create outlines for both exercises.
- Teaching App Dev: Identify UI requirements for sequence simulation & quiz integration.
- Documentation: Begin writing *Introduction to DNA Melting Curves*.

---

### **Week 10 (Nov 24–30, 2025)**
**Team Meeting:** *Tuesday, Nov 25*

**Focus:** Heavy development + writing week.

**Planned Outcomes:**

- Simulation comparison refined with metrics and polished plots.
- Exercises: Full drafts ready (text, instructions, datasets, assessment items).
- Teaching App Dev: Implement sequence simulation module; begin integrating instructional UI.
- Product Manager: Review UX, coordinate iteration.
- Documentation expanded to include software usage and exercise instructions.

---

### **Week 11 (Dec 1–7, 2025)**
**Team Meeting:** *Tuesday, Dec 2*

**Focus:** Finalization, integration, polishing, release packaging.

**Planned Outcomes:**

- Simulation comparison completed and documented.
- Final exercise materials tested and polished.
- Teaching App finalized with all necessary features and cleaned-up UI.
- Documentation complete and integrated into GitHub.
- End-of-project summary and release instructions.

---

## 5. Risks & Mitigation

- **Experimental data formatting issues** → Early Week 9 focus on preprocessing.
- **Time pressure on instructional UI features** → Prioritize minimal viable version of tutorial + quiz features.
- **Documentation overload** → Build documentation continuously across Weeks 9–11.
- **Sequence simulation complexity** → Use existing tested logic from the RMarkdown generator to minimize new bugs.

---

## 6. Success Criteria by End of Week 11

- Polymer algorithm validated against both experimental datasets.
- Two fully developed student exercises ready for instructional deployment.
- Teaching App supports all exercise workflows and includes simulation + instructional UI.
- Complete documentation covering:
  - DNA melting curve fundamentals,
  - How to use the app and library,
  - How to perform the exercises,
  - The role of LLMs in the project.
- All materials published in the GitHub repository, ready for use in teaching.

---

## 7. Immediate Next Steps (Start of Week 9)

- Data Wrangler finishes digitizing the two experimental curve sources and formatting them as reference curves.
- Library and Testing Dev loads the experimentally derived reference curves into the Testing App and compares them to the Polymer simulations.
- Exercise Author drafts learning objectives and outlines.
- Product Manager drafts design notes for required Teaching App features.
- Teaching App Dev generates Codex prompts to implement Teaching App features.

**End of Document**
