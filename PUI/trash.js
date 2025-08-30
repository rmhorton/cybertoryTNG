// ===================== TrashCan =====================
class TrashCan {
  constructor(x, y) {
    this.tx = x;
    this.ty = y;

    // SVG group
    this.group = svg.append('g')
      .attr('transform', `translate(${x},${y})`);

    // Placeholder artwork (replace with Inkscape SVG)
    let old_html = `
    <g id="TrashCan">
     <rect class="trash-body" x="0" y="28" width="90" height="110" rx="10" ry="10" fill="#9ca3af"/>
     <ellipse class="trash-open" cx="45" cy="28" rx="45" ry="12" fill="#4b5563"/>
     <g class="trash-lid" id="trash-lid">
        <rect class="trash-lid" x="0" y="10" width="90" height="18" rx="6" ry="6" fill="#6b7280"/>
        <rect class="trash-lid" x="30" y="2" width="30" height="8" rx="4" ry="4" fill="#6b7280"/>
     </g>
    </g>
    `

    // !!! With the highlightIfOver function, lids made of rectangles move but those made with ellipses and custom paths don't. You need to modify "cy" instead of "y" for these shapes.
    let new_html = `
    <defs id="defs1">
        <linearGradient id="linearGradient1">
        <stop style="stop-color:#000000;stop-opacity:1;" offset="0" id="stop1" />
        <stop style="stop-color:#ffffff;stop-opacity:1;" offset="1" id="stop2" />
        </linearGradient>
        <linearGradient id="linearGradient8">
        <stop style="stop-color:#ff6000;stop-opacity:1;" offset="0.04490501" id="stop8" />
        <stop style="stop-color:#ff8d2c;stop-opacity:1;" offset="0.18579046" id="stop10" />
        <stop style="stop-color:#ff6000;stop-opacity:1;" offset="0.96373057" id="stop9" />
        </linearGradient>
        <linearGradient xlink:href="#linearGradient8" id="linearGradient9" x1="202.06595" y1="230.10223" x2="314.1904" y2="230.10223" gradientUnits="userSpaceOnUse" spreadMethod="repeat" gradientTransform="translate(134.23811,35.055451)" />
        <linearGradient xlink:href="#linearGradient1" id="linearGradient2" x1="338.26276" y1="173.06491" x2="446.47003" y2="144.07086" gradientUnits="userSpaceOnUse" gradientTransform="translate(0,28.018776)" />
        <linearGradient xlink:href="#linearGradient8" id="linearGradient3" gradientUnits="userSpaceOnUse" gradientTransform="translate(530.7286,-0.0453482)" x1="202.06595" y1="230.10223" x2="314.1904" y2="230.10223" spreadMethod="repeat" />
    </defs>
    <g id="TrashCan">
        <path class="trash-body" id="rect7" style="opacity:1;fill:url(#linearGradient9);fill-rule:evenodd;stroke:#000000;stroke-width:0.2;stroke-dasharray:none;stroke-opacity:1" d="m 336.58958,186.25398 v 114.07779 h 0.0258 c -0.10676,0.29582 -0.17725,0.59241 -0.21136,0.88936 3.6e-4,7.87854 25.05555,14.2653 55.96248,14.26527 30.90672,-4e-5 55.9616,-6.38678 55.96196,-14.26527 -0.003,-0.64321 -0.17569,-1.28563 -0.51832,-1.92288 V 186.25398 Z" />
        <ellipse class="trash-open" id="trash-open" cx="392" cy="187" rx="56" ry="14" />
        <path id="biohazard" style="opacity:0.992754;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.02;stroke-dasharray:none;stroke-opacity:1" d="m 398.73559,211.73952 c 0,0 14.26274,5.83551 10.86621,19.91434 -3.39652,14.07882 -16.77355,14.87475 -16.77355,14.87475 l 0.0371,0.95808 c 0,0 2.31933,0.22382 3.41291,2.14364 1.09359,1.91982 0.21115,4.328 0.21115,4.328 l 1.09771,0.54715 c 0,0 6.01153,-11.71612 20.34378,-7.42083 14.33224,4.29528 12.5799,19.29391 12.5799,19.29391 0,0 1.88557,-7.67823 -1.26318,-15.86177 -3.14875,-8.18355 -12.43304,-12.44544 -12.43304,-12.44544 0,0 0.36045,-9.55213 -4.17359,-16.35508 -4.53405,-6.80294 -13.90541,-9.97675 -13.90541,-9.97675 z m -13.87998,0.11616 c 0,0 -7.59236,2.20611 -13.10514,9.02478 -5.51278,6.81867 -4.56158,16.99007 -4.56158,16.99007 0,0 -8.45259,4.46387 -12.0771,11.79194 -3.6245,7.32807 -1.68744,17.0309 -1.68744,17.0309 0,0 -2.07765,-15.26967 11.81323,-19.3676 13.89088,-4.09794 21.26868,7.08897 21.26868,7.08897 l 0.81122,-0.51129 c 0,0 -0.96585,-2.12047 0.14996,-4.02745 1.11582,-1.90698 3.64257,-2.34683 3.64257,-2.34683 l -0.0749,-1.22422 c 0,0 -13.15227,0.65195 -16.59857,-13.90778 -3.44631,-14.55973 10.4191,-20.54149 10.4191,-20.54149 z m 7.22003,20.49705 c -8.12471,-0.0683 -14.2011,5.87168 -14.2011,5.87168 0,0 0.75105,1.02415 1.57034,1.91172 0.8193,0.88757 2.18478,1.70687 2.18478,1.70687 0,0 5.25454,-4.07625 10.44598,-4.02828 5.19143,0.048 10.03639,4.02828 10.03639,4.02828 0,0 1.22901,-0.95585 1.98003,-1.70687 0.75102,-0.75102 1.77509,-1.91172 1.77509,-1.91172 0,0 -5.66681,-5.80341 -13.79151,-5.87168 z m 19.08968,14.79568 c 0,0 -1.26247,0.13837 -2.44078,0.40411 -1.17831,0.26575 -2.57059,1.0387 -2.57059,1.0387 0,0 0.9029,6.58869 -1.73436,11.06062 -2.63726,4.47193 -8.50677,6.67763 -8.50677,6.67763 0,0 0.21324,1.54219 0.48813,2.56811 0.2749,1.02591 0.76802,2.49318 0.76802,2.49318 0,0 7.85939,-2.00586 11.98087,-9.00793 4.12148,-7.00206 2.01548,-15.23442 2.01548,-15.23442 z m -38.19839,0.0525 c 0,0 -2.19248,7.80927 1.81074,14.87961 4.00323,7.07033 12.18551,9.36263 12.18551,9.36263 0,0 0.51143,-1.16251 0.87044,-2.31583 0.35901,-1.15332 0.38582,-2.74546 0.38582,-2.74546 0,0 -6.15744,-2.51244 -8.71162,-7.03234 -2.55417,-4.5199 -1.52962,-10.70591 -1.52962,-10.70591 0,0 -1.44225,-0.58645 -2.46817,-0.86134 -1.02591,-0.27489 -2.5431,-0.58136 -2.5431,-0.58136 z m 15.43668,8.12767 -1.02278,0.67696 c 0,0 7.14075,11.06427 -3.7452,21.32872 -10.88594,10.26445 -22.99901,1.24747 -22.99901,1.24747 0,0 5.7068,5.47213 14.36833,6.837 8.66153,1.36487 16.99462,-4.54453 16.99462,-4.54453 0,0 8.09214,5.08815 16.25069,4.56303 8.15854,-0.52512 15.59284,-7.05404 15.59284,-7.05404 0,0 -12.18508,9.43415 -22.67944,-0.54674 -10.49436,-9.98088 -4.49513,-21.96372 -4.49513,-21.96372 l -0.84832,-0.4469 c 0,0 -1.35348,1.89665 -3.56288,1.88381 -2.2094,-0.0128 -3.85372,-1.98106 -3.85372,-1.98106 z" />
        <g class="trash-lid" id="trash-lid" transform="translate(-397.5366,-77.028999)" >
            <g class="trash-lid" x=0 y=0>
                <path class="trash-lid" id="rect7-3" d="m 733.08007,236.34901 -0.0926,12.09924 c -0.33822,5.36642 18.33107,12.24441 55.86952,12.48999 37.53845,0.24558 56.98743,-7.01707 56.76095,-13.00677 l -0.25898,-11.58246 z" />
                <ellipse class="trash-lid" id="path7-9" cx="790" cy="235" rx="55.962002" ry="14.265438" />
            </g>
            <!-- rect class="trash-lid" x="390" y="180" cx="10" width="90" height="18"/ -->
            <-- style="opacity:0.992754;fill:#ff9216;fill-opacity:1;fill-rule:evenodd;stroke:#030000;stroke-width:0.2;stroke-dasharray:none;stroke-opacity:1" -->
        </g>
    </g>
    `
    this.group.node().innerHTML = new_html;

    // references to key elements
    this.open = this.group.select('.trash-open');
    this.lid = this.group.selectAll('.trash-lid'); // selectAll
  }

  // Check if world coords (x,y) are over the trash opening
  _isOver(x, y) {
    const lx = x - this.tx, ly = y - this.ty;
    const cx = +this.open.attr('cx'), cy = +this.open.attr('cy');
    const rx = +this.open.attr('rx'), ry = +this.open.attr('ry');
    const nx = (lx - cx) / rx, ny = (ly - cy) / ry;
    return (nx * nx + ny * ny) <= 1;
  }

  lid_movement() { // I couldn't figure out how to set a static data member; get method didn't seem to work.
    return 15;
  }

  // Highlight opening and lift lid if a tube is over the opening
  highlightIfOver(x, y) {
    const LID_MOVEMENT = this.lid_movement();
    if (this._isOver(x, y)) {
      console.log("Yes, that is over") // !!!
      this.open.classed('hot', true);
      this.lid.transition().duration(50).attr('y', -LID_MOVEMENT);
      this.lid.transition().duration(50).attr('cy', -LID_MOVEMENT);
      // this.lid.style.transform = 'rotate(-45deg)'; // !!!
      return true;
    } else {
      console.log("Nope, not over")
      this.open.classed('hot', false);
      // this.lid.transition().duration(50).attr('y', LID_MOVEMENT);
      // this.lid.transition().duration(50).attr('cy', LID_MOVEMENT);
      // this.lid.style.transform = 'rotate(45deg)'; // !!!
      return false;
    }
  }

  // Accept drop if over opening
  acceptsDrop(x, y) {
    const LID_MOVEMENT = this.lid_movement();
    const ok = this._isOver(x, y);
    // reset visuals
    if (ok){ // !!!
        this.open.classed('hot', false);
        this.lid.transition().duration(50).attr('y', LID_MOVEMENT);
        this.lid.transition().duration(50).attr('cy', LID_MOVEMENT);
    }
    // this.lid.style.transform = 'rotate(45deg)';   /// !!!
    return ok;
  }
}
