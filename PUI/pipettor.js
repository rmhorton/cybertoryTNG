// ================= Pipettor =================
class Pipettor {
  constructor(x, y) {
    this.tx = x;
    this.ty = y;
    this.capacity = 100;   // max µL
    this.setting = 10;     // current aspirate/dispense amount
    this.content = 0;      // current fluid inside
    this.targetTube = null;

    // Main group for Inkscape-ready SVG
    this.group = svg.append("g")
      .attr("transform", `translate(${x},${y})`)
      .call(d3.drag().on('drag', (ev) => this.onDrag(ev)))
      // Replace innerHTML with your Inkscape SVG
      .html(`
        <rect class="pip-body" x="0" y="10" width="18" height="70" rx="4" ry="4"></rect>
        <polygon class="pip-tip" points="9,80 6,96 12,96"></polygon>
        <circle class="plunger" cx="9" cy="0" r="8"></circle>
        <rect class="vol-btn" x="22" y="18" width="14" height="14"></rect>
        <rect class="vol-btn" x="22" y="36" width="14" height="14"></rect>
        <text class="vol-text" x="29" y="15">+</text>
        <text class="vol-text" x="29" y="33">−</text>
        <text class="vol-text" x="29" y="56">${this.setting} µL</text>
        <rect class="pip-fill" x="2" y="80" width="14" height="0"></rect>
      `);

    // Reference to fill rectangle (fluid display)
    this.fillRect = this.group.select('.pip-fill');

    // Event listeners
    this.group.select('.plunger').on('click', () => this.onPlunger());
    this.group.selectAll('.vol-btn').nodes().forEach((btn, i) => {
      btn.addEventListener('click', () => this.adjust(i === 0 ? 1 : -1));
    });
  }

  // --- Drag handling ---
  onDrag(ev) {
    this.tx += ev.dx;
    this.ty += ev.dy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);
    this.updateTarget();
  }

  // Compute tip world coordinates
  tipPoint() {
    return { x: this.tx + 9, y: this.ty + 96 };
  }

  // Update the tube under the tip
  updateTarget() {
    const p = this.tipPoint();
    let found = null;
    LAB.tubes.forEach(t => {
      // World position of tube
      let wx, wy;
      if(t.parentRack){
        const lx = t.slot.lx - 6, ly = t.slot.ly - 15;
        wx = t.parentRack.tx + lx; wy = t.parentRack.ty + ly;
      } else { wx = t.tx; wy = t.ty; }
      if(p.x >= wx && p.x <= wx + 12 && p.y >= wy && p.y <= wy + 30){
        found = t;
      }
      t.group.classed('tube-highlight', false);
    });
    if(found) found.group.classed('tube-highlight', true);
    this.targetTube = found;
  }

  // Adjust pipettor setting
  adjust(delta) {
    this.setting = clamp(this.setting + delta, 1, this.capacity);
    this.group.select('.vol-text').text(`${this.setting} µL`);
  }

  // Handle plunger click
  onPlunger() {
    if(!this.targetTube){
      console.log('Pipettor: no target tube under tip.');
      return;
    }
    if(this.content <= 0){
      // Aspirate
      const want = this.setting;
      const got = this.targetTube.removeVolume(want);
      this.content = clamp(this.content + got, 0, this.capacity);
      console.log(`Aspirated ${got} µL from ${this.targetTube.label}. Content=${this.content} µL`);
    } else {
      // Dispense
      const give = this.content;
      this.targetTube.addVolume(give);
      this.content = 0;
      console.log(`Dispensed ${give} µL into ${this.targetTube.label}. Content=${this.content} µL`);
    }
    this.updateFill();
  }

  // Update fluid display
  updateFill() {
    const h = 70 * (this.content / this.capacity);
    this.fillRect.attr('y', 10 + 70 - h).attr('height', h);
  }
}
