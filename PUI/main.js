// main.js
// Assumes: tube.js, rack.js, pipettor.js, trashcan.js, tubejar.js are loaded first

// ---- Global workspace ----
const svg = d3.select('#workspace')
  .attr('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight * 0.95}`)
  .attr('preserveAspectRatio', 'xMinYMin meet');

// ---- Global lab registry ----
const LAB = {
  racks: [],
  tubes: [],
  pipettor: null,
  jar: null,
  trash: null
};

// ---- Instantiate racks ----
const rackA = new Rack(260, 110, 2, 8);
const rackB = new Rack(260, 300, 2, 8);
LAB.racks.push(rackA, rackB);

// ---- Pre-fill some reagent tubes in rackA ----
function randVol() { return Math.floor(100 + Math.random() * 100); }
const reagents = [
  new Tube(0, 0, 'EnzA', randVol()),
  new Tube(0, 0, 'Buffer', randVol()),
  new Tube(0, 0, 'dNTP', randVol())
];
// Attach to first 3 slots of rackA
reagents.forEach((t, i) => {
  t.attachToRack(rackA, rackA.slots[i]);
  LAB.tubes.push(t);
});

// ---- Pre-fill empty reaction tubes in rackB first row ----
for (let i = 0; i < 8; i++) {
  const t = new Tube(0, 0, `R${i + 1}`, 0);
  t.attachToRack(rackB, rackB.slots[i]);
  LAB.tubes.push(t);
}

// ---- Trash Can ----
LAB.trash = new TrashCan(80, 250);

// ---- Tube Jar ----
LAB.jar = new TubeJar(40, 60);

// ---- Pipettor ----
LAB.pipettor = new Pipettor(560, 120, LAB);

// ---- Console message for confirmation ----
console.log('Prototype ready: racks draggable, tubes draggable (snap to empty slots), tube jar spawns, trash deletes only at opening, pipettor aspirate/dispense with tip targeting.');
