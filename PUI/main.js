// ================== main.js ==================
const svg = d3.select('#workspace')
  .attr('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight * 0.95}`)
  .attr('preserveAspectRatio', 'xMinYMin meet');

// ---- Utilities ----
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Global registry
const LAB = { tubes: [], racks: [], trash: null, jar: null, pipettor: null };

// ============== Create racks ==============
const rackA = new Rack(260, 110, 2, 8);
const rackB = new Rack(260, 300, 2, 8);
LAB.racks.push(rackA, rackB);

// ============== Create tubes ==============
// Random reagent tubes in rackA first 3 slots
function randVol() { return Math.floor(100 + Math.random() * 100); }
const reagents = [
  new Tube(40, 80, 'EnzA', randVol()),
  new Tube(80, 80, 'Buffer', randVol()),
  new Tube(120, 80, 'dNTP', randVol())
];
reagents.forEach((t, i) => t.attachToRack(rackA, rackA.slots[i]));

// Empty reaction tubes in rackB first row
for (let i = 0; i < 8; i++) {
  const t = new Tube(40 + i * 24, 220, `R${i + 1}`, 0);
  t.attachToRack(rackB, rackB.slots[i]);
}

// ============== TubeJar, TrashCan, Pipettor ==============
LAB.trash = new TrashCan(700, 360);
LAB.jar = new TubeJar(40, 60);
LAB.pipettor = new Pipettor(560, 120);

console.log('Lab ready: racks & tubes draggable, tube jar spawns, trash deletes at opening, pipettor aspirates/dispenses.');
