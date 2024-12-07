// https://stackoverflow.com/questions/16626735/how-to-loop-through-an-array-containing-objects-and-access-their-properties

/*
    primer_iq: an IngredientQuantity object where ingredient is of class DnaMolecule and ingredient.is_primer() is true
    primer_strand: 'top' (matches top strand) or 'bottom' (matches bottom strand, i.e., rc matches top strand)
    template_iq
    template_begin, template_end: base positions where matching region begins and ends
    template_dH, template_dS: enthalpy and entropy for primer binding to template (may include mismatches)
    product_dH, product_dS: enthalpy and entropy for primer binding to product (perfect match)
*/
class PrimerBindingSite{
    
    constructor(primer_iq, template_iq, strand, alignment){
        this.primer_iq = primer_iq
        this.template_iq = template_iq
        this.strand = strand
        this.alignment = alignment
        this.primer_seq = this.primer_iq.ingredient.sequence
        /*
        this.template_begin = alignment.template_begin
        this.template_end = alignment.template_end

        this.primer_dH = alignment.primer_dH
        this.primer_dS = alignment.primer_dS
        this.template_dG55 = alignment.template_dG55
        this.template_dH = alignment.template_dH
        this.template_dS = alignment.template_dS
        */
    }


}


class TemplatePrimerBindingSites{
    constructor(template_iq){
        this.template_iq = template_iq
        this.strand =  { 'top':[], 'bottom':[] }
    }
}

class PCR{

    constructor(solution){
        this.solution = solution
        this.templates = solution.get_templates()
        this.primers = solution.get_primers()
        this.template_primer_binding_sites_list = []
        this.potential_products = []
        this.cycles = 0

        this.PRIMER_CONC = this.solution.get_primer_concentrations_dict()
        // To do: get dictionaries of template sequences and quantities, keyed by id

        // Configuration options
        this.FUDGE = 10  // Controls how far from perfect alignments can be.
        this.MAX_BINDING_SITES = 20 // Only take this many of the best binding sites per primer.
    }

    alternative_alignments_to_pbs_list = function(aa_list, my_primer_iq, my_template_iq, my_strand){
        // From a list of alternative alignments, find the one with the highest binding _strandenergy (G55).
        // Use this thermodynamically best alignment to create a new PBS, and add it to the list.
        HYBRIDIZER.add_aa_list_thermodynamics(aa_list)
        aa_list.sort_aas_by_thermodynamic_stability()

        let best_alignments = aa_list.map( aa => aa.get_best_alignment() )
        
        let pbs_list = []
        for (let best_alignment of best_alignments.slice(0, this.MAX_BINDING_SITES)){
            let my_pbs = new PrimerBindingSite(my_primer_iq, my_template_iq, my_strand, best_alignment)
            pbs_list.push(my_pbs)
        }
        return pbs_list
    }

    find_template_primer_binding_sites = function(){
        // TO DO: create PBS objects that know the primer concentrations etc.
        // run searches and populate left and right PBS lists.
        
        // Both primers and tempaltes are lists of IngredientQuantity objects
        let templates = this.solution.get_templates()
        let primers = this.solution.get_primers()

        for (let template_iq of templates){
            let template_id = template_iq.ingredient.id
            let my_tpbs = new TemplatePrimerBindingSites(template_iq)  // ['ingredient']['id']
            for (let primer_iq of primers){
                let primer_seq = primer_iq['ingredient']['sequence']

                console.log(`primer_seq = ${primer_seq}`)

                for (let strand_tb of ['top', 'bottom']){
                    let aa_list = SEARCHER.search_primer(template_id, primer_seq, strand_tb, this.FUDGE)
                    let new_pbs_list = this.alternative_alignments_to_pbs_list(aa_list, primer_iq, template_iq, strand_tb)
                    my_tpbs.strand[strand_tb].push(...new_pbs_list)
                }

            }
            this.template_primer_binding_sites_list.push(my_tpbs)
        }

    }

    // PCR amplicons are usually between 200–1000 bp. For qPCR, they typically range from 75–150 bp.
    find_potential_products = function(max_amplicon_length = 2000){
        // find left:right PBS pairs that are close enough to amplify
        for (let my_tpbs of this.template_primer_binding_sites_list){
            for (let left_pbs of my_tpbs.strand['top']){
                for (let right_pbs of my_tpbs.strand['bottom']){
                    // console.log(`!!! left_pbs.alignment.B: ${left_pbs.alignment.B}`)
                    let my_product_size = right_pbs.alignment.template_end - left_pbs.alignment.template_begin + 1
                    if ( (my_product_size > 0) && ( my_product_size <= max_amplicon_length)) {
                        let my_pp = new PotentialProduct(my_tpbs.template_iq, left_pbs, right_pbs, this)
                        my_pp.init() // adds thermodynamic features
                        this.potential_products.push( my_pp )
                    }
                }
            }
        }

    }

    run = function(num_cycles, denaturationTemp, annealingTemp){
        // run searches (uses SEARCHER.cache)
        this.find_template_primer_binding_sites()
        this.find_potential_products()

        this.cycles = num_cycles
        // initialize all potential products
        for (let pp of this.potential_products){
            pp.init()
        }

        // run PCR
        let polymerase_activity = this.solution.get_dna_polymerase_activity()
        let polymerase_survival_per_cycle = 0.94 // !!! should be a function of time at denaturationTemp
        for (let cycle_number=0; cycle_number < num_cycles; cycle_number++){
            for (let pp of this.potential_products){
                pp.cycle(denaturationTemp, annealingTemp, polymerase_activity);
            }
            polymerase_activity *= polymerase_survival_per_cycle;
        }

        // !!! copy PCR products back into the solution   !!!
        // for (let pp of this.potential_products){
            // pp_iq = new
            // this.solution.add_ingredient(pp.
            // for (let strand of ['concAOtop', 'concOBbot', 'concABtop', 'concABbot'])
        // }
    }

    get_band_data = function(sample_volume=10){
        // sample_volume: volume of reaction solution loaded onto gel, in ul
        let band_data = []
        for (let pp of this.potential_products){
            if (pp.concentration_history.length > 0){
                let final_concentration_data = pp.concentration_history[pp.concentration_history.length - 1]
                let product_concentration = Math.min(final_concentration_data.concABtop, final_concentration_data.concABbot)
                band_data.push({ "size":pp.get_size(), "quantity": product_concentration * sample_volume })
            }
        }
        return band_data
    }

    get_fluorescence_history = function(){
        // We assume that [dsDNA] == ['concABtop'], so no excess or unhybridized single strands
        let FLUORESCENCE_COEFF = 1e-3  // !!! decide on units !!!
        let BACKGROUND = 2e-11
        let NOISE_SCALE = 4e-12
        // collect data from pp.concentration_history for pp of this.potential_products
        // initialize with noise
        let fluorescence_history = this.gaussian_noise(this.cycles, BACKGROUND, NOISE_SCALE)

        for (let pp of this.potential_products){
            let bp = pp.get_size()
            for (let cycle_num=0; cycle_num < pp.concentration_history.length; cycle_num += 1){
                let dsDNA_quantity = pp.concentration_history[cycle_num]['concABtop'] * bp
                fluorescence_history[cycle_num] += dsDNA_quantity * FLUORESCENCE_COEFF
            }
        }
        return fluorescence_history
    }

    get_melting_curve = function(){
        let melting_curve = [ ["T", "dsDNA_conc",  "delta_ds"] ]

        for (let pp of this.potential_products){

        }
        // const melting_curve = [ ["T", "dsDNA_conc",  "delta_ds"], ["41", "9.913735e-07", "1.977817e-09"], ... ]
    }

    gaussian_noise = function(N, mean=0, sd=1){
        // https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
        let rnorm = []
        while (rnorm.length < N){
            let U1 = Math.random()
            let U2 = Math.random()
            let Z0 = Math.sqrt(-2 * Math.log(U1)) * Math.cos(2 * Math.PI * U2)
            let Z1 = Math.sqrt(-2 * Math.log(U1)) * Math.sin(2 * Math.PI * U2)
            rnorm.push(mean + Z0 * sd)
            rnorm.push(mean + Z1 * sd)
        }
        return rnorm.slice(0,N)
    }
}


// HYBRIDIZER is required by PrimerBindingSite, PCR
class PotentialProduct{
    constructor(template_iq, pbsA, pbsB, pcr){
        this.template_iq = template_iq
        this.pbsA = pbsA
        this.pbsB = pbsB
        this.pcr = pcr

        this.dH = undefined // HS[0]
        this.dS = undefined // HS[1]
        this.concentration_history = undefined // set by init()

        this.concOOtop = template_iq.quantity	 // 0.00000001,
        this.concOObot = template_iq.quantity

        this.concAOtop = 0
        this.concOBbot = 0
        this.concABtop = 0
        this.concABbot = 0
    }

    init = function(){
        // finish initialization; also re-initialization
        let seq = this.get_sequence()
        let HS = HYBRIDIZER.calculate_aligned_sequence_HS(seq, seq)
        this.seq = seq
        this.dH = HS[0]
        this.dS = HS[1]
        this.concentration_history = []  // values are objects with concentrations of various components
        this.concAOtop = 0
        this.concOBbot = 0
        this.concABtop = 0
        this.concABbot = 0
    }

    get_sequence = function(){
        let first_base = this.pbsA.alignment.template_begin + 1
        let last_base = this.pbsB.alignment.template_end - 1
        let amplified_seq = this.template_iq.ingredient.sequence.substring(first_base, last_base - first_base + 1)

        return this.pbsA.alignment.B + amplified_seq + SEARCHER.revcomp(this.pbsB.alignment.B)
    }

    get_size = function(){
        return this.get_sequence().length
    }

    // as_band = function(){
    //     band_quantity = 
    //     return {"size": this.get_size(), "quantity: 0"}
    // }


    // PRIMER_CONC is an attribute of the solution this.pcr.solution
    // It is a working dictionary for use during cycling; eventually I will use it to update the solution primer quantities

    // hybrid = function(dH, dS, denaturationTemp, topConc, botConc){
    //     HYBRIDIZER.hybridize(dH, dS, denaturationTemp, topConc, botConc)
    // }
    hybrid = HYBRIDIZER.hybridize  // To Do: this should use HYBRIDIZER.primingCoefficient, which takes into account salt effects and 3' mismatches.

    // These functions are modified from those in Hybridizer; they take dH and dS as parameters rather than raw sequences
    fraction_template_bound = function(primer_conc, H, S, T_celsius){
        const T0 = 273.15;
        const R = 1.987;
        let T = T_celsius + T0;
        let G = H - T * S;
        let K_eq = Math.exp((G)/(R * T));	// looks OK if you take off the negative sign from the exponent...
        let fraction_bound = (1 / ((1 / primer_conc * K_eq) + 1));
        return fraction_bound
    }
/*
    adjust_S_for_salt = function(N, K_conc, Mg_conc){
        magnitude = 1e-3 
        salt_conc = K_conc * magnitude + 3.795 * Math.sqrt(Mg_conc * magnitude)
        S_salt_adjustment = 0.368 * (N - 1) * Math.log(salt_conc)
        return S_salt_adjustment
    }
    // replace with fraction_template_bound to take salt into account
    binding_coeff = function(dH, dS, primer_conc, T, K_conc, Mg_conc){
        dS += adjust_S_for_salt(seq1.length, K_conc, Mg_conc)
        return this.fraction_template_bound(primer_conc, dH, dS, T)
    }
*/
    priming_coeff = function(seq1, seq2){
        let primingCoeff = 1
        let end = seq1.length - 1
        if ( seq1[end] != seq2[end] ) primingCoeff *= 0.1
        if ( seq1[end - 1] != seq2[end - 1] ) primingCoeff *= 0.2 
        if ( seq1[end - 2] != seq2[end - 2] ) primingCoeff *= 0.5 
        return primingCoeff;
    }


    primeTemplate = function(pbs, annealingTemp, targetConc){
		// let primed_concentration = this.hybrid(this.pcr.PRIMER_CONC[pbs.primer_seq], targetConc, 
        //                                         pbs.alignment.template_dH, pbs.alignment.template_dS, annealingTemp)
        let bound_fraction = this.fraction_template_bound(pbs.alignment.template_dH, pbs.alignment.template_dS, this.pcr.PRIMER_CONC[pbs.primer_seq], annealingTemp)
        let primed_quantity = targetConc * bound_fraction * this.priming_coeff(pbs.alignment.A, pbs.alignment.B)
        if (primed_quantity < 0) { primed_quantity = 0 }
        return primed_quantity
	}

	primeProduct = function(pbs, annealingTemp, targetConc){
		// let primed_concentration =  this.hybrid(this.pcr.PRIMER_CONC[pbs.primer_seq], targetConc, 
        //                                         pbs.alignment.primer_dH, pbs.alignment.primer_dS, annealingTemp)
        let bound_fraction = this.fraction_template_bound(pbs.alignment.primer_dH, pbs.alignment.primer_dS, this.pcr.PRIMER_CONC[pbs.primer_seq], annealingTemp)
        let primed_quantity = targetConc * bound_fraction
        if (primed_quantity < 0) { primed_quantity = 0 }
        return primed_quantity
	}

    cycle = function(denaturationTemp, annealingTemp, polymeraseActivity){
		let extensionEfficiency = polymeraseActivity/100
        let nonprocessivityPenalty = 1e-4 * this.get_size()  // !!! this can go negative!!!
        if (nonprocessivityPenalty < 0) nonprocessivityPenalty = 0
		extensionEfficiency *= 1 - nonprocessivityPenalty

		// adjust quantity of template strands for how well they denatured.
		let topConc = this.concOOtop + this.concAOtop + this.concABtop
		let botConc = this.concOObot + this.concOBbot + this.concABbot
        let undenaturedConc = 0 // this.hybrid(this.dH, this.dS, denaturationTemp, topConc, botConc) // not denatured. !!! The oligo thermodynamic calculations don't seem to scale to long sequences

		let fractionTopStrandsDenatured = (topConc - undenaturedConc) / topConc
		let fractionBotStrandsDenatured = (botConc - undenaturedConc) / botConc

		let denatured_TemplateTop = this.concOOtop * fractionTopStrandsDenatured
		let denatured_TemplateBot = this.concOObot * fractionBotStrandsDenatured
		let denatured_AOtop = this.concAOtop * fractionTopStrandsDenatured
		let denatured_OBbot = this.concOBbot * fractionBotStrandsDenatured
		let denatured_ABtop = this.concABtop * fractionTopStrandsDenatured
		let denatured_ABbot = this.concABbot * fractionBotStrandsDenatured

		let primed_TemplateTop = this.primeTemplate(this.pbsB, annealingTemp, denatured_TemplateTop)
		let primed_TemplateBot = this.primeTemplate(this.pbsA, annealingTemp, denatured_TemplateBot)
		let primed_AOtop = this.primeTemplate(this.pbsB,annealingTemp, denatured_AOtop)
		let primed_OBbot = this.primeTemplate(this.pbsA,annealingTemp, denatured_OBbot)
		let primed_ABtop = this.primeProduct(this.pbsB, annealingTemp, denatured_ABtop)
		let primed_ABbot = this.primeProduct(this.pbsA, annealingTemp, denatured_ABbot)

		let d_concAOtop = extensionEfficiency * primed_TemplateBot
		let d_concOBbot = extensionEfficiency * primed_TemplateTop
		let d_concABtop = extensionEfficiency * (primed_OBbot + primed_ABbot)
		let d_concABbot = extensionEfficiency * (primed_AOtop + primed_ABtop)
        
		if ( (d_concAOtop + d_concABtop) > this.pcr.PRIMER_CONC[this.pbsA.seq]){
            console.log("rationing primer A")
			let wanted = (d_concAOtop + d_concABtop)
			let available = this.pcr.PRIMER_CONC[this.pbsA.seq]
			d_concAOtop *= available / wanted
			d_concABtop *= available / wanted
		}

		if ( (d_concOBbot + d_concABbot) > this.pcr.PRIMER_CONC[this.pbsB.seq]){
            console.log("rationing primer B")
			let wanted = (d_concOBbot + d_concABbot)
			let available = this.pcr.PRIMER_CONC[this.pbsB.seq]
			d_concOBbot *= available / wanted
			d_concABbot *= available / wanted
		}

		this.pcr.PRIMER_CONC[this.pbsA.primer_seq] -= (d_concAOtop + d_concABtop)
        this.pcr.PRIMER_CONC[this.pbsB.primer_seq] -= (d_concOBbot + d_concABbot)
		
		// avoid negative or NaN concentrations
		if ((this.pcr.PRIMER_CONC[this.pbsA.primer_seq] < 0)||isNaN(this.pcr.PRIMER_CONC[this.pbsA.primer_seq]))
            this.pcr.PRIMER_CONC[this.pbsA.primer_seq] = 0
		if ((this.pcr.PRIMER_CONC[this.pbsB.primer_seq] < 0)||isNaN(this.pcr.PRIMER_CONC[this.pbsB.primer_seq]))
            this.pcr.PRIMER_CONC[this.pbsB.primer_seq] = 0

		this.concAOtop += d_concAOtop
		this.concOBbot += d_concOBbot
		this.concABtop += d_concABtop
		this.concABbot += d_concABbot

        for (let attr of ["concAOtop", "concOBbot", "concABtop", "concABbot"]){
            if ((this[attr] < 0) || (isNaN(this[attr]))){ this[attr] = 0 } // !! 12/7
        }

        this.concentration_history.push({"concAOtop":this.concAOtop, "concOBbot":this.concOBbot, "concABtop":this.concABtop, "concABbot":this.concABbot})
    }

    get_melting_curve = function(){

        let melt_rows = []
        for (let T = 45; T <= 95; T += 0.5){
            let conc = this.concABtop
            melt_rows.push({
                "T": T,
                "hybridized": HYBRIDIZER.hybridize(conc, conc, this.dH, this.dS, T)
            })
        }

        return melt_rows
    }
}