class Ingredient {
    constructor(id, type='Ingredient') {
        this.type = type
        this.id = id
        // this.type = this.constructor.id  :: this does not seem to work for classes that inherit the method (???).
    }
}


class DnaMolecule extends Ingredient {
    // Primer sequences are verbatim. Templates refer to the TEMPLATES dict; eventually they can be a reference to an object on a server.
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

    is_template = function(){
        return(this.id in TEMPLATES)
    }
}


class IngredientQuantity {
    constructor(ingredient, quantity){
        if (quantity < 0) { 
            console.log("Oops: Attempt to create IngredientQuantity with negative quantity")
            quantity = 0
        }
        this.ingredient = ingredient
        this.quantity = quantity
    }

}


class Solution{
    // To Do: solution ingredients should be keyed by ingredient ID, so if you add more of an ingredient it goes into the same pool.

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
        let templates = []
        for (let iq of this.ingredient_quantities){
            let ingredient = iq['ingredient']
            if ( (ingredient.type == 'DnaMolecule') && (ingredient.is_template())){
                templates.push(iq)
            }
        }
        return templates
    }

    get_primers = function(){
        // returns a list of IngredientQuantity objects where each ingredient is a DnaMolecule 
        let primers = []
        for (let iq of this.ingredient_quantities){
            let ingredient = iq['ingredient']
            if ( (ingredient.type == 'DnaMolecule') && (ingredient.is_primer()) ){
                primers.push(iq)
            }

        }
        return primers
    }

    get_primer_concentrations_dict = function(){
        let primer_conc = {}
        for (let iq of this.ingredient_quantities){
            let ingredient = iq['ingredient']
            if ( (ingredient.type == 'DnaMolecule') && (ingredient.is_primer()) ){
                primer_conc[ingredient.id] = iq.quantity / (this.volume * 1e-6)
            }

        }
        return primer_conc
    }

    get_dna_polymerase_activity(){
        // placeholder: should compute based on solution contents and history
        return 100
    }

    // TO DO: set_primer_concentrations. Also [dNTP]s someday
    /* These are not right
    get_ingredient_concentration = function(primer_id){
        return (this.ingredient_quantity[primer_id]/this.volume)
    }

    set_ingredient_concentration = function(primer_id, new_concentration){
        this.ingredient_quantity[primer_id] = new_concentration
    }
    */

    // ions, enzymes
}