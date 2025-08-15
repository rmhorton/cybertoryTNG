The code and documentation in this subdirectory was all written by chatGPT, to experiment with "vibe coding" for prototyping.

* `dna_melting_curve_simulator_nearest_neighbor.html` uses nearest-neighbor thermodynamics with a sliding window to smooth the estimated melting temperature for neighborhoods along the sequence.

* `dna_melting_curve_simulator_nearest_neighbor_HMM_smoothing.html` adds an option to use an HMM for smoothing, still estimating melting temperature over a window.
  
* `dna_melting_deriv_hmm_app.html` computes a melting curve using nearest neighbor thermodynamics together with the Viterbi algorithm to find the most likely state of _each base pair_ at a given temperature, depending on the melting state of its neighbors. 
ChatGPT also wrote the accompanying user manual, including references. I believe this is a novel approach to simulating a melting curve, and ChatGPT agrees, but if we stole your idea please let me know!

This is a work in progress; these approaches have not yet been compared to experimental results.

The goal is to devlop melting curve simulation code suitable for use in the quantitative PCR simulation.
