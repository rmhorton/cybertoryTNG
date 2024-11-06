/* 
Durban et al., Biological Sequence Analysis,
template: X is the sequence defining the columns of the alignment matrix; indexed by i.
primer: Y defines the rows of the alignment matrix; indexed by j.

NOTES:
An element in a matrix is indexed by row then column, like M[j][i].
In conventional matrix notation that would be M[i,j]

!on't allow spaces past the ends of the primer.
*/

class Alignment{
    
    constructor(seqA, seqB, template_begin, template_end){
        // this.path=path  // no need to record the path
        this.A = seqA  // template
        this.B = seqB  // primer
        this.template_begin = template_begin  // template_begin = path[path.length - 1][0] + 1, template_end = path[0][0]
        this.template_end = template_end

        // will be set by AlternativeAlignments.add_alignment
        // this.alignment_score = undefined

        // thermodynamic values to be filled in by Hybridizer.add_aa_thermodynamics
        this.template_dH = undefined 
        this.template_dS = undefined
        this.template_dG55 = undefined
        this.primer_dH = undefined 
        this.primer_dS = undefined
        this.is_best_alternative = false
    }

    get_spacer = function(){
        let spacer = ''
        for (let i in this.A){
            spacer += (this.A[i] == this.B[i]) ? '|' : ' '
        }
        return spacer
    }

    as_text = function(){
        let spacer = this.get_spacer()
        let thermo_msg = (this.template_dH == undefined)?
            ''
            : 
            ` dG55=${this.template_dG55.toFixed(3)}`;
            //  template_dH=${this.template_dH.toFixed(3)} template_dS=${this.template_dS.toFixed(3)} primer_dH=${this.primer_dH.toFixed(3)} primer_dS=${this.primer_dS.toFixed(3)}
        if (this.is_best_alternative){
            thermo_msg += ' *** Best Alternative ***'
        }

        return `[${this.template_begin}:${this.template_end}] ${thermo_msg}\n${this.A}\n${spacer}\n${this.B}\n`
    }

    as_json = function(){
        // let basic_attributes = ['template_begin', 'template_end', 'alignment_score', 'A', 'B']
        // for (let attrib in basic_attributes){
        //     my_dict[attrib] = this[attrib]
        // }

        let my_dict = {
            'template_begin': this.template_begin,
            'template_end': this.template_end,
            // 'alignment_score': this.alignment_score,
            'A': this.A,
            'B': this.B
        }

        return(JSON.stringify(my_dict))
    }
}

class AlternativeAlignments{
    constructor(template_id, alignment_score, strand){
        this.template_id = template_id
        this.strand = strand
        this.alignment_score = alignment_score
        this.alignments = []
    }

    add_alignment = function(my_alignment){
        // my_alignment.alignment_score = this.alignment_score
        this.alignments.push(my_alignment)
    }

    sort_alignments_by_thermodynamic_stability = function(){
         // Sort all the alternatives by binding stability.
         // This only works if the if the thermodynamic properties have been computed by Hybridizer. Otherwise returns nothing.

        // Do alignments have thermodynamic attributes?
        if (this.alignments[0].template_dH != undefined){
            function compare_alignments(a,b) {
                if (a.template_dG55 < b.template_dG55)
                    return -1;
                if (a.template_dG55 > b.template_dG55)
                    return 1;
                return 0;
            }
            this.alignments = this.alignments.sort(compare_alignments)
        }

    }

    get_best_alignment = function(){
        // Return the most thermodynamically stable alignment from a set of alternative alignments.
        // If there are ties it just returns the first one.
        // If thermodynamic properties have not been calculated by Hybridizer.add_aa_list_thermodynamics(), returns nothing.
        for (let alignment of this.alignments){
            if (alignment.is_best_alternative) return alignment
        }
    }

}
    
class AlternativeAlignmentsList extends Array{ 
    // This is the class returned by PrimerSearcher.search_primer()
    // should be called AlternativeAlignmentsArray, to be consistent with Javascript notation.
    constructor(...args) {
        super(...args);
    }

    sort_aas_by_thermodynamic_stability = function(){
        // if ( (this.length > 0) & (this[0].alignments[0].template_dH != undefined) ){
 
            // sort each set of alternative alignments
            for (let aa of this){
                aa.sort_alignments_by_thermodynamic_stability()
            }

            // sort the list of alternative alignments
           function compare_aas(a,b) {
                if (a.alignments[0].template_dG55 < b.alignments[0].template_dG55)
                    return -1;
                if (a.alignments[0].template_dG55 > b.alignments[0].template_dG55)
                    return 1;
                return 0;
            }
            this.sort(compare_aas)
        // }
    }

    as_text = function(){
        let alignments_text = 'Alignments:\n'
        // this.alternative_alignments_list.sort_aas_by_thermodynamic_stability()
        for (let aa of this){
            // aa.sort_alignments_by_thermodynamic_stability()
            alignments_text += `template '${aa.template_id}', alignment_score: ${aa.alignment_score}\n`
            for (let alignment of aa.alignments){
                alignments_text += '\n' + alignment.as_text()
            }
            alignments_text += '\n===\n'
        }
        return alignments_text
    }

    // Converting an object to a JSON string and back is an old fashioned way of cloning an object in Javascript.
    // I cache the simple data structure obtained by evaluating the JSON strings. 
    // These will be used to generate the appropriate AlternativeAlignmentList, AlternativeAlignment, and Alignment objects.
    // to_json = function(){ JSON.stringify(this) }

}

class PrimerSearcher{

    /* This class assumes the presence of some global variables:
    *    TEMPLATES: a dictionary where keys = genbank accession number and value = sequence
    *    HYBRIDIZER: A Hybridizer object.
    */

    constructor(){
        this.X = ""  //template
        this.Y = ""  // primer
        this.alternative_alignments_list = new AlternativeAlignmentsList()  // reiniitialized by search_primer()

        this.gap_creation_penalty = -3

        this.scoring_matrix = [  
            //A   C   G   T
            [ 2, -1, -1, -1], // A
            [-1,  2, -1, -1], // C
            [-1, -1,  2, -1], // G
            [-1, -1, -1,  2]  // T
        ]

        this.dp_matrix = [] // dynamic programming matrix

        this.cache = {} // key = template_id::primer_seq, value = AlternativeAlignmentsList
    }

    export_cache_as_json = function(){
        // let my_json = '{'
        // for (const [key, value] of Object.entries(this.cache)) {
        //     console.log(`${key}: ${value}`);
        //     // aa.sort_alignments_by_thermodynamic_stability()
        //     my_json += `"${key}":` + JSON.stringify(value) + ',';
        // }
        // my_json += '}'
        // return my_json
        return JSON.stringify(this.cache)
    }

    load_cache_from_data_obj = function(cache_data){
        for (const [cache_key, aal_data] of Object.entries(cache_data)) {
            console.log(`loading cache key '${cache_key}' - creating new AlternativeAlignmentsList()`)
            let aal = new AlternativeAlignmentsList()
            for (const aa_data of aal_data){
                console.log(`creating new AlternativeAlignments on ${aa_data.template_id}`)
                let aa = new AlternativeAlignments(aa_data.template_id, aa_data.alignment_score, aa_data.strand)
                for (const a_data of aa_data.alignments){
                    console.log(`creating new Alignment between ${a_data.A} and ${a_data.B}`)
                    let a = new Alignment(a_data.A, a_data.B, a_data.template_begin, a_data.template_end)
                    aa.add_alignment(a)
                }
                aal.push(aa)
            }
            HYBRIDIZER.add_aa_list_thermodynamics(aal)
            this.cache[cache_key] = aal
        }
    }

    // import_cache_items_from_json = function(json_str){
    //     new_cache_bits = JSON.parse(json_str)
    // }

    /**
     * Returns a hash code from a string
     * @param  {String} str The string to hash.
     * @return {Number}    A 32bit integer
     * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     *   or https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
     */
    hashCode = function(str) {
        let hash = 0;
        for (let i = 0, len = str.length; i < len; i++) {
            let chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer (signed)
        }
        return (hash >>> 0).toString(16); // convert to unsigned, then to hex
    }

    set_template = function(template_seq) {
        this.X = template_seq
    }

    set_primer = function(primer_seq) {
        this.Y = primer_seq
    }

    get_pair_score = function(x, y){
        const alphabet = 'ACGT'
        let x_row = alphabet.indexOf(x)
        let y_col = alphabet.indexOf(y)
        return this.scoring_matrix[y_col][x_row]
    }

    compute_cell_score = function(i, j) {
        // Calculate value for a given cell in the score matrix.

        // Look up score for matching this pair.
        // Here i and J are 1-indexed in the sequences because we reserve position 0 for borders
        let match_score = this.get_pair_score(this.X[i-1], this.Y[j-1]);

        // scores for transitioning diagonally, over (gap in primer), or down (gap in template)
        let score_diag = this.dp_matrix[j-1][i-1] + match_score;
        let score_down = this.dp_matrix[j-1][i] + this.gap_creation_penalty;
        let score_over = this.dp_matrix[j][i-1] + this.gap_creation_penalty;

        return Math.max(score_diag, score_down, score_over);
    }

    compute_perfect_score = function(primer_seq){
        let score = 0
        for (let i=0; i < primer_seq.length; i++){
            let base = primer_seq[i]
            score += this.get_pair_score(base, base)
        }
        return score
    }

    fill_in_dp_matrix = function() {
        // Create scoring matrix 
  
        let cols = this.X.length
        let rows = this.Y.length
  
        // initialize dynamic programming matrix with 0s, incluing borders
        this.dp_matrix = [];
        for (let j = 0; j <= rows; j++) {
            this.dp_matrix[j] = [];
            for (let i = 0; i <= cols; i++) {
                this.dp_matrix[j].push(0);
            }
        }

        // fill in scores for cells, excluding borders
        for (let j = 1; j <= rows; j++) {
            for (let i = 1; i <= cols; i++) {
                this.dp_matrix[j][i] = this.compute_cell_score(i, j);
            }
        }
        /**/

    }

    // not used any more; this was for 
    get_array_max = function(my_array){
        // more scalable than Math.max(...my_array)
        let max_score = 0
        for (let idx=0; idx < my_array.length; idx++){
            if (my_array[idx] > max_score){
                max_score = my_array[idx];
            }
        }
        return max_score
    }

    get_starting_cells = function(fudge=0){
        let last_j = this.dp_matrix.length - 1
        let last_row = this.dp_matrix[last_j]
        // let max_score = this.get_array_max(last_row)  // Math.max(...last_row)
        let max_score = this.compute_perfect_score(this.Y)
        let starting_cells = []
        
        for (let i=0; i < last_row.length; i++){
            // Avoid gaps at end of primer (this only handles single gaps)
            if ( (last_row[i] < last_row[i+1]) | (last_row[i] < last_row[i-1])) continue
            if (last_row[i] >= max_score - fudge){
                starting_cells.push([i, last_j])
            }
        }
        return starting_cells
    }


    traceback = function(path, aa, seqA='', seqB=''){
        /* 
        traceback: recursive traversal of the dynamic programming matrix
        path: a list of coordinate pairs, each representing [i,j] coordinates.
        seqA: the aligned template sequence (X) so far
        seqB: the aligned primer sequence (Y) so far
        Notes:
            * Before each recursive call we add to the growing aligned sequences. 
            * Sequences are 0 indexed but the DP matrix uses the zero row and column for initial scores, so sequence positions in the matrix are 1 indexed. 
              This means we need to subtract one from the matrix index to find the sequence index.
        */
        let end_point = path[path.length - 1]
        let i = end_point[0]
        let j = end_point[1]

        // base case
        if ( (j == 0) || (i == 0) ){
            let template_begin = path[path.length - 1][0] + 1
            let template_end = path[0][0]
            let my_alignment = new Alignment(seqA, seqB, template_begin, template_end)
            // aa.alignments.push(my_alignment)
            aa.add_alignment(my_alignment)
            return
        }

        let this_score  = this.dp_matrix[j][i];
        let match_score = this.get_pair_score(this.X[i-1], this.Y[j-1]);
        let diag_score  = this.dp_matrix[j - 1][i - 1];
        let up_score    = this.dp_matrix[j - 1][i];
        let left_score  = this.dp_matrix[j][i - 1];

        // max_neighbor_value = Math.max(diag, up, left)
        
        if ( this_score == diag_score + match_score ) {
            let new_path = path.slice()
            new_path.push([i-1, j-1])
            this.traceback(new_path, aa, this.X[i-1] + seqA, this.Y[j-1] + seqB)
        }

        if ( ( this_score == up_score + this.gap_creation_penalty) ) {
            let new_path = path.slice()
            new_path.push([i, j-1])
            this.traceback(new_path, aa, '-' + seqA, this.Y[j-1] + seqB)
        }
        
        if ( ( this_score == left_score + this.gap_creation_penalty ) ) {
            let new_path = path.slice()
            new_path.push([i-1, j])
            this.traceback(new_path, aa, this.X[i-1] + seqA, '-' + seqB)
        }


    }

    search_primer = function(template_id, primer, strand='top', fudge=10){
        let cache_key = `${template_id}::${primer}::${strand}::${fudge}`
        console.log(`searching for "${cache_key}"`)
        if ( cache_key in this.cache ){
            console.log(`cache hit for "${cache_key}"`)
            return this.cache[cache_key]
        } else {
            this.set_template(TEMPLATES[template_id])

            if ( strand=='top' ){
                console.log('search_primer: top strand')
                this.set_primer(primer)
            } else if ( strand=='bottom') {
                console.log('search_primer: bottom strand')
                this.set_primer(this.revcomp(primer))
            } else {
                throw new Error(`ERROR!!! Strand "${strand}" invalid`)
            }
            
            this.fill_in_dp_matrix()
            
            let starting_cells = this.get_starting_cells(fudge)
            // one AlternativeAlignments per starting cell
            this.alternative_alignments_list = new AlternativeAlignmentsList()
            for (let starting_cell of starting_cells){
                let i = starting_cell[0]
                let j = starting_cell[1]
                let alignment_score = this.dp_matrix[j][i]
                let aa = new AlternativeAlignments(template_id, alignment_score, strand)
                this.traceback([starting_cell], aa)
                this.alternative_alignments_list.push(aa)
            }
            console.log(`sites found: ${starting_cells.length}`)
            this.cache[cache_key] = this.alternative_alignments_list
            return this.alternative_alignments_list
        }
    }

    // guardrail functions
    get_sequence_complexity = function(seq){
        // https://resources.qiagenbioinformatics.com/manuals/clccancerresearchworkbench/200/index.php?manual=How_sequence_complexity_is_calculated.html
        // TEST THIS!!
        var ngram_count = function(seq, n){
            // seq = 'ABCDEFGHIJ'
            let ngrams = new Set()
            for (let i=0; i < seq.length - n + 1; i++){
                let start = i
                let end = Math.min(i + n , seq.length + 1)
                ngrams.add(seq.substring(start,end))
            }
            return ngrams.size
        }
        
        var max_ngrams = function(string_length, n, alphabet_size=4){
            let possible_ngrams = alphabet_size ** n
            let number_of_n_substrings = string_length - n + 1
            return Math.min(possible_ngrams, number_of_n_substrings)
        }

        let C = 1
        for (let n=1; n <= 7 && n <= seq.length; n++){ // does this work for sequences shorter than 7bp?
            C *= ngram_count(seq, n)/max_ngrams(seq.length, n)
        }
        return C
    }

    revcomp = function(s){
        let complement = {
            'A': 'T',
            'C': 'G',
            'G': 'C',
            'T': 'A',
            'Y': 'R',
            'R': 'Y',
            'W': 'W',
            'S': 'S',
            'K': 'M',
            'M': 'K',
            'D': 'H',
            'H': 'D',
            'V': 'B',
            'B': 'V',
            'X': 'X',
            'N': 'N'
        }
        let reversed = s.toUpperCase().split('').reverse().join('')
        return reversed.replace(/[ACGTYRWSKMDHVBXN]/g, x => complement[x])
    }

}