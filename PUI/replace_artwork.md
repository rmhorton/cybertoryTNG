# Replacing Artwork in the Virtual Molbio Lab Prototype

This guide explains how to replace the placeholder SVG artwork for lab objects (Tube, Rack, Pipettor, TubeJar, TrashCan) with your own SVG created in **Inkscape**.

---

## General Principles

- Each lab object has a `group` element (`<g>`) in the SVG workspace.
- All SVG artwork for an object is contained inside `this.group.innerHTML`.
- You can replace the innerHTML with SVG exported from Inkscape.
- **Important:** Keep the element classes and IDs used by the code for interactions to work (e.g., `.tube-outline`, `.tube-fluid`, `.slot`, `.trash-open`, `.plunger`).

---

## Steps to Replace Artwork

### 1. Create or Modify SVG in Inkscape

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

---

### 2. Paste SVG into the Prototype

1. Open the JavaScript file defining the object (e.g., `tube.js`).
2. Locate the constructor of the class:
   ```javascript
   this.group.innerHTML = `<!-- paste your SVG here -->`;
   ```
3. Replace the existing placeholder SVG with your copied Inkscape code.
4. Ensure that any required elements keep their **class names**.

---

### 3. Verify Interaction

- Tubes must have `.tube-outline` and `.tube-fluid` for drag and fluid manipulation.
- Slots must have `.slot`.
- TrashCan lid and opening must have `.trash-lid` and `.trash-open`.
- Pipettor tip must have `.pip-tip` and plunger `.plunger`.
- TubeJar can keep `.jar` and `.jar-label`.

---

### 4. Save and Test

1. Save the modified JS file.
2. Open the HTML prototype in a browser.
3. Test dragging, snapping, aspirating/dispensing, and tube deletion.
4. If interactions fail, check that class names were not changed in the SVG.

---

### Notes

- Inline SVG is preferred for ease of attaching behaviors directly.
- You can animate SVG parts (like TrashCan lid) by manipulating attributes in code.
- Keep a backup of the original prototype before replacing artwork.

