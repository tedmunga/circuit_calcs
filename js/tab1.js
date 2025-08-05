    let nodes = [];
    let components = [];
    let mode = 'select';
    let selectedComponent = null;
    let useCableGroup = false;
    let usePredefinedLoad = false;
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
                                
    document.getElementById('vMag').addEventListener('input', updateComponentParameters);
    document.getElementById('vAngle').addEventListener('input', updateComponentParameters);
    document.getElementById('resistance').addEventListener('input', updateComponentParameters);
    document.getElementById('reactance').addEventListener('input', updateComponentParameters);
//    document.getElementById('groupSelect').addEventListener('input', updateComponentParameters);
//    document.getElementById('groupCableX').addEventListener('input', updateComponentParameters);

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
    document.getElementById('resistance').disabled = e.target.checked || usePredefinedLoad;
    document.getElementById('reactance').disabled = e.target.checked || usePredefinedLoad;
    document.getElementById('groupSelect').disabled = !e.target.checked;
    useCableGroup = e.target.checked;
});

document.getElementById('loadCheckBox').addEventListener('change', (e) => {
  const groupChecked = document.getElementById('groupCableCheckBox').checked;
  document.getElementById('resistance').disabled = e.target.checked || useCableGroup;
  document.getElementById('reactance').disabled = e.target.checked || useCableGroup;
  document.getElementById('loadSelect').disabled = !e.target.checked;
  usePredefinedLoad = e.target.checked;
});

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
          // nothing to do here just yet.
        }
        pop();
      }
    }

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

    function isConfigEmpty(cfg) {
      return !(Array.isArray(cfg.nodes) && cfg.nodes.length > 0) &&
             !(Array.isArray(cfg.components) && cfg.components.length > 0);
    }


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
      
      const config = JSON.parse(localStorage.getItem('circuitConfig') || "{}");
      if (!isConfigEmpty(config)) {
        logger('info', 'Applying config:', config);
        let data = applyConfig(config);
        nodes = data[0];
        components = data[1];
      }
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
        } else if (mode === 'conductor') {
            
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
        } else if (mode === 'load') {
            
          let params = {
            voltage: 0,
            angle: 0,
            resistance: usePredefinedLoad 
                ? parseFloat(document.getElementById('loadR').value) || 0 
                : parseFloat(document.getElementById('resistance').value) || 0,
            reactance: usePredefinedLoad 
                ? parseFloat(document.getElementById('loadX').value) || 0 
                : parseFloat(document.getElementById('reactance').value) || 0,
            group: usePredefinedLoad 
                ? parseInt(document.getElementById('loadSelect').value) || 0 
                : 0
          };
          
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

        let nearbyNode = nodes.find(n => n !== draggingNode && Math.abs(n.x - gridX) < 10 && Math.abs(n.y - gridY) < 10);
        if (nearbyNode) {
          let isGround = draggingNode.isGround || nearbyNode.isGround;
          // Update all components to use nearbyNode
          components.forEach(comp => {
            if (comp.startNode === draggingNode) {
              comp.startNode = nearbyNode;

            }
            if (comp.endNode === draggingNode) {
              comp.endNode = nearbyNode;

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

        updateNodeMap();
      }
      redraw();
    }

    function mouseReleased() {
      dragging = false;
      draggingNode = null;
      if (selectedComponent) {
        logger('debug', `MouseReleased: Finalizing C${selectedComponent.index}, start N${nodeMap.get(selectedComponent.startNode)} (${selectedComponent.startNode.x}, ${selectedComponent.startNode.y}), end N${nodeMap.get(selectedComponent.endNode)} (${selectedComponent.endNode.x}, ${selectedComponent.endNode.y})`);
      }
      redraw();
    }
    
    function disconnectSelectedNode() {
      logger('debug' , "=== Starting disconnectSelectedNode for selectedComponent ===");
      if (!selectedComponent) {
        logger('debug' , "No selectedComponent, exiting disconnectSelectedNode");
        return;
      }

      let isShared = components.some(other => 
        other !== selectedComponent && 
        ((other.startNode === selectedComponent.startNode) || (other.endNode === selectedComponent.startNode) ||
         (other.startNode === selectedComponent.endNode) || (other.endNode === selectedComponent.endNode))
      );

      if (isShared) {
        let newStartNode = null;
        let newEndNode = null;

        let compCenterX = selectedComponent.x;
        let compCenterY = selectedComponent.y;
        const offset = 30;

        // Handle start node
        if (components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.startNode || other.endNode === selectedComponent.startNode))) {
          let newNodeId = getNextUnusedNodeId();
          newStartNode = new Node(compCenterX + offset, compCenterY, selectedComponent.startNode.isGround, newNodeId);
          nodes.push(newStartNode);
          updateNodeMap();
          selectedComponent.startNode.connectedNodeList.delete(selectedComponent.endNode);
          newStartNode.connectedNodeList.add(selectedComponent.endNode);
          selectedComponent.startNode = newStartNode;
        }

        // Handle end node
        logger('debug' , "Checking if end node is shared");
        if (components.some(other => other !== selectedComponent && (other.startNode === selectedComponent.endNode || other.endNode === selectedComponent.endNode))) {
          let newNodeId = getNextUnusedNodeId();
          newEndNode = new Node(compCenterX - offset, compCenterY, selectedComponent.endNode.isGround, newNodeId);
          nodes.push(newEndNode);
          updateNodeMap();
          selectedComponent.endNode.connectedNodeList.delete(selectedComponent.startNode);
          newEndNode.connectedNodeList.add(selectedComponent.startNode);
          selectedComponent.endNode = newEndNode;
        }

        // Update draggingNode if it was one of the replaced nodes
        if (draggingNode === selectedComponent.startNode || draggingNode === selectedComponent.endNode) {
          draggingNode = (draggingNode === selectedComponent.startNode) ? newStartNode : newEndNode;
        }

      } else {
        logger('debug' , `C${selectedComponent.index}: No shared nodes, no disconnection needed`);
      }

      redraw();
      logger('debug' , "=== Finished disconnectSelectedNode ===");
    }
    
//##############################################################################

/*
 * Load and Save functions.
 */

async function saveConfig() {
  const blob = saveConfigToBlob(nodes, components);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'circuit_config.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function loadConfig(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  try {
    const data = loadConfigFromText(text);
    nodes = data[0];
    components = data[1];
    redraw();
  } catch (err) {
    console.error('Invalid config:', err);
    alert('Failed to load config: ' + err.message);
  }
}
