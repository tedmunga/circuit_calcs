function updateGroupDropdownFromTable() {
  const table = document.getElementById('cableTable');
  const select = document.getElementById('groupSelect');
  const rows = table.querySelectorAll('tbody tr');

  select.innerHTML = '<option value="">-- Select --</option>';

  rows.forEach(row => {
    const groupId = row.cells[0].textContent.trim();
    if (groupId) {
      const option = document.createElement('option');
      option.value = groupId;
      option.textContent = groupId;
      select.appendChild(option);
    }
  });
}

function updateLoadDropdownFromTable() {
  const table = document.getElementById('loadTable');
  const select = document.getElementById('loadSelect');
  const rows = table.querySelectorAll('tbody tr');

  select.innerHTML = '<option value="">-- Select --</option>';

  rows.forEach(row => {
    const loadId = row.cells[0].textContent.trim();
    if (loadId) {
      const option = document.createElement('option');
      option.value = loadId;
      option.textContent = loadId;
      select.appendChild(option);
    }
  });
}
    
document.getElementById('groupSelect').addEventListener('change', (e) => {
  const selectedId = e.target.value;
  logger('debug', 'groupSelect value is: ', e.target.value);
  const table = document.getElementById('cableTable');
  const rows = table.querySelectorAll('tbody tr');

  let found = false;
  rows.forEach(row => {
    if (row.cells[0].textContent.trim() === selectedId) {
      document.getElementById('groupCableR').value = row.cells[10].textContent.trim();
      document.getElementById('groupCableX').value = row.cells[11].textContent.trim();
      logger('debug', 'found value is: ', selectedId);
      found = true;
    }
  });

  if (!found) {
    document.getElementById('groupCableR').value = '';
    document.getElementById('groupCableX').value = '';
  }
  updateComponentParameters();
});

document.getElementById('loadSelect').addEventListener('change', (e) => {
  const selectedId = e.target.value;
  logger('debug', 'loadSelect value is: ', e.target.value);
  const table = document.getElementById('loadTable');
  const rows = table.querySelectorAll('tbody tr');

  let found = false;
  rows.forEach(row => {
    if (row.cells[0].textContent.trim() === selectedId) {
      document.getElementById('loadR').value = row.cells[2].querySelector('input.resistance').value;
      document.getElementById('loadX').value = row.cells[3].querySelector('input.reactance').value;
      logger('debug', 'load id found value is: ', selectedId);
      found = true;
    }
  });

  if (!found) {
    document.getElementById('loadR').value = '';
    document.getElementById('loadX').value = '';
    logger('debug', 'found value is: ', e.target.value);
  }
  updateComponentParameters();
});

document.getElementById('groupCableCheckBox').addEventListener('change', (e) => {
    document.getElementById('resistance').disabled = e.target.checked;
    document.getElementById('reactance').disabled = e.target.checked;
    document.getElementById('groupSelect').disabled = !e.target.checked;
    useCableGroup = e.target.checked;
});


  function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
  }
      
    class Node {
      constructor(x, y, isGround = false, nodeId = null) {
        this.x = x;
        this.y = y;
        this.voltage = null;
        this.isGround = isGround;
        this.nodeId = ( nodeId === null ) ? getNextUnusedNodeId() : nodeId;
        this.connectedNodeList = new Set(); // Track connected nodes
      }

      // Method to add a connected node
      addConnectedNode(node) {
        this.connectedNodeList.add(node);
      }

      draw() {
        fill(this.isGround ? 'green' : 'black');
        noStroke();
        ellipse(this.x, this.y, 8, 8);
        fill(0);
        textSize(8);
        textAlign(LEFT, BOTTOM);
        text(`N${this.nodeId}`, this.x + 3, this.y - 3);
      }
    }

    class Component {
      constructor(x, y, type, params, startNode, endNode) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.params = params;
        this.startNode = startNode;
        this.endNode = endNode;
        this.rotation = 0;
        this.nodesMoved = false;
        this.current = null;
        this.index = null;
      }
      draw() {
        // Set stroke color for the line based on selection
        stroke(selectedComponent === this ? 'purple' : 0); // Blue when selected, black otherwise
        strokeWeight(2); // Optional: Increase line thickness for visibility
        line(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y);

        noStroke();
        push();
        translate(this.x, this.y);
        rotate(radians(this.rotation));
        // Set fill color for component body based on selection
        fill(selectedComponent === this ? 'purple' : 0);
        // noStroke(); // Uncomment if you don't want an outline on the body

        if (this.type === 'voltage') {
          let fillColour = phaseColourMap.get(this.params.angle)[0];
          let textColour = phaseColourMap.get(this.params.angle)[1];
          fill(selectedComponent === this ? 'purple' : fillColour);
          stroke(0);
          strokeWeight(1);
          ellipse(0, 0, 20, 20);
          noStroke();
          fill(selectedComponent === this ? 'white' : textColour);
          textSize(8);
          textAlign(CENTER, CENTER);
          text(`C${this.index}`, 0, 0); // Index at center
          fill(0);
          textSize(8);
          textAlign(CENTER, BOTTOM);
          textStyle(NORMAL);
          textFont('Arial');
          text(`${this.params.voltage.toFixed(1)}∠${this.params.angle.toFixed(1)}° V`, 0, -12); // Below center
        } else if (this.type === 'conductor') {
          rect(-10, -10, 20, 20);
          fill(255);
          textSize(8);
          textAlign(CENTER, CENTER);
          text(`C${this.index}`, 0, 0); // Index at center
          fill(0);
          textSize(8);
          textAlign(CENTER, BOTTOM);
          if (this.params.resistance !== 0 || this.params.reactance !== 0) {
            text(`R=${this.params.resistance.toFixed(3)}, X=${this.params.reactance.toFixed(3)}`, 0, -12);
          }
        } else if (this.type === 'load') {
          let tri_size = 12;
          stroke(0);
          strokeWeight(1);
          fill(selectedComponent === this ? 'purple' : 'yellow');
          triangle(-tri_size, -tri_size, tri_size, -tri_size, 0, tri_size);
          fill(selectedComponent === this ? 'white' : 'black');
          noStroke();   
          textSize(8);
          textAlign(CENTER, CENTER);
          text(`C${this.index}`, 0, -5); // Index slightly below center
          fill(0);
          textSize(8);
          textAlign(CENTER, TOP);
          if (this.params.resistance !== 0 || this.params.reactance !== 0) {
            text(`R=${this.params.resistance.toFixed(1)}, X=${this.params.reactance.toFixed(2)}`, 0, -20); // Above base
          }
        } else if (this.type === 'connection') {
          //~ line(-10, 0, 10, 0);
          //~ fill(255);
          //~ textSize(8);
          //~ textAlign(CENTER, CENTER);
          //~ text(`C${this.index}`, 0, -3); // Index slightly below center
          //~ fill(0);
          //~ textSize(8);
          //~ textAlign(CENTER, TOP); // Align with base of triangle
        }
        pop();
      }
    }

    let nodes = [];
    let components = [];
    let mode = 'select';
    let selectedComponent = null;
    let useCableGroup = false;
    let dragging = false;
    let draggingNode = null;
    let showResults = false;
    let nodeMap = new Map();
    let componentMap = new Map();
    let phaseColourMap = new Map([
                                  [0,   ['red',  'white']],
                                  [360, ['red',  'white']],
                                  [-120,['white','black']],
                                  [240, ['white','black']],
                                  [-240,['blue', 'white']],
                                  [120, ['blue', 'white']]
                                ]);
    
    // the creation of this function was only required due to 
    // multiple node's being created witht he same ID and manual
    // fixing of the json file with known large ID values that weren't 
    // used.
    function getNextUnusedNodeId() {
      let usedIds = new Set();
      for (let node of nodeMap.values()) {
        usedIds.add(node.nodeId);
      }
      let nextId = 0;
      while (usedIds.has(nextId)) {
        nextId++;
      }
      console.log('getNextUnusedNodeId returning. Next Node ID:', nextId);
      return nextId;
    }
    
//==============================================================================

    function getNextUnusedComponentId() {
      let usedIds = new Set();
      for (let comp of componentMap.values()) {
        usedIds.add(comp.index);
      }
      let nextId = 0;
      while (usedIds.has(nextId)) {
        nextId++;
      }
      console.log('getNextUnusedComponentId returning. Next Component ID:', nextId);
      return nextId;
    }
    
//==============================================================================

    function setMode(newMode) {
      mode = newMode;
      if (!selectedComponent) {
        document.getElementById('vMag').value = mode === 'voltage' ? document.getElementById('vMag').value || '' : '0';
        document.getElementById('vAngle').value = mode === 'voltage' ? document.getElementById('vAngle').value || '' : '0';
        document.getElementById('resistance').value = (mode === 'conductor' || mode === 'load') ? document.getElementById('resistance').value || '0' : '0';
        document.getElementById('reactance').value = (mode === 'conductor' || mode === 'load') ? document.getElementById('reactance').value || '0' : '0';
        //~ if (mode === 'voltage') {
          //~ document.getElementById('resistance').disabled = true;
          //~ document.getElementById('reactance').disabled = true;
        //~ } else {
          //~ document.getElementById('resistance').disabled = false;
          //~ document.getElementById('reactance').disabled = false;
        //~ }
      }
    }

    function updateComponentParameters() {
      if (!selectedComponent) return;
      let params = {
        voltage: parseFloat(document.getElementById('vMag').value) || 0,
        angle: parseFloat(document.getElementById('vAngle').value) || 0,
        resistance: useCableGroup 
            ? parseFloat(document.getElementById('groupCableR').value) || 0 
            : parseFloat(document.getElementById('resistance').value) || 0,
        reactance: useCableGroup 
            ? parseFloat(document.getElementById('groupCableX').value) || 0 
            : parseFloat(document.getElementById('reactance').value) || 0,
        group: useCableGroup 
            ? parseInt(document.getElementById('groupSelect').value) || 0 
            : 0
      };
      if (selectedComponent.type === 'voltage') {
        params.resistance = 0;
        params.reactance = 0;
      }
      console.log(`Updating ${selectedComponent.type} C${selectedComponent.index} params:`, params);
      selectedComponent.params = params;
      redraw();
    }

    document.getElementById('vMag').addEventListener('input', updateComponentParameters);
    document.getElementById('vAngle').addEventListener('input', updateComponentParameters);
    document.getElementById('resistance').addEventListener('input', updateComponentParameters);
    document.getElementById('reactance').addEventListener('input', updateComponentParameters);
//    document.getElementById('groupSelect').addEventListener('input', updateComponentParameters);
//    document.getElementById('groupCableX').addEventListener('input', updateComponentParameters);

    function rotateSelected() {
      if (!selectedComponent) return;
      selectedComponent.rotation = (selectedComponent.rotation + 90) % 360;
      redraw();
    }

    function deleteSelected() {
      if (!selectedComponent) return;
      let startNode = selectedComponent.startNode;
      let endNode = selectedComponent.endNode;
      components = components.filter(c => c !== selectedComponent);
      let startNodeUsed = components.some(c => c.startNode === startNode || c.endNode === startNode);
      let endNodeUsed = components.some(c => c.startNode === endNode || c.endNode === endNode);
      if (!startNodeUsed) nodes = nodes.filter(n => n !== startNode);
      if (!endNodeUsed) nodes = nodes.filter(n => n !== endNode);
      selectedComponent = null;
      dragging = false;
      draggingNode = null;
      showResults = false;
      document.getElementById('vMag').value = mode === 'voltage' ? document.getElementById('vMag').value || '' : '0';
      document.getElementById('vAngle').value = mode === 'voltage' ? document.getElementById('vAngle').value || '' : '0';
      document.getElementById('resistance').value = (mode === 'conductor' || mode === 'load') ? document.getElementById('resistance').value || '0' : '0';
      document.getElementById('reactance').value = (mode === 'conductor' || mode === 'load') ? document.getElementById('reactance').value || '0' : '0';
      componentMap.clear();
      updateNodeMap();
      components.forEach((c, i) => componentMap.set(c.index, c));
      redraw();
    }

    function deleteAll() {
      showResults = !showResults;
      nodes = [];
      components = [];
      redraw();
    }
    
    function toggleResults() {
      showResults = !showResults;
      redraw();
    }

    function setup() {

      let canvas = createCanvas(1920, 1080);
      canvas.parent('canvas-container');
      textAlign(CENTER, CENTER);
      textFont('Courier New');
      //textFont('Arial'); // Set default font
      redraw();
      
    }

    function draw() {
      background(255);
      stroke(200);
      strokeWeight(1)
      textStyle(NORMAL);
      textFont('Arial');
      for (let x = 0; x < width; x += 20) line(x, 0, x, height);
      for (let y = 0; y < height; y += 20) line(0, y, width, y);
      noStroke();
      nodes.forEach(n => n.draw());
      components.forEach(c => c.draw());
      if (showResults) {
        nodes.forEach(n => {
          let [mag, angle] = n.voltage ? complexToPolar(n.voltage) : [0, 0];
          let connectedComponents = components.filter(c => c.startNode === n || c.endNode === n);
          let rotation = connectedComponents.length > 0 ? connectedComponents[0].rotation : 0;
          push();
          translate(n.x, n.y);
          rotate(radians(rotation));
          fill(0);
          textSize(8);
          text(`${mag.toFixed(3)}∠${angle.toFixed(1)}° V`, 3, -15);
          pop();
        });
        components.forEach(c => {
          if ((c.type === 'conductor' || c.type === 'load' || c.type === 'voltage' || c.type === 'connection') && c.current) {
            let [mag, angle] = complexToPolar(c.current);
            let midX = c.x;
            let midY = c.y;
            push();
            translate(midX, midY);
            rotate(radians(c.rotation));
            fill(0);
            textSize(8);
            textAlign(CENTER, CENTER);
            text(`${mag.toFixed(3)}∠${angle.toFixed(1)}° A`, 0, 20); // Display current below component
            pop();
          }
        });
      }
    }

    function mousePressed(event) {
      if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height){
          logger('debug', 'MousePressed: 361 returning');
           return;
      }
      let gridX = Math.round(mouseX / 20) * 20;
      let gridY = Math.round(mouseY / 20) * 20;

      if (event.target.tagName === 'BUTTON' || 
          event.target.tagName === 'INPUT'  ||
          event.target.tagName === 'SELECT'){
          logger('debug', 'MousePressed: 368 returning', event.target.tagName);
          return;
    }
      let clickedNodeComponent = components.find(c =>
        (Math.abs(c.startNode.x - mouseX) < 10 && Math.abs(c.startNode.y - mouseY) < 10) ||
        (Math.abs(c.endNode.x - mouseX) < 10 && Math.abs(c.endNode.y - mouseY) < 10)
      );
      if (clickedNodeComponent) {
        selectedComponent = clickedNodeComponent;
        if (Math.abs(clickedNodeComponent.startNode.x - mouseX) < 10 && Math.abs(clickedNodeComponent.startNode.y - mouseY) < 10) {
          draggingNode = clickedNodeComponent.startNode;
        } else {
          draggingNode = clickedNodeComponent.endNode;
        }
        dragging = true;
        selectedComponent.nodesMoved = true;
        logger('debug', `MousePressed: 384 Selected C${selectedComponent.index}, draggingNode N${nodeMap.get(draggingNode)} at (${draggingNode.x}, ${draggingNode.y})`);
        document.getElementById('vMag').value = selectedComponent.params.voltage || 0;
        document.getElementById('vAngle').value = selectedComponent.params.angle || 0;
        document.getElementById('resistance').value = selectedComponent.params.resistance || 0;
        document.getElementById('reactance').value = selectedComponent.params.reactance || 0;
        return;
      }

      selectedComponent = components.find(c => {
        let centerX = c.x;
        let centerY = c.y;
        return Math.abs(centerX - mouseX) < 20 && Math.abs(centerY - mouseY) < 20;
      });
logger('debug', 'MousePressed: 397 ', event.target.tagName);

      if (selectedComponent && mode === 'select') {
        dragging = true;
        logger('debug', `MousePressed: Selected C${selectedComponent.index} for drag at center (${selectedComponent.x}, ${selectedComponent.y})`);
        document.getElementById('vMag').value = selectedComponent.params.voltage || 0;
        document.getElementById('vAngle').value = selectedComponent.params.angle || 0;
        document.getElementById('resistance').value = selectedComponent.params.resistance || 0;
        document.getElementById('reactance').value = selectedComponent.params.reactance || 0;
      } else if (mode !== 'select') {
        let startNode = new Node(gridX + 30, gridY, false);
        nodes.push(startNode);
        updateNodeMap();
        let endNode = new Node(gridX - 30, gridY, false);
        nodes.push(endNode);
        updateNodeMap();
        let newComponent;
        if (mode === 'voltage') {
          let vMag = document.getElementById('vMag').value;
          let vAngle = document.getElementById('vAngle').value;
          document.getElementById('resistance').value = 0;
          document.getElementById('reactance').value = 0;
          let params = {
            voltage: parseFloat(vMag) || 0,
            angle: parseFloat(vAngle) || 0,
            resistance: 0,
            reactance: 0,
            group: 0
          };
          logger('debug', `Creating 421 voltage component with params:`, params);
          newComponent = new Component(gridX, gridY, mode, params, startNode, endNode);
          newComponent.endNode.isGround = true;
          components.push(newComponent);
        } else if (mode === 'conductor' || mode === 'load') {
            
          let params = {
            voltage: 0,
            angle: 0,
            resistance: useCableGroup 
                ? parseFloat(document.getElementById('groupCableR').value) || 0 
                : parseFloat(document.getElementById('resistance').value) || 0,
            reactance: useCableGroup 
                ? parseFloat(document.getElementById('groupCableX').value) || 0 
                : parseFloat(document.getElementById('reactance').value) || 0,
            group: useCableGroup 
                ? parseInt(document.getElementById('groupSelect').value) || 0 
                : 0
          };
          logger('debug', `Creating ${mode} component with params:`, params);
          newComponent = new Component(gridX, gridY, mode, params, startNode, endNode);
          components.push(newComponent);
        } else if (mode === 'connection') {
          let params = { voltage: 0, angle: 0, resistance: 0, reactance: 0 };
          newComponent = new Component(gridX, gridY, mode, params, startNode, endNode);
          components.push(newComponent);
        }
        
    
        componentMap.clear();
        components.forEach((c, i) => {
          c.index = i;
          componentMap.set(c.index, c);
        });
        selectedComponent = newComponent;
        logger('debug', "new selected Component");
        mode = 'select';
        redraw();
      }
    }

    function mouseDragged() {
      if (!dragging) return;
      let gridX = Math.round(mouseX / 20) * 20;
      let gridY = Math.round(mouseY / 20) * 20;

      if (draggingNode && selectedComponent) {
        draggingNode.x = gridX;
        draggingNode.y = gridY;
//        logger('debug', `MouseDragged: Moving N${nodeMap.get(draggingNode)} to (${gridX}, ${gridY})`);
        let nearbyNode = nodes.find(n => n !== draggingNode && Math.abs(n.x - gridX) < 10 && Math.abs(n.y - gridY) < 10);
        if (nearbyNode) {
          let isGround = draggingNode.isGround || nearbyNode.isGround;
          // Update all components to use nearbyNode
          components.forEach(comp => {
            if (comp.startNode === draggingNode) {
              comp.startNode = nearbyNode;
//              logger('debug', `Updated C${comp.index} start to N${nearbyNode.nodeId}`);
            }
            if (comp.endNode === draggingNode) {
              comp.endNode = nearbyNode;
//              logger('debug', `Updated C${comp.index} end to N${nearbyNode.nodeId}`);
            }
          });
          // Transfer connections
          nearbyNode.connectedNodeList = new Set([...draggingNode.connectedNodeList, ...nearbyNode.connectedNodeList]);
          draggingNode.connectedNodeList.clear();
          // Remove draggingNode from nodes
          nodes = nodes.filter(n => n !== draggingNode);
          // Update draggingNode reference and ensure unique ID if needed
          draggingNode = nearbyNode;
          nearbyNode.isGround = isGround;
          // Reassign nodeId if necessary (e.g., if nearbyNode's ID conflicts)
          if (nodeMap.has(draggingNode.nodeId) && nodeMap.get(draggingNode.nodeId) !== draggingNode) {
            draggingNode.nodeId = getNextUnusedNodeId(nodeMap);
            nodeMap.set(draggingNode.nodeId, draggingNode);
//            logger('debug', `Reassigned N${nearbyNode.nodeId} to N${draggingNode.nodeId} due to conflict`);
          }
          updateNodeMap();
//          logger('debug', `Merged N${draggingNode.nodeId} into N${nearbyNode.nodeId}`);
        }
      } else if (selectedComponent && mode === 'select') {
        let dx = gridX - selectedComponent.x;
        let dy = gridY - selectedComponent.y;
        selectedComponent.x = gridX;
        selectedComponent.y = gridY;

        // Check if startNode is shared
        let startShared = components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.startNode || other.endNode === selectedComponent.startNode));
        if (!startShared) {
          selectedComponent.startNode.x += dx;
          selectedComponent.startNode.y += dy;
          // Check for nearby nodes after move
          let nearbyStart = nodes.find(n => n !== selectedComponent.startNode && Math.abs(n.x - selectedComponent.startNode.x) < 10 && Math.abs(n.y - selectedComponent.startNode.y) < 10);
          if (nearbyStart) logger('debug', `Warning: Start node at (${selectedComponent.startNode.x}, ${selectedComponent.startNode.y}) is near N${nearbyStart.nodeId}`);
        }

        // Check if endNode is shared
        let endShared = components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.endNode || other.endNode === selectedComponent.endNode));
        if (!endShared) {
          selectedComponent.endNode.x += dx;
          selectedComponent.endNode.y += dy;
          // Check for nearby nodes after move
          let nearbyEnd = nodes.find(n => n !== selectedComponent.endNode && Math.abs(n.x - selectedComponent.endNode.x) < 10 && Math.abs(n.y - selectedComponent.endNode.y) < 10);
          if (nearbyEnd) logger('debug', `Warning: End node at (${selectedComponent.endNode.x}, ${selectedComponent.endNode.y}) is near N${nearbyEnd.nodeId}`);
        }

//        logger('debug', `MouseDragged: Moved C${selectedComponent.index} to (${gridX}, ${gridY}), start N${nodeMap.get(selectedComponent.startNode)} (${selectedComponent.startNode.x}, ${selectedComponent.startNode.y}), end N${nodeMap.get(selectedComponent.endNode)} (${selectedComponent.endNode.x}, ${selectedComponent.endNode.y})`);
        updateNodeMap();
      }
      redraw();
    }

    function mouseReleased() {
      dragging = false;
      draggingNode = null;
      if (selectedComponent) {
//        logger('debug', `MouseReleased: Finalizing C${selectedComponent.index}, start N${nodeMap.get(selectedComponent.startNode)} (${selectedComponent.startNode.x}, ${selectedComponent.startNode.y}), end N${nodeMap.get(selectedComponent.endNode)} (${selectedComponent.endNode.x}, ${selectedComponent.endNode.y})`);
      }
      redraw();
    }
    
    function disconnectSelectedNode() {
      logger('debug' , "=== Starting disconnectSelectedNode for selectedComponent ===");
      if (!selectedComponent) {
        logger('debug' , "No selectedComponent, exiting disconnectSelectedNode");
        return;
      }

      logger('debug' , `Checking if C${selectedComponent.index} has shared nodes with other components`);
      let isShared = components.some(other => 
        other !== selectedComponent && 
        ((other.startNode === selectedComponent.startNode) || (other.endNode === selectedComponent.startNode) ||
         (other.startNode === selectedComponent.endNode) || (other.endNode === selectedComponent.endNode))
      );
      logger('debug' , `isShared: ${isShared}`);

      if (isShared) {
        let newStartNode = null;
        let newEndNode = null;

        let compCenterX = selectedComponent.x;
        let compCenterY = selectedComponent.y;
        const offset = 30;
        logger('debug' , `Component center: (${compCenterX}, ${compCenterY}), offset: ${offset}`);

        // Handle start node
        logger('debug' , "Checking if start node is shared");
        if (components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.startNode || other.endNode === selectedComponent.startNode))) {
          logger('debug' , `Start node N${selectedComponent.startNode.nodeId} at (${selectedComponent.startNode.x}, ${selectedComponent.startNode.y}) is shared`);
          let newNodeId = getNextUnusedNodeId();
          logger('debug' , `Assigned new nodeId: ${newNodeId} for new start node`);
          newStartNode = new Node(compCenterX + offset, compCenterY, selectedComponent.startNode.isGround, newNodeId);
          logger('debug' , `Created newStartNode with ID ${newStartNode.nodeId} at (${newStartNode.x}, ${newStartNode.y})`);
          nodes.push(newStartNode);
          updateNodeMap();
          logger('debug' , `Added newStartNode to nodes, current nodes length: ${nodes.length}`);
          selectedComponent.startNode.connectedNodeList.delete(selectedComponent.endNode);
          logger('debug' , `Removed endNode N${selectedComponent.endNode.nodeId} from startNode's connectedNodeList`);
          newStartNode.connectedNodeList.add(selectedComponent.endNode);
          logger('debug' , `Added endNode N${selectedComponent.endNode.nodeId} to newStartNode's connectedNodeList`);
          selectedComponent.startNode = newStartNode;
          logger('debug' , `Updated selectedComponent.startNode to N${newStartNode.nodeId}`);
        }

        // Handle end node
        logger('debug' , "Checking if end node is shared");
        if (components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.endNode || other.endNode === selectedComponent.endNode))) {
          logger('debug' , `End node N${selectedComponent.endNode.nodeId} at (${selectedComponent.endNode.x}, ${selectedComponent.endNode.y}) is shared`);
          let newNodeId = getNextUnusedNodeId();
          logger('debug' , `Assigned new nodeId: ${newNodeId} for new end node`);
          newEndNode = new Node(compCenterX - offset, compCenterY, selectedComponent.endNode.isGround, newNodeId);
          logger('debug' , `Created newEndNode with ID ${newEndNode.nodeId} at (${newEndNode.x}, ${newEndNode.y})`);
          nodes.push(newEndNode);
          updateNodeMap();
          logger('debug' , `Added newEndNode to nodes, current nodes length: ${nodes.length}`);
          selectedComponent.endNode.connectedNodeList.delete(selectedComponent.startNode);
          logger('debug' , `Removed startNode N${selectedComponent.startNode.nodeId} from endNode's connectedNodeList`);
          newEndNode.connectedNodeList.add(selectedComponent.startNode);
          logger('debug' , `Added startNode N${selectedComponent.startNode.nodeId} to newEndNode's connectedNodeList`);
          selectedComponent.endNode = newEndNode;
          logger('debug' , `Updated selectedComponent.endNode to N${newEndNode.nodeId}`);
        }

        // Update draggingNode if it was one of the replaced nodes
        if (draggingNode === selectedComponent.startNode || draggingNode === selectedComponent.endNode) {
          draggingNode = (draggingNode === selectedComponent.startNode) ? newStartNode : newEndNode;
          logger('debug' , `Updated draggingNode to N${draggingNode.nodeId}`);
        }

        logger('debug' , `Disconnected C${selectedComponent.index}: ${newStartNode ? `New start N${newStartNode.nodeId} at (${newStartNode.x}, ${newStartNode.y})` : ''} ${newEndNode ? `New end N${newEndNode.nodeId} at (${newEndNode.x}, ${newEndNode.y})` : ''}, original nodes remain`);
      } else {
        logger('debug' , `C${selectedComponent.index}: No shared nodes, no disconnection needed`);
      }

      logger('debug' , "Updating nodeMap");

      logger('debug' , "Redrawing canvas");
      redraw();
      logger('debug' , "=== Finished disconnectSelectedNode ===");
    }
    
    

    function updateNodeMap() {
        logger('debug' , 'updateNodeMap called');
      let needsRebuild = false;
      nodes.forEach((n) => {
        if (!nodeMap.has(n)) {
          needsRebuild = true;
        }
      });
      if (needsRebuild || nodeMap.size !== nodes.length) {
        nodeMap.clear();
        if (nodes === null || nodes === undefined ) {
            logger('debug' , 'nodes is either null || undefined');
        }
        nodes.forEach((n) => nodeMap.set(n.nodeId, n));
        logger('debug' , `updateNodeMap: Rebuilt nodeMap with ${nodes.length} nodes`);
        if (nodeMap === null || nodeMap === undefined ) {
            logger('debug' , 'nodeMap is either null || undefined');
        }
      } else {
//        logger('debug' , `updateNodeMap: No changes needed, nodeMap unchanged`);
      }
    }
    
/*
 * 
 * 
 * 
 * 
 */
    function calculateCircuit() {
      nodes.forEach(n => {
        n.voltage = null;
        n.nodeId = n.nodeId; // Preserve nodeId, but don’t reset
      });
      components.forEach(c => c.current = null);

      // Identify grounds and set their voltages to complex zero (0)
      let groundNodes = nodes.filter(n => n.isGround);
      groundNodes.forEach(n => n.voltage = complex(0, 0));
      
      // Identify the non ground nodes
      let nonGroundNodes = nodes.filter(n => !n.isGround);

      // Collect voltage sources
      let voltageSources = components.filter(c => c.type === 'voltage');
      if (voltageSources.length === 0) {
        logger('debug' , 'No voltage source found, skipping calculation');
        showResults = false;
        redraw();
        return;
      }

      // Map the non ground nodes into the Map
      nonGroundNodeMap = new Map();
      nonGroundNodes.forEach((n, i) => nonGroundNodeMap.set(n, i));

      let totalVars = nonGroundNodeMap.size + voltageSources.length; // 18 nodes + 3 voltage currents
      let Y = Array(totalVars).fill().map(() => Array(totalVars).fill(complex(0, 0)));
      let I = Array(totalVars).fill(complex(0, 0));

      log('info', `Initialized Y matrix size: ${totalVars} x ${totalVars}`);
      log('info', `Initialized I vector size: ${totalVars}`);

      console.log('Building the Y matrix');
      logger('debug', `Components size: ${components.length}`);
      components.forEach(c => {

        let i = nonGroundNodeMap.get(c.startNode);
        let j = nonGroundNodeMap.get(c.endNode);
        let vs = polarToComplex(c.params.voltage, c.params.angle);


          let resistance = c.params.resistance;
          let reactance = c.params.reactance || 0;
          if (resistance === 0 && reactance === 0 && c.type !== 'voltage' && c.type !== 'connection') {
              logger('debug', `setting small resistance = 1e-6 for Component C${c.index} (Type: ${c.type})`);
            resistance = 1e-6; // Only for conductor/load, not connection 
          }
          let impedance = complex(resistance, reactance);
          let admittance = cdiv(complex(1, 0), impedance);
          if (c.type === 'connection') {
            // Ideal short: enforce V[i] = V[j] by adding large admittance
            admittance = complex(1e12, 0); // High conductance to force equal voltages
            resistance = 1e-12;
            logger('debug', `Connection C${c.index}: Treating as ideal short with Y = ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} S`);
          } else {
            logger('debug', `Component C${c.index} (Type: ${c.type}) Y[${i}][${j}]`);
            logger('debug', `Component C${c.index} (Type: ${c.type}): Z = ${resistance}+j${reactance} Ω, Y = ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} S`);
          }
          
//          matlabCompLines.push(`    struct('id', ${c.index}, 'voltage', ${vs.re} + (${vs.im}) * 1j, 'resistance', ${resistance}, 'reactance', ${reactance}, 'nodes', [${i}, ${j}]), ...`);

        if (i !== undefined) {
          Y[i][i] = cadd(Y[i][i], admittance);
          logger('debug', `adding admittance ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} to Y[${i}][${i}]`);
        }
        if (j !== undefined) {
          Y[j][j] = cadd(Y[j][j], admittance);
          logger('debug', `adding admittance ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} to Y[${j}][${j}]`);
        }
          
        if (i !== undefined && j !== undefined) {
          Y[i][j] = csub(Y[i][j], admittance);
          logger('debug', `subtracting admittance ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} to Y[${i}][${j}]`);
          Y[j][i] = csub(Y[j][i], admittance);
          logger('debug', `subtracting admittance ${admittance.re.toFixed(1)}+j${admittance.im.toFixed(1)} to Y[${j}][${i}]`);
          
          logger('debug', `Current Y[${i}][${j}] = ${Y[i][j].re.toFixed(1)}+j${Y[i][j].im.toFixed(1)} S`);
        }
      });
      
      // Apply voltage source constraint
      voltageSources.forEach((vs, idx) => {
          logger('debug', `Voltage ${idx}`);
        let vsIdx = nonGroundNodeMap.size + idx; // Start after node indices
        let startIdx = nonGroundNodeMap.get(vs.startNode);
        let endIdx = nonGroundNodeMap.get(vs.endNode);
        let complexOne = complex(1, 0);
        let complexNegOne = complex(-1, 0);
        if (startIdx !== undefined) {
          Y[startIdx][vsIdx] = complexOne;
          Y[vsIdx][startIdx] = complexOne;
          logger('debug', `Applying voltage source C${vs.index}: Y[${startIdx}][${vsIdx}] = 1+j0, Y[${vsIdx}][${startIdx}] = 1+j0`);
        }
        if (endIdx !== undefined) {
          logger('debug', `Applying voltage source C${vs.index}: Y[${endIdx}][${vsIdx}] = -1+j0, Y[${vsIdx}][${endIdx}] = -1+j0`);
          Y[endIdx][vsIdx] = complexNegOne;
          Y[vsIdx][endIdx] = complexNegOne;
        }
        I[vsIdx] = polarToComplex(vs.params.voltage, vs.params.angle);
      });

      logger('debug', 'Final Y matrix:', Y.map(row => row.map(c => `${c.re.toFixed(1)}+j${c.im.toFixed(1)}`).join(', ')));
      for (let i = 0; i < totalVars; i++) {
        let rowSum = complex(0, 0);
        for (let j = 0; j < totalVars; j++) rowSum = cadd(rowSum, Y[i][j]);
      }
      logger('debug', 'Final I vector:', I.map(c => `${c.re.toFixed(1)}+j${c.im.toFixed(1)}`));

//    printCircuitMatrix(Y, I);
      
      
      let V = solveLinearSystem(Y, I);
      if (!V || V.some(v => v === undefined || isNaN(v.re) || isNaN(v.im))) {
        console.error('Solve failed, Y matrix may be singular. Initial V:', V);
        V = Array(totalVars).fill(complex(0, 0));
      }

      if (!V || V.some(v => v === undefined || isNaN(v.re) || isNaN(v.im))) {
        console.error('Invalid V vector detected');
        showResults = false;
        redraw();
        return;
      }
      logger('info', 'Raw V vector:', V.map(v => `${v.re.toFixed(6)}+j${v.im.toFixed(6)}`));
        
      let testResults = ['\n'];
      
      nodes.forEach(n => {
        let idx = nonGroundNodeMap.get(n);
        if (idx !== undefined) {
          n.voltage = V[idx] || complex(0, 0);
          let [mag, angle] = complexToPolar(n.voltage);
          testResults.push(`N${n.nodeId} ${n.voltage.re.toFixed(12)} + j${n.voltage.im.toFixed(12)}`);
        } else {
          n.voltage = complex(0, 0);
          testResults.push(`N${n.nodeId} ${n.voltage.re.toFixed(12)} + j${n.voltage.im.toFixed(12)}`);
        }
      });
      
      voltageSources.forEach((c, idx) => {
        let k = nonGroundNodeMap.size + idx;
        let startIdx = nonGroundNodeMap.get(c.startNode);
        let endIdx = nonGroundNodeMap.get(c.endNode);
        c.current = V[k];
        let [mag, angle] = complexToPolar(c.current);
        logger('debug', `Voltage source C${c.index} current = ${mag.toFixed(1)}∠${angle.toFixed(1)}° A`);
        testResults.push(`C${c.index} ${c.current.re.toFixed(12)} + j${c.current.im.toFixed(12)}`);
      });

      testResultsString = testResults.join('\n')
      logger('test', testResultsString);
            
      components.forEach(c => {
          let i = nonGroundNodeMap.get(c.startNode);
          let j = nonGroundNodeMap.get(c.endNode);
          let startVoltage = 0;
          let endVoltage = 0;
        if ((c.type === 'conductor' || c.type === 'load' || c.type === 'connection')) {

          let resistance = c.params.resistance;
          let reactance = c.params.reactance || 0;
          if (resistance === 0 && reactance === 0) {
            resistance = 1e-9; // Only for conductor/load, not connection
          }
          let Z = complex(resistance, reactance);
            
          if (i !== undefined && j !== undefined) {

            let V_diff = getPositiveVoltageDrop(V[i], V[j]);
            logger('debug', `Component C${c.index} (${c.type}): Nodes ${i} to ${j}, V[${i}] = ${V[i].re.toFixed(1)}+j${V[i].im.toFixed(1)} V, V[${j}] = ${V[j].re.toFixed(1)}+j${V[j].im.toFixed(1)} V, V_diff = ${V_diff.re.toFixed(3)}+j${V_diff.im.toFixed(3)} V, Z = ${resistance.toFixed(3)}+j${reactance.toFixed(3)} Ω`);
            c.current = cdiv(V_diff, Z);
            let [mag, angle] = complexToPolar(c.current);
            logger('debug', `Component C${c.index} (${c.type}) current = ${mag.toFixed(1)}∠${angle.toFixed(1)}° A`);
            
          } else {
              
              startVoltage = (i !== undefined) ? V[i] : complex(0,0);
              endVoltage = (j !== undefined) ? V[j] : complex(0,0);
              logger('debug', `Component C${c.index} startVoltage ${startVoltage.re.toFixed(6)}+j${startVoltage.im.toFixed(6)}V, endVoltage ${endVoltage.re.toFixed(6)}+j${endVoltage.im.toFixed(6)}V`);

              let V_diff = getPositiveVoltageDrop(startVoltage, endVoltage);
              c.current = cdiv(V_diff, Z);
              let [mag, angle] = complexToPolar(c.current);
              logger('debug', `Component C${c.index} (${c.type}): Nodes ${c.startNode.nodeId} to ${c.endNode.nodeId}, V[${i}] = ${startVoltage.re.toFixed(6)}+j${startVoltage.im.toFixed(6)} V, V[${j}] = ${endVoltage.re.toFixed(6)}+j${endVoltage.im.toFixed(6)} V, V_diff = ${V_diff.re.toFixed(6)}+j${V_diff.im.toFixed(6)} V, Z = ${resistance.toFixed(6)}+j${reactance.toFixed(6)} Ω`);
              logger('debug', `Component C${c.index} (${c.type}) current = ${mag.toFixed(3)}∠${angle.toFixed(3)}° A`);
          }
        }
      });

      showResults = true;
      redraw();
    }


//##############################################################################

    function showSignedZero(n) {
      if (Object.is(n, -0)) return "-0.000000";
      return n.toFixed(6);
    }

    function complexMagnitude(complex) {
      return Math.sqrt(complex.re * complex.re + complex.im * complex.im);
    }
    function getPositiveVoltageDrop(v1, v2) {
      let mag1 = complexMagnitude(v1);
      let mag2 = complexMagnitude(v2);
      let diff = { re: 0, im: 0 };
      if (mag1 >= mag2) {
        diff = csub(v1, v2); // v1 - v2 (higher - lower)
      } else {
        diff = csub(v2, v1); // v2 - v1 (higher - lower)
      }
      return diff;
    }
    function complex(re, im) { return { re, im }; }
    function cadd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
    function csub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
    function cmul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
    function cdiv(a, b) {
      let denom = b.re * b.re + b.im * b.im;
      if (denom === 0) return complex(0, 0);
      return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
    }
    function polarToComplex(mag, angleDeg) {
      let angleRad = angleDeg * Math.PI / 180;
      return { re: mag * Math.cos(angleRad), im: mag * Math.sin(angleRad) };
    }

    // Assuming complexToPolar exists and returns [magnitude, angle]
    function complexToPolar(complex) {
      let mag = Math.sqrt(complex.re * complex.re + complex.im * complex.im);
      let angle = Math.atan2(complex.im, complex.re) * 180 / Math.PI; // In degrees

//      angle = ((angle % 360) + 360) % 360;
      // Normalize to [180, -180)
      angle = angle % 360;
      angle = (angle > 180) ? angle -360 : angle;
      return [mag, angle];
    }

//##############################################################################

    function solveLinearSystem(A, b) {
      let n = A.length;
      let augmented = A.map((row, i) => [...row.slice(0, n), b[i] ? b[i] : complex(0, 0)]);
      for (let i = 0; i < n; i++) {
        let maxPivot = Math.abs(augmented[i][i].re) + Math.abs(augmented[i][i].im);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
          let pivot = Math.abs(augmented[k][i].re) + Math.abs(augmented[k][i].im);
          if (pivot > maxPivot) { maxPivot = pivot; maxRow = k; }
        }
        if (maxRow !== i) {
          [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        }
        let pivot = augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[i][j] = augmented[i][j] ? cdiv(augmented[i][j], pivot) : complex(0, 0);
        }
        for (let k = 0; k < n; k++) {
          if (k !== i) {
            let factor = augmented[k][i];
            for (let j = i; j <= n; j++) {
              augmented[k][j] = augmented[k][j] ? csub(augmented[k][j], cmul(factor, augmented[i][j])) : complex(0, 0);
            }
          }
        }
      }
      return augmented.map(row => row[n] || complex(0, 0));
    }

//##############################################################################


    async function saveConfig() {
      let config = {
        nodes: nodes.map(n => ({ x: n.x, y: n.y, isGround: n.isGround, nodeId: n.nodeId !== null ? n.nodeId : nodes.indexOf(n) })),
        components: components.map(c => ({
          componentId: c.index,
          x: c.x,
          y: c.y,
          type: c.type,
          params: c.params,
          rotation: c.rotation,
          startNode: { nodeId: c.startNode.nodeId !== null ? c.startNode.nodeId : nodes.indexOf(c.startNode) },
          endNode: { nodeId: c.endNode.nodeId !== null ? c.endNode.nodeId : nodes.indexOf(c.endNode) }
        }))
      };
      logger('debug', 'Nodes before download:', nodes.map((n, i) => `N${i}: isGround=${n.isGround}, x=${n.x}, y=${n.y}, nodeId=${n.nodeId}`));
      let data = JSON.stringify(config, null, 2);
      try {
        const blob = new Blob([data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'circuit_config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        logger('debug', 'Download initiated, check for circuit_config.json');
        if (window.showSaveFilePicker) {
          const handle = await showSaveFilePicker({
            suggestedName: 'circuit_config.json',
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(data);
          await writable.close();
          logger('debug', 'File also saved via dialog (optional)');
        }
      } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Check console for details or try again.');
      }
    }



    function loadConfig(event) {
      let file = event.target.files[0];
      if (!file) return;
      let reader = new FileReader();
      reader.onload = function(e) {
        let config = JSON.parse(e.target.result);
          nodes = config.nodes.map((n, index) => {
          if (n.nodeId === undefined) {
            console.error(`Node ID undefined: ${index}`);
            return null;
          }
          let nodeId = n.nodeId ;
          let node = new Node(n.x, n.y, n.isGround, nodeId);
          nodeMap.set(node, index);
          return node;
        });
        components = config.components.map(c => {
          let startNodeId = c.startNode.nodeId;
          let endNodeId = c.endNode.nodeId;
          let startNode = null;
          let endNode = null;
          nodes.forEach((n, i) => {
            if (startNodeId === n.nodeId){
                startNode = n;
            }
            if (endNodeId === n.nodeId){
                endNode = n;
            }
          });
          
          if (!startNode || !endNode) {
            console.error(`Node ID mismatch: componentId=${c.componentId}, startNodeId=${startNodeId}, endNodeId=${endNodeId}`);
            return null; // Skip invalid components
          }
          
          let newComponent = new Component(c.x, c.y, c.type, c.params, startNode, endNode);
          newComponent.rotation = c.rotation;
          // Populate connectedNodeList for both nodes
          startNode.addConnectedNode(endNode);
          endNode.addConnectedNode(startNode);
          return newComponent;
        }).filter(c => c !== null); // Remove invalid components
//      nodeMap.clear();
        componentMap.clear();

        components.forEach((c, i) => {
          c.index = i;
          componentMap.set(c.index, c);
        });
        logger('debug', 'Loaded nodes:', nodes.map(n => `nodeId=${n.nodeId}, x=${n.x}, y=${n.y}, isGround=${n.isGround}`));
        document.getElementById('configFile').value = '';
        redraw();
      };
      reader.readAsText(file);
    }


//==============================================================================
//
// Test MNA matrix
//
//==============================================================================

    function printCircuitMatrix(Y, I) {
      const totalVars = Y.length;
      const nodeCount = totalVars - 1; // Subtract 1 for the voltage source current
      const yRows = Y.map((row, i) => {
        let rowLabel = i < nodeCount ? `N${i}` : `I_C${i - nodeCount}`;
        let rowStr = row.map(c => `complex(${c.re.toFixed(1)}, ${c.im.toFixed(1)})`).join(", ");
        return `  [${rowStr}],      // ${rowLabel}`;
      }).join("\n");
      const iRows = I.map((val, i) => {
        let label = i < nodeCount ? `N${i}` : `I_C${i - nodeCount} (${I[i].re.toFixed(1)} V source)`;
        return `  complex(${val.re.toFixed(1)}, ${val.im.toFixed(1)}),  // ${label}`;
      }).join("\n");
      logger('debug', 
        `// Manually construct Y matrix (${totalVars}x${totalVars} for ${nodeCount} nodes + 1 voltage source current)\n` +
        `let Y = [\n` +
        `${yRows}\n` +
        `];\n\n` +
        `// Manually construct I vector\n` +
        `let I = [\n` +
        `${iRows}\n` +
        `];`
      );
    }

    
    function testMNA() {
      logger('debug', "Running MNA Test...");

      
      
// Manually construct Y matrix (28x28 for 27 nodes + 1 voltage source current)
let Y = [
  [complex(2001.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N0
  [complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0)],      // N1
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1.0, 0.0)],      // N2
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1001000.0, 0.0), complex(-1000.0, 0.0), complex(-1000000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N3
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(3000.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N4
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000000.0, 0.0), complex(0.0, 0.0), complex(1001000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N5
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N6
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(2000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N7
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(3000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N8
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N9
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N10
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N11
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(2000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N12
  [complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(3000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N13
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N14
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N15
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N16
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(2000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N17
  [complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(3000.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N18
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-0.1, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000.1, 0.0), complex(-1000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N19
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000.0, 0.0), complex(-1000.0, 0.0), complex(2000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N20
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0), complex(0.0, 0.0)],      // N21
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0)],      // N22
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(1000000.0, 0.0), complex(-1000000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N23
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1000000.0, 0.0), complex(1000000.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N24
  [complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N25
  [complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // N26
  [complex(0.0, 0.0), complex(0.0, 0.0), complex(1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(-1.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0), complex(0.0, 0.0)],      // I_C0
];

// Manually construct I vector
let I = [
  complex(0.0, 0.0),  // N0
  complex(0.0, 0.0),  // N1
  complex(0.0, 0.0),  // N2
  complex(0.0, 0.0),  // N3
  complex(0.0, 0.0),  // N4
  complex(0.0, 0.0),  // N5
  complex(0.0, 0.0),  // N6
  complex(0.0, 0.0),  // N7
  complex(0.0, 0.0),  // N8
  complex(0.0, 0.0),  // N9
  complex(0.0, 0.0),  // N10
  complex(0.0, 0.0),  // N11
  complex(0.0, 0.0),  // N12
  complex(0.0, 0.0),  // N13
  complex(0.0, 0.0),  // N14
  complex(0.0, 0.0),  // N15
  complex(0.0, 0.0),  // N16
  complex(0.0, 0.0),  // N17
  complex(0.0, 0.0),  // N18
  complex(0.0, 0.0),  // N19
  complex(0.0, 0.0),  // N20
  complex(0.0, 0.0),  // N21
  complex(0.0, 0.0),  // N22
  complex(0.0, 0.0),  // N23
  complex(0.0, 0.0),  // N24
  complex(230.0, 0.0),  // N25
  complex(-115.0, 199.2),  // N26
  complex(-115.0, 199.2),  // I_C0 (-115.0 V source)
];

      logger('debug', "Test Y matrix:");
      logger('debug', Y.map(row => row.map(c => `${c.re.toFixed(1)}+j${c.im.toFixed(1)}`).join(', ')));
      logger('debug', "Test I vector:");
      logger('debug', I.map(c => `${c.re.toFixed(1)}+j${c.im.toFixed(1)}`));

      // Solve the system
      let V = solveLinearSystem(Y, I);
      if (!V || V.some(v => v === undefined || isNaN(v.re) || isNaN(v.im))) {
        console.error("Solve failed, Y matrix may be singular or ill-conditioned. Initial V:", V);
      } else {
        logger('debug', "Solved V vector:");
        logger('debug', V.map(v => `${v.re.toFixed(1)}+j${v.im.toFixed(1)}`));

      }
    }   
