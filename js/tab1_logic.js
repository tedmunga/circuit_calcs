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
        logger('debug' , `updateNodeMap: No changes needed, nodeMap unchanged`);
      }
    }
    
    /*
     * Before calling calculateCircuit() save the config to localStorage.
     */
    function calculateCircuitPrep(){
      
        let config = getConfig(nodes, components);
        logger('info', 'setting localstorage with:', config);
        localStorage.setItem('circuitConfig', JSON.stringify(config));
        
        calculateCircuit();
    }
    
    /**
     * Performs nodal analysis to calculate the voltages at each node and currents 
     * through components in the electrical circuit.
     *
     * Steps:
     * 1. Initialize node voltages and component currents to null.
     * 2. Identify ground nodes and fix their voltages to zero (complex 0 + j0).
     * 3. Separate non-ground nodes and voltage source components.
     * 4. Build a matrix equation Y·V = I, where:
     *    - Y is the admittance matrix representing conductances/admittances 
     *      between nodes and voltage sources,
     *    - V is the unknown vector of node voltages and voltage source currents,
     *    - I is the current injection vector, including voltage source constraints.
     * 5. Construct Y by summing admittances for each component, including special 
     *    treatment for voltage sources and ideal connections (shorts).
     * 6. Solve the linear system using `solveLinearSystem` to obtain node voltages 
     *    and voltage source currents.
     * 7. Assign calculated voltages and currents back to nodes and components.
     * 8. Log results for debugging and testing.
     * 9. Trigger a redraw of the circuit display with updated values.
     *
     * This function supports complex impedances (resistance + reactance) and 
     * accounts for voltage sources by augmenting the system with extra variables 
     * for their currents.
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

    /**
     * Solves a system of linear equations A·x = b for complex numbers using
     * Gaussian elimination with partial pivoting. This function modifies an
     * augmented matrix [A | b] in-place and applies row operations to reduce it
     * to row echelon form, then back-substitutes to obtain the solution vector x.
     *
     * Parameters:
     *   A - an n x n matrix of complex numbers (array of arrays)
     *   b - a vector of complex numbers (length n)
     *
     * Returns:
     *   An array of complex numbers representing the solution vector x.
     */
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
    
//==============================================================================
//
// Math helper Functions
//
//==============================================================================
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

      angle = angle % 360;
      angle = (angle > 180) ? angle -360 : angle;
      return [mag, angle];
    }

//==============================================================================
//
// A Test Function that prints the MNA matrix
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
    
//==============================================================================
//
// A Test Function that proves -0 is the same is 0
//
//==============================================================================

    function showSignedZero(n) {
      if (Object.is(n, -0)) return "-0.000000";
      return n.toFixed(6);
    }

