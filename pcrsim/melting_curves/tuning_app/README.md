# Testing and tuning app for DNA melting simulation

Files in this folder:

* `meltingLib.js`: Library of DNA melting-related functions. This version includes an implementation of the 'Polymer' algorithm from DECIPHER meltDNA, modified to allow empirical adjustment of [Mg++] and DNA concentrations. **It may be out of sync with other copies in this repo.**
* `meltDNA_ref_curves.js`: a set of simulated DNA sequences and their melting curves, as computed with the meltDNA function from the DECIPHER package
* `create_meltDNA_reference_curve_dataset.Rmd`: The R code to generate the meltDNA reference curves.
* `Phongroop_ref_curves.js`: reference curves for the empirical melting curves from the paper by Phongroop et al.
* `melting_tuner.html`: a testing app for comparing simulated curves to reference curves.
* `DeltaTm_harness.html`: ChatGPTs app to compare curves simulated with our Javascript port of the Polymer algorithm and the reference curves computed with meltDNA.
* `Specs.md`: requirements specification document generated with ChatGPT divided into a series of minor versions with a Codex prompt for each.


