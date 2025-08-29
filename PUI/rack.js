// ===================== Rack =====================
class Rack {
  constructor(x, y, rows = 2, cols = 8, spacing = 34) {
    this.tx = x;
    this.ty = y;
    this.rows = rows;
    this.cols = cols;
    this.spacing = spacing;

    // SVG group for the rack
    this.group = svg.append('g')
      .attr('transform', `translate(${this.tx},${this.ty})`)
      .call(d3.drag()
        .on('start', (ev) => this.dragStart(ev))
        .on('drag',  (ev) => this.drag(ev))
        .on('end',   (ev) => this.dragEnd(ev))
      );

    // Placeholder artwork (replace with Inkscape SVG)
    this.group.node().innerHTML = `
      <rect class="rack-base" x="-16" y="-16" width="${cols*spacing+32}" height="${rows*spacing+32}" rx="10" ry="10"/>
    `;

    // slots: store local coords and occupancy
    this.slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = c * spacing;
        const ly = r * spacing;
        const circle = this.group.append('circle')
          .attr('class', 'slot')
          .attr('cx', lx)
          .attr('cy', ly)
          .attr('r', 11);
        this.slots.push({ r, c, lx, ly, occupied: false, circle });
      }
    }
  }

  // ---- drag behavior ----
  dragStart(ev) { this.group.raise(); }
  drag(ev) {
    this.tx += ev.dx;
    this.ty += ev.dy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);
  }
  dragEnd(ev) {}

  // ---- slot utilities ----
  toLocal(x, y) {
    return { lx: x - this.tx, ly: y - this.ty };
  }

  findEmptySlotNear(x, y) {
    const { lx, ly } = this.toLocal(x, y);
    let best = null, bestD = 14; // px radius
    for (const s of this.slots) {
      if (s.occupied) continue;
      const d = Math.hypot(s.lx - lx, s.ly - ly);
      if (d <= bestD) { best = s; bestD = d; }
    }
    return best;
  }

  highlightAt(x, y) {
    this.slots.forEach(s => s.circle.classed('highlight', false));
    const s = this.findEmptySlotNear(x, y);
    if (s) s.circle.classed('highlight', true);
  }

  clearHighlights() {
    this.slots.forEach(s => s.circle.classed('highlight', false));
  }
}
