load_svg = function(my_gel_data){
    document.getElementById("gel_display").innerHTML = GEL.get_svg(my_gel_data)
    init_gel()
}

create_marker_band_data = function(ladder_spacing=100, num_bands=30){
    let marker_molecules = []
    for (let i=1; i<=num_bands; i++){
        band_size = i * ladder_spacing
        marker_molecules.push({"size": band_size, "quantity":(5e-4)/band_size})  // quantity in mol
    }
    return marker_molecules
}


to_gel_band = function(band_data){
    mobility = function(size, gamma=3400){
        // https://pubmed.ncbi.nlm.nih.gov/11824615/
        return -240 + 810 * Math.exp(-size/gamma)
    }

    band_height = function(conc, size){
        return 500 * Math.sqrt(conc * size)  // WAG
    }
    my_height = band_height(band_data.quantity, band_data.size)
    return {"mobility": mobility(band_data.size), "height": my_height} 
}

var time_limit = 1;
var time = 0;
var step = 0.005;

var Lanes = new Array();

// animation functions
function init_gel(){
    var gelChildren = document.getElementById("gel").childNodes;
    for ( var i=0; i < gelChildren.length; i++){
        if ( 1 == gelChildren.item(i).nodeType ) {	// element node
            var bandNodes = gelChildren.item(i).childNodes;
            var bandList = new Array();
            for (var j = 0; j < bandNodes.length; j++){
                if ( 1 == bandNodes.item(j).nodeType && bandNodes.item(j).hasAttribute("mobility") ) {
                    bandList.push( bandNodes.item(j) );
                }
            }
            Lanes.push(bandList);
        }
    }
    animate();
}

function animate(){
    time += step;
    if ( time < time_limit) {
        moveBands(time);
        window.setTimeout("animate()", 50);
    } else {
        moveBands(time_limit);
    }
}

function moveBands (targetTime){
    for (var i = 0; i < Lanes.length; i++){
        for (var j = 0; j < Lanes[i].length; j++){
            var mobility = Lanes[i][j].getAttribute("mobility");
            var bandheight = Lanes[i][j].getAttribute("bandheight")
            var distance = targetTime * mobility - bandheight * 0.75;	// adjust for peak of bandShape
            Lanes[i][j].setAttribute ("transform", "translate(0, " + distance + ")");
        }
    }
}


class Gel{
    constructor(margin = 20, lane_spacing = 46){
        this.MARGIN = margin
        this.LANE_SPACING = lane_spacing
    }

    // svg_generation functions
    get_well_svg = function(well_number){
        let well_offset = this.MARGIN + well_number * this.LANE_SPACING
        let well_label = well_number == 0 ? 'M' : well_number + ''
        let well_label_x_offset = well_number < 10 ? 18 : 12
        return `
<g id="well${well_number}" transform="translate(${well_offset},40)">
    <use xlink:href="#well"/>
    <text class="label" transform="translate(${well_label_x_offset},-22)">${well_label}</text>
</g>
`
    }

    get_lane_svg = function(well_number, band_list){
        let well_offset = this.MARGIN + well_number * this.LANE_SPACING
        let bands_svg = ''
        for (let band of band_list){
            bands_svg += this.get_band_svg(band)
        }
        return `
<g id="lan${well_number}" transform="translate(${well_offset},0)">
    ${bands_svg}
</g>
`

    }

    get_band_svg = function(band){
            return `
                    <g mobility="${band['mobility']}" bandHeight="${band['height']}">
                        <use xlink:href="#bandShape" transform="scale(1.0,${band['height']/16})"/>
                    </g>
        `
    }

    get_svg = function(gel_data){
        let num_lanes = gel_data.length
        let wells_svg = ''
        let lanes_svg = ''
        for (let well_number=0; well_number < num_lanes; well_number++){
            wells_svg += this.get_well_svg(well_number)
            lanes_svg += this.get_lane_svg(well_number, gel_data[well_number])
        }

        let gel_width = 2 * this.MARGIN + num_lanes * this.LANE_SPACING
        return `    
<svg id="my_gel" width="${gel_width}" height="800" onload="init(evt)">
<style type="text/css">
    .label {fill: white; font-family: monospace, sans-serif; font-size: 15px; font-weight: bold; }
</style>
<defs>
    <filter id="GaussianBlur">
        <feGaussianBlur stdDeviation="0.5"/>
    </filter>
    <linearGradient id="opacityGradient" x2="0" x1="0" gradientUnits="userSpaceOnUse" y1="8" y2="16">
        <stop stop-opacity="0.5" stop-color="#FF7733" offset="0"/>
        <stop stop-opacity="1" stop-color="#FF7733" offset="0.50"/>
        <stop stop-opacity="0.5" stop-color="#FF7733" offset="1"/>
    </linearGradient>
    <linearGradient id="colorGradient" x2="0" x1="0" gradientUnits="userSpaceOnUse" y1="8" y2="16">
        <stop stop-color="#804020" offset="0"/>
        <stop stop-color="#FF9955" offset="0.50"/>
        <stop stop-color="#804020" offset="1"/>
    </linearGradient>
    <path id="bandShape" filter="url(#GaussianBlur)" fill="url(#opacityGradient)" 
        d="M0,0 v12s0,4 6,4s24,0 30,0s6,-4 6,-4v-12s0,8 -6,8s-24,0 -30,0S0,0,0,0z"/>
    <rect id="background" fill="#302010" width="${gel_width}" height="640"/>
    
    <clipPath id="gelClip" clipPathUnits="userSpaceOnUse">
        <rect fill="#302010" width="${gel_width}" height="600" y="40"/>
    </clipPath>
    <rect id="well" fill="#000000" stroke="#403020" stroke-width="1" y="-18" width="42" height="18"/>
</defs>
<g id="gelBox" transform="skewX(0)">
    <use xlink:href="#background"/>
    <g id="title">
        <text transform="rotate(90)" class="label" y="-5" x="5">PCRs</text>
    </g>${wells_svg}

    <g clip-path="url(#gelClip)" id="bandArea">
        <g id="gel" transform="translate(0,38)">
            ${lanes_svg}
        </g>
    </g>
</g>
</svg>   
`
    }
}