/* 
Durban et al., Biological Sequence Analysis,
template: X is the sequence defining the columns of the alignment matrix; indexed by i.
primer: Y defines the rows of the alignment matrix; indexed by j.

NOTES:
An element in a matrix is indexed by row then column, like M[j][i].
In normal matrix notation that would be M[i,j]
*/

class AlternativeAlignments{
    constructor(){
        this.alignments = []
    }
}
    
class Alignment{
    
    constructor(path, seqA, seqB){
        this.path=path
        this.A = seqA
        this.B = seqB
        this.template_end = path[0][0]
        this.template_begin = path[path.length - 1][0] + 1
    }

    as_text = function(){
        let spacer = ''
        for (let i in this.A){
            spacer += (this.A[i] == this.B[i]) ? '|' : ' '
        }
        return `[${this.template_begin}:${this.template_end}]\n${this.A}\n${spacer}\n${this.B}\n`
    }
}

class PrimerSearcher{

    constructor(template=''){
        this.X = template
        this.Y = ""  // primer
        this.alternative_alignments_list = []

        this.gap_creation_penalty = -3

        this.scoring_matrix = [  
            //A   C   G   T
            [ 2, -1, -1, -1], // A
            [-1,  2, -1, -1], // C
            [-1, -1,  2, -1], // G
            [-1, -1, -1,  2]  // T
        ]

        this.dp_matrix = [] // dynamic programming matrix
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
        let max_score = this.get_array_max(last_row)  // Math.max(...last_row)
        let starting_cells = []
        for (let i=0; i < last_row.length; i++){
            if (last_row[i] >= max_score - fudge){
                starting_cells.push([i, last_j])
            }
        }
        return starting_cells
    }


    traceback = function(path, aa, seqA='', seqB=''){
        // recursive traversal
        // path is a list of coordinate pairs, each representing [i,j] coordinates.
        // Before each recursive call we add to the growing aligned sequences. Note that the sequences are 0 indexed because the DP matrix uses the zero row and column for initial scores, so sequence positions in the matrix are 1 indexed. This means we need to subtract one f

        let end_point = path[path.length - 1]
        let i = end_point[0]
        let j = end_point[1]

        // base case
        if ( (j == 0) || (i == 0) ){
            var my_alignment = new Alignment(path, seqA, seqB) // let or var?
            aa.alignments.push(my_alignment)
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
        
        if ( ( this_score == left_score + this.gap_creation_penalty )) {
            let new_path = path.slice()
            new_path.push([i-1, j])
            this.traceback(new_path, aa, this.X[i-1] + seqA, '-' + seqB)
        }


    }

    search_primer = function(primer, fudge=0){
        this.set_primer(primer)
        this.fill_in_dp_matrix()
        // To Do: one AlternativeAlignments per starting cell
        let starting_cells = this.get_starting_cells(fudge)

        this.alternative_alignments_list = []
        for (let starting_cell of starting_cells){
            let aa = new AlternativeAlignments()
            this.traceback([starting_cell], aa)
            this.alternative_alignments_list.push(aa)
        }
        return this.alternative_alignments_list
    }

    get_alignments_as_text = function(){
        let alignments_text = "Alignments:\n"
        for (let aa of this.alternative_alignments_list){
            for (let alignment of aa.alignments){
                alignments_text += '\n' + alignment.as_text()
            }
            alignments_text += '\n===\n'
        }
        return alignments_text
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