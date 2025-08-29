// ===================== TrashCan =====================
class TrashCan {
  constructor(x, y) {
    this.tx = x;
    this.ty = y;

    // SVG group
    this.group = svg.append('g')
      .attr('transform', `translate(${x},${y})`);

    // Placeholder artwork (replace with Inkscape SVG)
    this.group.node().innerHTML = `
      <rect class="trash-body" x="0" y="28" width="90" height="110" rx="10" ry="10" fill="#9ca3af"/>
      <ellipse class="trash-open" cx="45" cy="28" rx="45" ry="12" fill="#4b5563"/>
      <rect class="trash-lid" x="0" y="10" width="90" height="18" rx="6" ry="6" fill="#6b7280"/>
      <rect class="trash-lid" x="30" y="2" width="30" height="8" rx="4" ry="4" fill="#6b7280"/>
    `;

    // references to key elements
    this.open = this.group.select('.trash-open');
    this.lid = this.group.selectAll('.trash-lid');
  }

  // Check if world coords (x,y) are over the trash opening
  _isOver(x, y) {
    const lx = x - this.tx, ly = y - this.ty;
    const cx = +this.open.attr('cx'), cy = +this.open.attr('cy');
    const rx = +this.open.attr('rx'), ry = +this.open.attr('ry');
    const nx = (lx - cx) / rx, ny = (ly - cy) / ry;
    return (nx * nx + ny * ny) <= 1;
  }

  // Highlight lid if a tube is over the opening
  highlightIfOver(x, y) {
    if (this._isOver(x, y)) {
      this.open.classed('hot', true);
      this.lid.transition().duration(180).attr('y', -6);
      return true;
    } else {
      this.open.classed('hot', false);
      this.lid.transition().duration(180).attr('y', 10);
      return false;
    }
  }

  // Accept drop if over opening
  acceptsDrop(x, y) {
    const ok = this._isOver(x, y);
    // reset visuals
    this.open.classed('hot', false);
    this.lid.transition().duration(120).attr('y', 10);
    return ok;
  }
}
