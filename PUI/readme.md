# Pictoral User Interface (PUI) for the Cybertory Virtual Molecular Biology Laboratory

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


## Replacing Artwork in the Virtual Molbio Lab Prototype

This guide explains how to replace the placeholder SVG artwork for lab objects (Tube, Rack, Pipettor, TubeJar, TrashCan) with your own SVG created in **Inkscape**.

---

### General Principles

- Each lab object has a `group` element (`<g>`) in the SVG workspace.
- All SVG artwork for an object is contained inside `this.group.innerHTML`.
- You can replace the innerHTML with SVG exported from Inkscape.
- **Important:** Keep the element classes and IDs used by the code for interactions to work (e.g., `.tube-outline`, `.tube-fluid`, `.slot`, `.trash-open`, `.plunger`).

---

### Steps to Replace Artwork

#### 1. Create or Modify SVG in Inkscape

1. Open Inkscape.
2. Draw your object (Tube, Rack, Pipettor, etc.).
3. Assign class names to elements as required by the code.  
   Example for a Tube:
   ```xml
   <rect class="tube-outline" ... />
   <rect class="tube-fluid" ... />
   <text class="tube-label" ...>R1</text>
   ```
4. Group all elements (`Ctrl+G`).
5. Select the group and copy as **SVG code** (File → Save As → Plain SVG, or `Edit → XML Editor → Copy`).



To assign an ID to an item or group in Inkscape, follow these steps:
* Select the object or group:
* Use the Selection tool (F1) to click on the item or group you want to assign an ID to.
* Open Object Properties:
* Go to Object > Object Properties (or press Shift + Ctrl + O). This will open the Object Properties dialog.
* Assign the ID:
* In the Object Properties dialog, locate the ID field.
* Enter the desired unique identifier for your object or group in this field.
Optionally, you can also assign a Label and Title for better organization and identification within Inkscape.

---

#### 2. Paste SVG into the Prototype

1. Open the JavaScript file defining the object (e.g., `tube.js`).
2. Locate the constructor of the class:
   ```javascript
   this.group.innerHTML = `<!-- paste your SVG here -->`;
   ```
3. Replace the existing placeholder SVG with your copied Inkscape code.
4. Ensure that any required elements keep their **class names**.

---

#### 3. Verify Interaction

- Tubes must have `.tube-outline` and `.tube-fluid` for drag and fluid manipulation.
- Slots must have `.slot`.
- TrashCan lid and opening must have `.trash-lid` and `.trash-open`.
- Pipettor tip must have `.pip-tip` and plunger `.plunger`.
- TubeJar can keep `.jar` and `.jar-label`.

---

#### 4. Save and Test

1. Save the modified JS file.
2. Open the HTML prototype in a browser.
3. Test dragging, snapping, aspirating/dispensing, and tube deletion.
4. If interactions fail, check that class names were not changed in the SVG.

---

#### Notes

- Inline SVG is preferred for ease of attaching behaviors directly.
- You can animate SVG parts (like TrashCan lid) by manipulating attributes in code.
- Keep a backup of the original prototype before replacing artwork.

