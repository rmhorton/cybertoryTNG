// ===================== Tube (Inkscape-ready, fully wired) =====================
// Constructor signature: new Tube(x, y, label, volume)
class Tube {
  constructor(x, y, label = 'Tube', volume = 0) {
    this.tx = x;            // world X (when free)
    this.ty = y;            // world Y (when free)
    this.label = label;
    this.volume = volume;   // µL (0..200)
    this.parentRack = null; // Rack instance when placed
    this.slot = null;       // slot object when placed
    this.isLidOpen = false;

    // Create root group as a d3 selection (Inkscape-ready)
    this.group = svg.append('g')
      .attr('class', 'tube')
      .attr('transform', `translate(${this.tx},${this.ty})`)
      .call(d3.drag()
        .on('start', (ev) => this.onDragStart(ev))
        .on('drag',  (ev) => this.onDrag(ev))
        .on('end',   (ev) => this.onDragEnd(ev))
      );

    // Insert Inkscape-friendly SVG snippet.
    // Keep expected classes so JS can find parts:
    //  - .tube-body  (group or shape for click/appearance)
    //  - .tube-lid   (group containing lid shapes; will be rotated to open)
    //  - .tube-fluid (rect that shows fluid level)
    //  - .tube-label (text showing label/volume)
    //
    // You can replace the entire string below with your Inkscape group markup,
    // but preserve these class names if you want the code to keep working.
    const fluidH = 30 * (Math.max(0, Math.min(this.volume, 200)) / 200); // px
    const fluidY = 30 - fluidH;
    // tube-lid pivots on the lower left corner (0, 0)
    this.group.node().innerHTML = `
      <g class="tube-body">
        <rect class="tube-outline" x="0" y="0" width="12" height="30" rx="3" ry="3" fill="#ffffff" stroke="#111827"/>
      </g>
      <rect class="tube-fluid" x="1" y="${fluidY}" width="10" height="${fluidH}" fill="#60a5fa"/>
      <g class="tube-lid"">
        <rect x="-1" y="-6" width="14" height="4" rx="2" ry="2" fill="#d1f2ff" stroke="#0b5567"/>
      </g>
      <text class="tube-label" x="6" y="42" font-size="9" text-anchor="middle">${this.label} (${this.volume}µL)</text>
    `;

    // d3 selections for parts
    this.fluidSel = this.group.select('.tube-fluid');
    this.lidSel   = this.group.select('.tube-lid');
    this.bodySel  = this.group.select('.tube-body');
    this.labelSel = this.group.select('.tube-label');

    // When user clicks the tube group, toggle lid (stop propagation so workspace handlers don't close it)
    this.group.on('click', (event) => {
      // event is the DOM event (d3 passes it as first arg)
      event.stopPropagation && event.stopPropagation();
      this.toggleLid();
    });

    // Helpful console
    console.log(`Tube ${this.label} created (${this.volume} µL)`);
  }

  // ---------------- placement ----------------
  // Attach into a rack slot object {r,c,lx,ly,occupied,circle}
  attachToRack(rack, slot) {
    if (!rack || !slot) return false;
    if (slot.occupied) return false;

    // free previous if any
    if (this.parentRack && this.slot) {
      this.slot.occupied = false;
    }

    // mark slot occupied
    slot.occupied = true;
    this.parentRack = rack;
    this.slot = slot;

    // Reparent DOM node into rack.group (use DOM appendChild on rack.group.node())
    const node = this.group.node();
    // remove from current parent, append to rack DOM node
    node.remove();
    rack.group.node().appendChild(node);

    // Set local transform (center the 12px-wide tube on slot center)
    const localX = slot.lx - 6;  // 12px tube width -> left = center - 6
    const localY = slot.ly - 15; // 30px height -> top = center - 15
    this.group = d3.select(node); // rewrap selection
    this.group.attr('transform', `translate(${localX},${localY})`);

    console.log(`Tube ${this.label} attached to rack at r${slot.r} c${slot.c}`);
    return true;
  }

  // Detach from rack and append to workspace (world coords)
  detachFromRackToWorld() {
    if (!this.parentRack || !this.slot) return;

    const rack = this.parentRack;
    const slot = this.slot;

    // compute world pos from rack + local slot
    const localX = slot.lx - 6;
    const localY = slot.ly - 15;
    const worldX = rack.tx + localX;
    const worldY = rack.ty + localY;

    // free slot
    slot.occupied = false;
    this.parentRack = null;
    this.slot = null;

    // reparent node to root svg DOM
    const node = this.group.node();
    node.remove();
    svg.node().appendChild(node); // svg is d3 selection; .node() returns DOM element
    this.group = d3.select(node);

    // set transform to world coords and update internal tx/ty
    this.tx = worldX; this.ty = worldY;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);
  }

  // ---------------- drag lifecycle (D3 drag events) ----------------
  onDragStart(ev) {
    // ev is d3 drag event
    // record start world pos
    if (this.parentRack && this.slot) {
      // if attached, detach to allow free drag
      this.detachFromRackToWorld();
    } else {
      // keep current tx/ty
      this.tx = this.tx ?? 0;
      this.ty = this.ty ?? 0;
    }
    // bring to front
    this.group.raise();
    this.startTx = this.tx; this.startTy = this.ty;
  }

  onDrag(ev) {
    // ev.dx, ev.dy are relative deltas
    this.tx = (this.tx ?? 0) + ev.dx;
    this.ty = (this.ty ?? 0) + ev.dy;
    this.group.attr('transform', `translate(${this.tx},${this.ty})`);

    // highlight nearest slot(s) on racks
    if (Array.isArray(LAB.racks)) {
      LAB.racks.forEach(r => r.highlightAt(this.centerX(), this.centerY()));
    }
    // Trash hover affordance (if present)
    if (LAB.trash && typeof LAB.trash.highlightIfOver === 'function') {
      LAB.trash.highlightIfOver(this.centerX(), this.centerY());
    }
  }

  onDragEnd(ev) {
    // Try delete first (trash)
    if (LAB.trash && typeof LAB.trash.acceptsDrop === 'function' && LAB.trash.acceptsDrop(this.centerX(), this.centerY())) {
      console.log(`Tube ${this.label} deleted.`);
      this.group.remove();
      // remove from LAB.tubes array if you manage it there (optional)
      return;
    }

    // Try to snap to a rack slot (first match)
    if (Array.isArray(LAB.racks)) {
      for (const rack of LAB.racks) {
        const slot = rack.findEmptySlotNear(this.centerX(), this.centerY());
        if (slot) { this.attachToRack(rack, slot); return; }
      }
    }

    // Snap back to start pos if not placed
    this.tx = this.startTx; this.ty = this.startTy;
    this.group.transition().duration(150).attr('transform', `translate(${this.tx},${this.ty})`);
  }

  // ---------------- helpers ----------------
  // World center coordinates of the tube (used by pipettor/slot checks)
  centerX() {
    if (this.parentRack && this.slot && this.parentRack.tx !== undefined) {
      const localX = this.slot.lx - 6; // left offset inside rack
      return this.parentRack.tx + localX + 6;
    } else {
      return (this.tx ?? 0) + 6;
    }
  }

  centerY() {
    if (this.parentRack && this.slot && this.parentRack.ty !== undefined) {
      const localY = this.slot.ly - 15;
      return this.parentRack.ty + localY + 15;
    } else {
      return (this.ty ?? 0) + 15;
    }
  }

  // Volume control and visual update
  setVolume(uL) { // hard-coded 200 microliter capacity
    this.volume = Math.max(0, Math.min(200, uL));
    const h = 30 * (this.volume / 200);
    const y = 30 - h;
    this.fluidSel = this.group.select('.tube-fluid'); // ensure selection valid after reparent
    this.fluidSel.attr('y', y).attr('height', h);
    // update label
    this.labelSel = this.group.select('.tube-label');
    this.labelSel.text(`${this.label} (${this.volume}µL)`);
  }
  addVolume(uL) { this.setVolume(this.volume + uL); }
  removeVolume(uL) { const take = Math.min(this.volume, uL); this.setVolume(this.volume - take); return take; }

  // Lid controls (explicit methods so other code can open/close)
  openLid() {
    if (!this.isLidOpen) {
      // rotate around approximate hinge point (use transform with cx cy)
      // pivot must be chosen to match SVG snippet: assume 0 0 
      this.lidSel = this.group.select('.tube-lid');
      this.lidSel.interrupt().transition().duration(100).attr('transform', 'rotate(-120 0 0)');
      this.isLidOpen = true;
    }
  }
  closeLid() {
    if (this.isLidOpen) {
      this.lidSel = this.group.select('.tube-lid');
      this.lidSel.interrupt().transition().duration(100).attr('transform', 'rotate(0 0 0)');
      this.isLidOpen = false;
    }
  }
  toggleLid() { // !!! not used in code; LAB.tubes[1].toggleLid() 
    if (this.isLidOpen) this.closeLid(); else this.openLid();
  }

  // Remove tube from DOM
  destroy() {
    this.group.remove();
  }
}
