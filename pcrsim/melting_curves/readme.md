The code and documentation in this subdirectory was all written by chatGPT, to experiment with "vibe coding".

The "dna_melting_curve_simulator_nearest_neighbor.html" app uses nearest-neighbor thermodynamics with a sliding window to smooth the estimated melting temperature for neighborhoods along the sequence.

For the "dna_melting_deriv_hmm_app.html" app, I asked chatGPT to try to compute a melting curve using nearest neighbor thermodynamics together with the Viterbi algorithm to find the most likely state of each base pair at a given temperature, depending on the melting state of its neighbors. 
ChatGPT also wrote the accompanying user manual, including references. I believe this is a novel approach to simulating a melting curve, and ChatGPT agrees, but if we stole your idea please let me know!

This is a work in progress, and these approaches have not yet been compared to experimental results.

The goal is to devlop melting curve simulation code suitable for use in the quantitative PCR simulation.
