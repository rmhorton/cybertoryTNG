class Pipettor {
  constructor(x, y) {
    this.tx = x;
    this.ty = y;
    this.capacity = 100;    // µL max
    this.setting = 10;      // µL per operation
    this.content = 0;       // current content
    this.targetTube = null; // tube under tip

    // Group for entire pipettor
    this.group = svg.append('g')
      .attr('transform', `translate(${x},${y})`)
      .call(d3.drag().on('drag', (ev) => this.onDrag(ev)));

    // Inline SVG: body, fill, tip, plunger, volume controls
    this.group.node().innerHTML = `
      <rect class="pip-body" x="0" y="10" width="18" height="70" rx="4" ry="4"/>
      <rect class="pip-fill" x="2" y="80" width="14" height="0"/>
      <polygon class="pip-tip" points="9,96 6,80 12,80"/>
      <circle class="plunger" cx="9" cy="0" r="8"/>
      <rect class="vol-btn" x="22" y="18" width="14" height="14"/>
      <rect class="vol-btn" x="22" y="36" width="14" height="14"/>
      <text class="vol-text" x="29" y="15">+</text>
      <text class="vol-text" x="29" y="33">−</text>
      <text class="vol-text" x="29" y="56">${this.setting} µL</text>
    `;

    this.fillRect = this.group.select('.pip-fill');
    this.volText = this.group.selectAll('.vol-text').filter((d, i) => i === 2); // the content text

    // Event listeners
    this.group.select('.plunger').on('click', () => this.onPlunger());
    this.group.selectAll('.vol-btn').each((d, i, nodes) => {
      const delta = (i === 0) ? +1 : -1;
      d3.select(nodes[i]).on('click', () => this.adjust(delta));
    });

    this.updateFill();
  }

  onDrag(ev) {
    this.tx += ev.dx;
    this.ty += ev.dy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);
    this.updateTarget();
  }

  tipPoint() {
    // Use the tip polygon bounding box in screen coordinates
    const rect = this.group.select('.pip-tip').node().getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height;
    return { x, y };
  }

  updateTarget() {
    const p = this.tipPoint();
    let found = null;

    LAB.tubes.forEach(t => {
      const tubeRect = t.group.node().getBoundingClientRect();
      if (p.x >= tubeRect.left && p.x <= tubeRect.right &&
          p.y >= tubeRect.top && p.y <= tubeRect.bottom) {
        found = t;
      }
      t.group.classed('tube-highlight', false);
      t.closeLid();
    });

    if (found){
        found.group.classed('tube-highlight', true);
        found.openLid();
    }
    this.targetTube = found;
  }

  adjust(delta) {
    this.setting = Math.max(1, Math.min(this.setting + delta, this.capacity));
    this.volText.text(`${this.setting} µL`);
  }

  onPlunger() {
    if (!this.targetTube) {
      console.log('Pipettor: no tube under tip.');
      return;
    }
    if (this.content <= 0) {
      // Aspirate
      const want = this.setting;
      const got = this.targetTube.removeVolume(want);
      this.content = Math.min(this.content + got, this.capacity);
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

  updateFill() {
    const h = 70 * (this.content / this.capacity);
    this.fillRect.attr('y', 10 + 70 - h).attr('height', h);
  }
}
