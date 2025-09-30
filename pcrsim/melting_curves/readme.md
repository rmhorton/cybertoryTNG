# DNA Melting Curves

## Vibe-coding prototypes

The code and documentation in this subdirectory was all written by chatGPT, to experiment with "vibe coding" for prototyping.

* `dna_melting_curve_simulator_nearest_neighbor.html` uses nearest-neighbor thermodynamics with a sliding window to smooth the estimated melting temperature for neighborhoods along the sequence.

* `dna_melting_curve_simulator_nearest_neighbor_HMM_smoothing.html` adds an option to use an HMM for smoothing, still estimating melting temperature over a window.
  
* `dna_melting_deriv_hmm_app.html` computes a melting curve using nearest neighbor thermodynamics together with the Viterbi algorithm to find the most likely state of _each base pair_ at a given temperature, depending on the melting state of its neighbors. 
ChatGPT also wrote the accompanying user manual, including references. I believe this is a novel approach to simulating a melting curve, and ChatGPT agrees, but if we stole your idea please let me know!

This is a work in progress; these approaches have not yet been compared to experimental results.

The goal is to devlop melting curve simulation code suitable for use in the quantitative PCR simulation.

## Student Project: Develop an improved [DNA Melting curve](https://en.wikipedia.org/wiki/Melting_curve_analysis) for the Cybertory [qPCR simulator](https://github.com/rmhorton/cybertoryTNG/tree/main/pcrsim)
The current [prototypes](https://github.com/rmhorton/cybertoryTNG/tree/main/pcrsim/melting_curves) need improvement and testing.
These prototypes all seem to give qualitatively reasonable results, but they have not been evaluated thoroughly, and we should probaby combine parts from several of them in the final version.
None of this work has been integrated into the qPCR simulator yet.
Many of the goals below will require modifying the code, e.g., to support curve fitting or testing. Much of this should be possible using vibe coding.
This application must be coded in Javascript to run client-side in a browser. You do not need to be a Javascript programmer (the LLM will do that part), but you will need to know how to run browser-based apps and access error messages.

### Aspects of the project

Each student is in charge of leading and documenting one aspect of the project, which will be hosted in a repository in their own github account. We will collect the final product here.

* [App](https://github.com/nnpham2-sketch/App-Formation-Task---Melting-Curves-Project): __Natalie__
	- simulation functions (will be re-used in the qPCR simulator as well as in the various UIs) [programmer / molecular biologist] 
	- UIs
		+ specialized for different use cases (high school students, bioinformatics graduate students, research scientists, etc)

* [Documentation](https://github.com/eessanaa): __Elyes__
	- user guide: [molecular biologist / programmer]
		+ technical background about DNA thermodynamics 
		+ use of melting curves in qPCR + etc. 
	- student exercise: [teacher / molecular biologist] 
		+ use specific sequences to show how the software works; this overlaps with the testing task.
		+ Audience:
			~ high school/undergrad: understand how the melting curve relates to different regions of the sequence
			~ graduate: thermodynamics and algorithms
	- conference poster and/or paper?

* [Testing](https://github.com/ananyasathyanarayana/melting-curves-testing-ananya): __Ananya__
	- compare to other estimates (results from other simulators, or experimental observations): [molecular biologist] 
		+ collect test data (sequences in fasta files, associated melting curves in csv files)
		+ modify the app to compare these reference files to the app results
	- tune parameters: [data scientist] 
		+ figure out how to turn comparison into a single numeric error value (eg, RMSE). 
		+ find a parameter (e.g., melted/hybridized transition penalty in HMM) that affects the score. 
		+ run the program over a range of values for this parameter, compute the error score, and try to find a minimum. 
	- try to break the software: [software tester]

* [Vibe coding](https://github.com/jfbenigno): __Jaren__
	- Compare vibe coding systems
	- Notes and experiments on prompt design (How you ask the questions, what to tell the LLM to do)
		+ examples of failure modes and how to prevent them
	- How does LLM generation of code change the approach to software development
		+ Discuss the impact on "feature creep": it is _much_ easier to add features now; how is that good and bad?

## Ideas

* Combine elements from the existing prototypes to get
	+ a better interface
	+ a more suitable melting simulation
* Compare to experimental curves
	+ Collect a set of published melting curves for known DNA sequences.
	+ Export melting curve data from the simulator (or import experimental results into the simulation environment) to make comparisons.
	+ Can we adjust hyperparameters to make the simulated curves fit better?
* The NN/HMM approach used in the third prototype app seems to be novel
	+ Use [Nearest Neighbor thermodynamics](https://en.wikipedia.org/wiki/Nucleic_acid_thermodynamics) to estimate the stability of each base pair
	+ Use a Hidden Markov model (HMM) to assign melted/hybridized state to each base pair and compute fraction melted at each temperature.
	+ This method may be a good fit for bioinformatics classes:
		- The [Viterbi algorithm](https://en.wikipedia.org/wiki/Viterbi_algorithm) used to solve HMMs is an important example of dynamic programming
		- [Biological sequence alignment](https://en.wikipedia.org/wiki/Sequence_alignment) is commonly done with dynamic programming as well.
* Documentation
  + Published melting curves (I can only find really old papers containing these curves; there must (?) be databases for qPCR products...)
  	- phiX174 bacteriophage, from [DNA sequencing and melting curve](https://pmc.ncbi.nlm.nih.gov/articles/PMC382884/pdf/pnas00001-0109.pdf), published in 1978.
  		Here is the sequence of the [PhiX174 bacteriophage](https://www.ncbi.nlm.nih.gov/nuccore/NC_001422.1)
  	- [Comparison of theoretical denaturation maps of ϕX174 and SV40 with their gene maps](https://pmc.ncbi.nlm.nih.gov/articles/PMC327754/pdf/nar00444-0261.pdf)
  	- PBR322 plasmid, from [A study of the reversibility of helix-coil transition in DNA](https://pmc.ncbi.nlm.nih.gov/articles/PMC327413/pdf/nar00409-0159.pdf)
  		("pBR322 DNA was converted into the linear form by restriction endonuclease Pat I")"
  		[Complete sequence](https://www.ncbi.nlm.nih.gov/nuccore/J01749.1) of the [pBR322](https://en.wikipedia.org/wiki/PBR322) cloning vector.
	+ Articles and videos:
		- [Explaining multiple peaks in qPCR melt curve analysis](https://www.idtdna.com/pages/education/decoded/article/interpreting-melt-curves-an-indicator-not-a-diagnosis)
		- [High resolution melt analysis tutorial](https://www.youtube.com/watch?v=y567YuJhSek)
		- [Quantitative PCR -- the melting curve](https://www.youtube.com/watch?v=OAsuG0v-cr4)
* Compare to other simulations
	+ [uMelt](https://www.dna-utah.org/umelt/quartz/um.php) (runs on a website; this has a 1250bp limit on input sequence)
	+ [MeltDNA](https://www.rdocumentation.org/packages/DECIPHER/versions/2.0.2/topics/MeltDNA) from the [DECIPHER](https://bioconductor.org/packages/release/bioc/html/DECIPHER.html) package on Bioconductor. Handles very long sequences.
	+ you should be able to find more
* Explore the limitations of the software
	+ Can you break it?
	+ Can you identify "toxic" inputs?
	+ How does performance scale with sequence length?
* Generate datasets for testing and demonstrations
	+ single-product melting curves that look like mixtures of products.
* Incorporate into qPCR simulator
	+ swap out the existing (simplistic) melting curve logic
	+ add melting curve analysis to student exercises
* Greatly expand the user manual to explain the approach and demonstrate applications / Write a paper!

## Deliverables

* HTML file for a stand-alone melting curve app, with UI.
* JS file for the code to compute the melting curve (this will be reused by the PCR app).
* A user guide (Markdown or HTML) - may include illustrations.
* Word document for a student exercise on melting curves.
