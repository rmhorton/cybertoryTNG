// https://stackoverflow.com/questions/16626735/how-to-loop-through-an-array-containing-objects-and-access-their-properties

class Ingredient {
    constructor(id, type='Ingredient') {
        this.type = type
        this.id = id
        // this.type = this.constructor.id  :: this does not seem to work for classes that inherit the method (???).
    }
}


class DnaMolecule extends Ingredient {
    // All sequences for now are verbatim; eventually they can be a reference to an object on a server.
    // primer1 = new DnaMolecule('ACGTAACCGGTT', 'ACGTAACCGGTT')
    constructor(id, sequence) {
        super(id, 'DnaMolecule') // all Ingredients have 'id' and 'type'
        this.sequence = sequence
        this.units = 'p_mol' // picomol: 1e-12 mol; 1 pmol primer in 10ul = 0.1uM
    }
    is_primer = function(){
        // if id == sequence, it is a primer; otherwise, it could be a template.
        return this.id == this.sequence
    }
}


class IngredientQuantity {
    constructor(ingredient, quantity){
        this.ingredient = ingredient
        this.quantity = quantity
    }

}


class Solution{
    constructor(id, volume=10, ingredient_quantities=[]){
        this.id = id
        this.volume = volume // ul
        this.ingredient_quantities = []
    }

    add_ingredient = function(ingredient, quantity){
        let my_iq = new IngredientQuantity(ingredient, quantity)
        this.ingredient_quantities.push(my_iq)
    }

    get_templates = function(){
        // returns a list of IngredientQuantity objects where each ingredient is a DnaMolecule 
        //    having is_primer() == false
        let templates = []
        for (let iq of this.ingredient_quantities){
            let ingredient = iq['ingredient']
            if ( (ingredient.type == 'DnaMolecule') && (!ingredient.is_primer())){
                templates.push(iq)
            }
        }
        return templates
    }

    get_primers = function(){
        // returns a list of IngredientQuantity objects where each ingredient is a DnaMolecule 
        //     having is_primer() == true
        let primers = []
        for (let iq of this.ingredient_quantities){
            let ingredient = iq['ingredient']
            if ( (ingredient.type == 'DnaMolecule') && (ingredient.is_primer())){
                primers.push(iq)
            }

        }
        return primers
    }

    get_ingredient_concentration = function(primer_id){
        return (this.ingredient_quantity[primer_id]/this.volume)
    }

    set_ingredient_concentration = function(primer_id, new_concentration){
        this.ingredient_quantity[primer_id] = new_concentration
    }

    // ions, enzymes
}

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

        console.log(`alignment = ${alignment}`)

        let template_HS = HYBRIDIZER.calculate_aligned_sequence_HS(alignment.A, alignment.B)
        this.template_dH = template_HS[0]
        this.template_dS = template_HS[1]

        let product_HS = HYBRIDIZER.calculate_aligned_sequence_HS(alignment.A, alignment.A)
        this.product_dH = product_HS[0]
        this.product_dS = product_HS[1]        
    }
}



class PCR{

    constructor(solution){
        this.solution = solution
        this.templates = solution.get_templates()
        this.primers = solution.get_primers()
        this.pbs_list_right = []
        this.pbs_list_left = []
        this.potential_products = []
    }

    alternative_alignments_to_pbs_list = function(aa_list, my_template_iq, my_primer_iq){
        // From a list of alternative alignments, find the one with the highest binding energy (G55).
        // Use this thermodynamically best alignment to create a new PBS, and add it to the list.
        let pbs_alignments = []
        for (let aa_i=0; aa_i < aa_list.length; aa_i++){
            let aa = aa_list[aa_i]
            
            let my_pbs = new PrimerBindingSite(my_primer_iq, my_template_iq, aa.get_best_alignment())
            pbs_alignments.push(my_pbs)
        }
        return pbs_alignments
    }

    find_primer_binding_sites = function(fudge=0){
        // TO DO: create PBS objects that know the primer concentrations etc.
        // run searches and populate left and right PBS lists.
        
        // Both primers and tempaltes are lists of IngredientQuantity objects
        let templates = this.solution.get_templates()
        let primers = this.solution.get_primers()

        for (let template_iq of templates){
            let my_searcher = new PrimerSearcher(template_iq['ingredient']['sequence'])
            for (let primer_iq of primers){
                let primer_seq = primer_iq['ingredient']['sequence']
                // search top strand
                let aa_list_left = my_searcher.search_primer(primer_seq, fudge=fudge, 'top') // strand='top'
                this.pbs_list_left = this.alternative_alignments_to_pbs_list(aa_list_left, template_iq, primer_iq)
                // search bottom strand
                let aa_list_right = my_searcher.search_primer(primer_seq, fudge=fudge, "bottom") // strand='bottom'
                this.pbs_list_right = this.alternative_alignments_to_pbs_list(aa_list_right, template_iq, primer_iq)
            }
        }

    }

    find_potential_products = function(max_amplicon_length = 2000){
        // find left:right PBS pairs that are close enough to amplify
        for (let template of this.templates){
            for (let left_pbs of this.pbs_list_left){
                for (let right_pbs of this.pbs_list_right){
                    this.potential_products.push( new PotentialProduct(template, left_pbs, right_pbs))
                }
            }
        }

    }
}


// HYBRIDIZER is required by PrimerBindingSite, PCR
class PotentialProduct{
    constructor(template_iq, pbsA, pbsB, pcr){
        this.template_iq = template_iq
        this.pbsA = pbsA
        this.pbsB = pbsB
        this.pcr = pcr

        this.dH = dH
        this.dS = dS
        this.size = size
        this.seq = seq

        this.concOOtop = templateTop	 // 0.00000001,
        this.concOObot = templateBot
        this.concAOtop = 0
        this.concOBbot = 0
        this.concABtop = 0
        this.concABbot = 0
    }


    // PRIMER_CONC is an attribute of the solution this.pcr.solution


    hybrid = function(dH, dS, denaturationTemp, topConc, botConc){
        HYBRIDIZER.hybridize(dH, dS, denaturationTemp, topConc, botConc)
    }

    primeTemplate = function(pbs, annealingTemp, templateConc){
		return hybrid(pbs.template_dH, pbs.template_dS,
            annealingTemp, PRIMER_CONC[pbs.seq], templateConc)
	}

	primeProduct = function(pbs, annealingTemp, productConc){
		return hybrid(pbs.product_dH, pbs.product_dS,
				annealingTemp, PRIMER_CONC[pbs.seq], productConc)
	}

    cycle = function(denaturationTemp, annealingTemp, polymeraseActivity, nonprocessivityPenalty){
		let extensionEfficiency = polymeraseActivity/100
		extensionEfficiency *= (1 - ($nonprocessivityPenalty * this.size) )

		// adjust quantity of template strands for how well they denatured.
		let topConc = this.concOOtop + this.concAOtop + this.concABtop
		let botConc = this.concOObot + this.concOBbot + this.concABbot
        let hybridizedConc = this.hybrid(this.dH, this.dS, denaturationTemp, topConc, botConc)

		let fractionTopStrandsDenatured = (topConc - hybridizedConc) / topConc
		let fractionBotStrandsDenatured = (botConc - hybridizedConc) / botConc

		let denatured_TemplateTop = this.concOOtop * fractionTopStrandsDenatured
		let denatured_TemplateBot = this.concOObot * fractionBotStrandsDenatured
		let denatured_AOtop = this.concAOtop * fractionTopStrandsDenatured
		let denatured_OBbot = this.concOBbot * fractionBotStrandsDenatured
		let denatured_ABtop = this.concABtop * fractionTopStrandsDenatured
		let denatured_ABbot = this.concABbot * fractionBotStrandsDenatured

		let primed_TemplateTop = primeTemplate(this.pbsB, annealingTemp, denatured_TemplateTop)
		let primed_TemplateBot = primeTemplate(this.pbsA, annealingTemp, denatured_TemplateBot)
		let primed_AOtop = primeTemplate(this.pbsB,annealingTemp, denatured_AOtop)
		let primed_OBbot = primeTemplate(this.pbsA,annealingTemp, denatured_OBbot)
		let primed_ABtop = primeProduct(this.pbsB, annealingTemp, denatured_ABtop)
		let primed_ABbot = primeProduct(this.pbsA, annealingTemp, denatured_ABbot)

		let d_concAOtop = extensionEfficiency * (primed_TemplateBot)
		let d_concOBbot = extensionEfficiency * (primed_TemplateTop)
		let d_concABtop = extensionEfficiency * (primed_OBbot + primed_ABbot)
		let d_concABbot = extensionEfficiency * (primed_AOtop + primed_ABtop)

		if ( (d_concAOtop + d_concABtop) > PRIMER_CONC[this.pbsA.seq]){
			let wanted = (d_concAOtop + d_concABtop)
			let available = PRIMER_CONC[this.pbsA.seq]
			d_concAOtop *= available / wanted
			d_concABtop *= available / wanted
		}

		if ( (d_concOBbot + d_concABbot) > PRIMER_CONC[this.pbsB.seq]){
			let wanted = (d_concOBbot + d_concABbot)
			let available = PRIMER_CONC[this.pbsB.seq]
			d_concOBbot *= available / wanted
			d_concABbot *= available / wanted
		}

		PRIMER_CONC[this.pbsA.seq] -= (d_concAOtop + d_concABtop)
		PRIMER_CONC[this.pbsB.seq] -= (d_concOBbot + d_concABbot)
		
		// avoid negative concentrations
		if (PRIMER_CONC[this.pbsA.seq] < 0) PRIMER_CONC[this.pbsA.seq] = 0
		if (PRIMER_CONC[this.pbsB.seq] < 0) PRIMER_CONC[this.pbsB.seq] = 0
		
		this.concAOtop += d_concAOtop
		this.concOBbot += d_concOBbot
		this.concABtop += d_concABtop
		this.concABbot += d_concABbot
    }


}