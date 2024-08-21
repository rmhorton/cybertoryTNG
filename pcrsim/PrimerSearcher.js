/* 
Durban et al., Biological Sequence Analysis,
template: X is the sequence defining the columns of the alignment matrix; indexed by i.
primer: Y defines the rows of the alignment matrix; indexed by j.

NOTES:
An element in a matrix is indexed by row then column, like M[j][i].
In normal matrix notation that would be M[i,j]
*/



function PrimerSearcher(template=''){

    this.X = template
    this.Y = ""  // primer
    this.alignments = []

    
    function Alignment(path, seqA, seqB){
        // Helper class for primer-template alignmentws
        this.path=path

        this.A = seqA
        this.B = seqB
        this.template_end = path[0][0]
        this.template_begin = path[path.length - 1][0] + 1

        this.as_printable_string = function(){
            spacer = ''
            for (i in this.A){
                spacer += (this.A[i] == this.B[i]) ? '|' : ' '
            }
            return `[${this.template_begin}:${this.template_end}]\n${this.A}\n${spacer}\n${this.B}\n`
        }
    }

    this.gap_creation_penalty = -3

    alignment_matrix = [  
        //A   C   G   T
        [ 2, -1, -1, -1], // A
        [-1,  2, -1, -1], // C
        [-1, -1,  2, -1], // G
        [-1, -1, -1,  2]  // T
    ]

    priming_matrix = [  // ???
        // A     C     G     T
        [ 2.0, -0.8, -1.2, -0.8], // A
        [-0.8,  4.0, -0.8, -0.6], // C
        [-1.2, -0.8,  4.0, -0.8], // G
        [-0.8, -0.6, -0.8,  2.0]  // T
    ]

    this.match_matrix = alignment_matrix

    this.get_pair_score = function(x, y){
        alphabet = 'ACGT'
        let x_row = alphabet.indexOf(x)
        let y_col = alphabet.indexOf(y)
        return this.match_matrix[y_col][x_row]
    }

    this.dp_matrix = [] // dynamic programming matrix


    this.set_template = function(template_seq) {
        this.X = template_seq
    }

    this.set_primer = function(primer_seq) {
        this.Y = primer_seq
    }


    this.compute_cell_score = function(i, j) {
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

    this.fill_in_dp_matrix = function() {
        // Create scoring matrix 
  
        cols = this.X.length
        rows = this.Y.length
  
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


    this.get_starting_cells = function(fudge=0){
        last_j = this.dp_matrix.length - 1
        last_row = this.dp_matrix[last_j]
        max_score = Math.max(...last_row)
        starting_cells = []
        for (i=0; i < last_row.length; i++){
            if (last_row[i] >= max_score - fudge){
                starting_cells.push([i, last_j])
            }
        }
        console.log(`number of starting cells:${starting_cells.length}`)
        return starting_cells
    }


    this.traverse = function(path, seqA='', seqB=''){
        // recursive traceback
        // path is a list of coordinate pairs, each representing [i,j] coordinates.
        // Before each recursive call we add to the growing aligned sequences. Note that the sequences are 0 indexed because the DP matrix uses the zero row and column for initial scores, so sequence positions in the matrix are 1 indexed. This means we need to subtract one f
    
        end_point = path[path.length - 1]
        i = end_point[0]
        j = end_point[1]

        // path: ${path}, path_length: ${path.length}, end_point:${end_point}, 
        console.log(`traverse: i=${i}, j=${j}`)

        // base case
        if ( j == 0 || i == 0 ){
            my_alignment = new Alignment(path, seqA, seqB)
            this.alignments.push(my_alignment)
            return
        }
        
        let this_score  = this.dp_matrix[j][i];
        let match_score = this.get_pair_score(this.X[i-1], this.Y[j-1]);
        let diag_score  = this.dp_matrix[j - 1][i - 1];
        let up_score    = this.dp_matrix[j - 1][i];
        let left_score  = this.dp_matrix[j][i - 1];

        // max_neighbor_value = Math.max(diag, up, left)

        if ( this_score == diag_score + match_score ) {
            new_path = path.slice()
            new_path.push([i-1, j-1])
            this.traverse(new_path, this.X[i-1] + seqA, this.Y[j-1] + seqB)
        }
        
        if ( ( this_score == up_score + this.gap_creation_penalty ) && j!=0 ) {
            new_path = path.slice()
            new_path.push([i, j-1])
            this.traverse(new_path, '-' + seqA, this.Y[j-1] + seqB)
        }
        
        if ( ( this_score == left_score + this.gap_creation_penalty ) && i!=0) {
            new_path = path.slice()
            new_path.push([i-1, j])
            this.traverse(new_path, this.X[i-1] + seqA, '-' + seqB)
        }

    }

    this.get_alignments = function(){
        starting_cells = this.get_starting_cells()
        for (starting_cell_idx in starting_cells){
            starting_cell = starting_cells[starting_cell_idx]
            this.traverse([starting_cell])
        }

    }

    this.search_primer = function(primer){
        console.log(`primer = ${primer}`)
        this.set_primer(primer)
        this.fill_in_dp_matrix()
        this.get_alignments()
        return this.alignments
    }

    this.alignments_as_text = function(){
        txt = "Alignments:\n"
        for (idx in this.alignments){
            console.log(`alignments_as_text: idx=${idx}`)
            alignment = this.alignments[idx]
            txt += alignment.as_printable_string() + "\n"
        }

        return txt
    }

    ///

    this.revcomp = function(s){
        // Test this!
        complement = {
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
        reversed = s.toUpperCase().split('').reverse().join('')
        return reversed.replace(/[ACGTYRWSKMDHVBXN]/g, x => complement[x])
    }

}