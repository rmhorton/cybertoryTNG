// ===================== Tube =====================
class Tube {
  constructor(x, y, label = '', volume = 0) {
    this.label = label || `T${LAB.tubes.length}`;
    this.volume = volume; // µL, max 200
    this.parentRack = null; // current rack
    this.slot = null;       // current slot in rack
    this.tx = x; this.ty = y;

    // create SVG group
    this.group = svg.append('g')
      .attr('class', 'tube')
      .attr('transform', `translate(${this.tx},${this.ty})`)
      .call(d3.drag()
        .on('start', (ev) => this.onDragStart(ev))
        .on('drag',  (ev) => this.onDrag(ev))
        .on('end',   (ev) => this.onDragEnd(ev))
      );

    // placeholder artwork (replace with Inkscape inline SVG)
    this.group.node().innerHTML = `
      <rect class="tube-outline" x="0" y="0" width="12" height="30" rx="3" ry="3"/>
      <rect class="tube-fluid" x="1" width="10" height="0"/>
      <text class="tube-label" x="6" y="42">${this.label}</text>
    `;

    this.fluid = this.group.select('.tube-fluid');

    LAB.tubes.push(this);
    console.log(`Tube ${this.label} created (${this.volume} µL)`);
    this.setVolume(this.volume);
  }

  // --- attach/detach ---
  attachToRack(rack, slot) {
    this.parentRack = rack;
    this.slot = slot;
    slot.occupied = true;
    rack.clearHighlights();

    // reparent to rack
    this.group.remove();
    this.group = rack.group.append(() => this.group.node());

    // position within slot
    const lx = slot.lx - 6;
    const ly = slot.ly - 15;
    this.group.attr('transform', `translate(${lx},${ly})`);
    console.log(`Tube ${this.label} placed in rack @ r${slot.r}c${slot.c}`);
  }

  detachFromRackToWorld() {
    if (!this.parentRack) return;
    const rack = this.parentRack;
    const slot = this.slot;
    const lx = slot.lx - 6;
    const ly = slot.ly - 15;
    const wx = rack.tx + lx;
    const wy = rack.ty + ly;

    slot.occupied = false;
    this.parentRack = null;
    this.slot = null;

    this.group.remove();
    this.group = svg.append(() => this.group.node());
    this.tx = wx;
    this.ty = wy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);
  }

  // --- drag lifecycle ---
  onDragStart(ev) {
    this.startTx = this.tx;
    this.startTy = this.ty;
    if (this.parentRack) this.detachFromRackToWorld();
    this.group.raise();
  }

  onDrag(ev) {
    this.tx += ev.dx;
    this.ty += ev.dy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);

    // highlight nearby empty slots
    LAB.racks.forEach(r => r.highlightAt(this.centerX(), this.centerY()));

    // trash hover effect
    if (LAB.trash) LAB.trash.highlightIfOver(this.centerX(), this.centerY());
  }

  onDragEnd(ev) {
    // check trash first
    if (LAB.trash && LAB.trash.acceptsDrop(this.centerX(), this.centerY())) {
      console.log(`Tube ${this.label} deleted.`);
      this.group.remove();
      return;
    }

    // check racks
    for (const rack of LAB.racks) {
      const slot = rack.findEmptySlotNear(this.centerX(), this.centerY());
      if (slot) { this.attachToRack(rack, slot); return; }
    }

    // otherwise snap back
    this.tx = this.startTx;
    this.ty = this.startTy;
    this.group.transition().duration(150).attr('transform', `translate(${this.tx},${this.ty})`);
  }

  // --- utility ---
  centerX() { return this.tx + 6; }
  centerY() { return this.ty + 15; }

  // --- fluid control ---
  setVolume(uL) {
    this.volume = Math.max(0, Math.min(200, uL));
    const h = 30 * (this.volume / 200);
    this.fluid.attr('y', 30 - h).attr('height', h);
  }

  addVolume(uL) { this.setVolume(this.volume + uL); }
  removeVolume(uL) {
    const take = Math.min(this.volume, uL);
    this.setVolume(this.volume - take);
    return take;
  }
}
