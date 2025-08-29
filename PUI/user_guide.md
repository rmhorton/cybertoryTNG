# Virtual Molbio Lab Prototype – Requirements & User Guide

## Implemented Features & Requirements

### 1. Tube Object
- **Represents**: Individual lab tubes.
- **Attributes**:  
  - Label (e.g., `EnzA`, `R1`)  
  - Volume (0–200 µL)  
  - Parent rack and slot (when placed in a rack)
- **Methods / Behavior**:  
  - `attachToRack(rack, slot)` – place tube in a specific rack slot  
  - `detachFromRackToWorld()` – remove tube from rack to free-floating position  
  - Drag-and-drop with snapping to nearest empty rack slot  
  - Volume management (`setVolume`, `addVolume`, `removeVolume`) with visual fluid level  
  - Highlights when pipettor tip hovers over it  

### 2. Rack Object
- **Represents**: Tube racks with configurable rows and columns  
- **Attributes**:  
  - Position `(x, y)`  
  - Slot coordinates and occupancy state  
- **Methods / Behavior**:  
  - Draggable along with contained tubes  
  - Detect empty slots for snapping tube placement  
  - Highlights only valid empty slots when a tube is dragged over  

### 3. Pipettor Object
- **Simulates**: A lab pipettor  
- **Attributes**:  
  - Position `(x, y)`  
  - Capacity, current volume, target tube  
- **Methods / Behavior**:  
  - Draggable across workspace  
  - Tip detects which tube is underneath  
  - Plunger click: aspirates from tube if empty, dispenses if holding fluid  
  - Visual fill indicator  
  - Volume setting adjustable with on-pipettor buttons  

### 4. TubeJar Object
- **Represents**: Source of new tubes  
- **Behavior**:  
  - Click to spawn a new tube attached to the mouse cursor  
  - Logs creation and tube label to console  
- **Attributes**:  
  - Tracks tube count for unique labels  

### 5. TrashCan Object
- **Represents**: Trash for deleting tubes  
- **Behavior**:  
  - Detects when tube is dragged over opening  
  - Opening highlights and lid animates open when hovered  
  - Dropping a tube deletes it  

### 6. SVG Artwork Integration
- All objects use **inline SVG**  
- Each object’s `group.innerHTML` can be replaced with Inkscape-generated SVG  
- Expected element classes must remain for interactions to function:  
  `.tube-fluid`, `.tube-outline`, `.slot`, `.trash-open`, etc.  

### 7. Interactions
- **Tubes**: draggable, snap to empty slots, deletable via TrashCan  
- **Racks**: draggable, carry tubes along  
- **Pipettor**: draggable, aspirates and dispenses fluid from tubes  
- **TubeJar**: spawns new tubes at mouse position  
- **TrashCan**: lid animates, deletes tubes dropped on opening  

## User Guide

1. **Dragging Tubes and Racks**  
   - Click and drag tubes to move freely or snap into empty rack slots  
   - Click and drag a rack to move it with all contained tubes  

2. **Using the Pipettor**  
   - Drag pipettor tip over a tube  
   - Click plunger to aspirate from tube (if empty) or dispense (if holding fluid)  
   - Adjust volume using “+” and “−” buttons  

3. **Creating Tubes**  
   - Click TubeJar to spawn a new tube  
   - Drag new tube into rack slot or anywhere on workspace  

4. **Deleting Tubes**  
   - Drag tube to TrashCan opening  
   - Opening highlights and lid opens automatically  
   - Release tube to delete  

5. **Replacing Artwork**  
   - Replace `group.innerHTML` with inline SVG from Inkscape  
   - Keep expected element classes for interactions to continue  

6. **Console Logging**  
   - Tube creation, placement, aspiration, and dispensing events are logged for debugging
