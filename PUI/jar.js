// ================= TubeJar =================
class TubeJar {
  constructor(x, y) {
    this.tx = x;
    this.ty = y;
    this.count = 1; // numbering new tubes

    // Main group for Inkscape-ready SVG
    this.group = svg.append("g")
      .attr("transform", `translate(${x},${y})`)
      // Replace innerHTML with your Inkscape SVG
      .html(`
        <rect class="placeholder" x="0" y="0" width="90" height="110" rx="12" ry="12"></rect>
        <text x="45" y="130" text-anchor="middle">Tube Jar</text>
      `)
      .style('cursor', 'pointer')
      .on('click', () => this.spawn());
  }

  // Spawn a new tube next to the jar
  spawn() {
    const newTube = new Tube(this.tx + 110, this.ty + 10, `N${this.count++}`, 0);
    console.log(`TubeJar: spawned new tube ${newTube.label}`);
  }
}
