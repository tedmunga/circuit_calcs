function calculateEFLI(){

    let circuitLen = parseFloat(document.getElementById('lmax').value);
    let eightyPercent = parseFloat(document.getElementById('0.8').value);
    let nominalVoltage = parseFloat(document.getElementById('Uo').value);
    let SphInPar = parseFloat(document.getElementById('SphP').value);
    let phaseSize = parseFloat(document.getElementById('Sph').value);
    let earthSize = parseFloat(document.getElementById('Spe').value);
    let cbSize = parseFloat(document.getElementById('CBsize').value);
    let cbType = parseFloat(document.getElementById('CBtype').value);
    let rhoPh = parseFloat(document.getElementById('rhoPh').value);
    let rhoPe = parseFloat(document.getElementById('rhoPe').value);
    let faultCurrent = parseFloat(document.getElementById('faultCurrent').value);
    let disconnectTime = parseFloat(document.getElementById('disCon').value);
    let K = parseFloat(document.getElementById('kConst').value);

    // Save the cookies, not all browsers support this.
    setCookies(circuitLen, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe, faultCurrent, disconnectTime, K);

    let maxEarthLen = calculateMaxEarthLength(eightyPercent, nominalVoltage, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe);
    document.getElementById('mel').value = Math.round(maxEarthLen*100)/100;
    

    let minEarthSize = calculateMinEarthSize(circuitLen, eightyPercent, nominalVoltage, SphInPar, phaseSize, cbSize, cbType, rhoPh, rhoPe);

    /* 
        If the value is 0 or a negative the distance is too far for a valid earth cable.
    */
    if (minEarthSize <= 0){
        document.getElementById('mes').value = "∞";
    } else {
        document.getElementById('mes').value = Math.round(minEarthSize*100)/100;
    }

    let selPhase = document.getElementById('rhoPh');
    let selEarth = document.getElementById('rhoPe');
    showEarthSize(selPhase.options[selPhase.selectedIndex].text, selEarth.options[selEarth.selectedIndex].text, SphInPar * phaseSize);

    calculateEarthHeatRiseSize(faultCurrent, disconnectTime, K);

    calculateEFLIWithXl(minEarthSize, circuitLen, eightyPercent, nominalVoltage, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe);
}

/* 
    This formula is derived from the formula given in AS3000 calculation B5.2.2.
    This formula differs in it allows for different phase and earth conductors. example using an Aluminimum phase conductor with 
    a copper earth conductor.
    L_max = [0.8 * 230 * P_ph * P_pe] / [I_a * (ρ_ph * P_ph + ρ_pe * P_pe)]
*/
function calculateMaxEarthLength(eightyPercent, nominalVoltage, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe){

    let numerator = eightyPercent * nominalVoltage * (SphInPar * phaseSize) * earthSize;
    let denominator = (cbSize * cbType) * (rhoPh * (SphInPar * phaseSize) + rhoPe * earthSize);

    return (numerator / denominator);

}

/* 
    This formula is derived from the formula given in AS3000 calculation B5.2.2.
    This formula differs in it allows for different phase and earth conductors and is with respect to P_pe.
    P_pe = [L_max * I_a * ρ_ph * P_ph] / [ (0.8 * 230 * P_ph) - (L_max * I_a * ρ_pe)]
*/
function calculateMinEarthSize(circuitLen, eightyPercent, nominalVoltage, SphInPar, phaseSize, cbSize, cbType, rhoPh, rhoPe){

    let numerator = circuitLen * (cbSize * cbType) * rhoPh * (SphInPar * phaseSize);
    let denominator =  (eightyPercent * nominalVoltage * (SphInPar * phaseSize)) - (circuitLen * (cbSize * cbType) * rhoPe);

    return (numerator / denominator);

}

function showEarthSize(conductorType, earthType, activeSize){

    // An array of conductor sizes as set out in AS3000 Table 5.1.
    let conductorSizes = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
    let conductorLookupSize = 0;

    /* If the total active conductor size does not match one of the those in Table 5.1
       then we need to choose the next size up condictor. */
    for (i=0; i < conductorSizes.length; i++){
        if (activeSize <= conductorSizes[i]) {
            conductorLookupSize = conductorSizes[i];
            break;
        }
    }
    if (conductorLookupSize === 0) { conductorLookupSize = '>630' };

    /* Table 5.1 only relates to Copper earth conductors. If the user selects Aluminimum
       Set the value to NA in the Table 5.1 box.
    */ 
    if (earthType === "Aluminimum"){
        document.getElementById('table5.1').value = "NA";
    } else {
        (conductorType === "Copper") ? document.getElementById('table5.1').value = earthSizes[conductorLookupSize][0] : document.getElementById('table5.1').value = earthSizes[conductorLookupSize][1];
    }

}

function calculateEarthHeatRiseSize(faultCurrent, disconnectTime, K){

    document.getElementById('thr').value = Math.ceil(Math.sqrt(faultCurrent**2*disconnectTime/K**2));

}

/*
    The calculation of inductive reactance of a cable was taken from a website that is no longer active.

    http://www.openelectrical.org/wiki/index.php?title=Cable_Impedance_Calculations
    It referenced these 2 articles:
    IEC 60287-1-1, “Electric cables – Calculation of current rating – Part 1: Current rating equations (100% load factor) and calculation of losses – Section 1: General”, 2006
    G.F. Moore, “Electric Cables Handbook”, Third Edition, 1997, an excellent reference book for cables

    The general formula is:
    X_L = 2 * pi * f [K + 0.2 *ln(2s / dc)] * 10^-3
    Where;
    X_L is the conductor inductive reactance (ohm/km)
    f is the supply frequency (Hz)
    s is axial spacing between conductors (mm)
    dc is the diameter of the conductor (mm)
    K is a constant factor pertaining to conductor formation. See table below.
    ------------------------
    No. of wire |
    strands in  |     K
    conductor   |
    ------------------------
         3      |   0.0778
    ------------------------
         7      |   0.0642
    ------------------------
         19     |   0.0554
    ------------------------
         37     |   0.0528
    ------------------------
        >60     |   0.0514
    ------------------------
      1(solid)  |   0.0500
    ------------------------


    Newton–Raphson method
    x_(k+1) = x_k - [ f(x_k) / f'(x_k) ]
*/
function calculateEFLIWithXl(initalMinEarthSize, circuitLen, eightyPercent, nominalVoltage, SphInPar, phaseSize, earthSize, cbSize, cbType, rhoPh, rhoPe){

    let totalPhaseSize = SphInPar * phaseSize;
    let Ia = cbSize * cbType;
    let Ciph = cableDate[getClosestCableSize(phaseSize)][0]; // insulation + sheath thickness of active conductor
    let Kph = cableDate[getClosestCableSize(phaseSize)][1];  // K constant of active conductor
    let Cipe = cableDate[getClosestCableSize(earthSize)][0]; // insulation + sheath thickness of earth conductor
    let Kpe = cableDate[getClosestCableSize(earthSize)][1];  // K constant of earth conductor
    let f = 50; // supply frequency
    let pi = Math.PI;
    let dph = Math.sqrt(4*phaseSize/pi) + 2 * Ciph; // Overall diameter of active conductor
    let dpe = Math.sqrt(4*earthSize/pi) + 2 * Cipe; // Overall diameter of earth conductor
    let dphc = Math.sqrt(4*phaseSize/pi); // Conductor diameter of active conductor
    let dpec = Math.sqrt(4*earthSize/pi); // Conductor diameter of earth conductor

    // output to console for debug
    /*
    console.log("Ia: " + Ia);
    console.log("Ciph: " + Ciph);
    console.log("Kph: " + Kph);
    console.log("Cipe: " + Cipe);
    console.log("Kpe: " + Kpe);
    console.log("f: " + f);
    console.log("pi: " + pi);
    console.log("dph: " + dph);
    console.log("dpe: " + dpe);
    */

    // The resistive component of the circuit.
    let numerator   = Ia * (rhoPh * SphInPar * phaseSize + rhoPe * earthSize);
    let denominator = SphInPar * phaseSize * earthSize
    let resistiveComponent = numerator / denominator;

    // Active inductive reactance compoent of the circuit
    let phaseInductiveReactance = Ia * (2 * pi * f * (Kph + 0.2 * Math.log( (2 * dph) / dphc) ) * 10**(-6))/SphInPar;

    // Earth inductive reactance compoent of the circuit
    let earthInductiveReactance = Ia * (2 * pi * f * (Kpe + 0.2 * Math.log( (2 * dpe) / dpec) ) * 10**(-6));
    
    numerator = eightyPercent * nominalVoltage;
    denominator = resistiveComponent + phaseInductiveReactance + earthInductiveReactance;
    let Lmax = numerator / denominator;

    //console.log(Lmax);
    document.getElementById('melxl').value = Math.floor(Lmax*100)/100;

    let x_k = initalMinEarthSize;
    phaseInductiveReactance = (2 * pi * f * (Kph + 0.2 * Math.log( (2 * dph) / dphc) ) * 10**(-6))/SphInPar;
    let equationEnd = (eightyPercent * nominalVoltage) / (Ia * circuitLen);
    let count = 0;
    let Emin = minEarthEquation(x_k, count, rhoPh, SphInPar, phaseSize, rhoPe, pi, f, phaseInductiveReactance, equationEnd);

}

function minEarthEquation(x_k, count, rhoPh, SphInPar, phaseSize, rhoPe, pi, f, phaseInductiveReactance, equationEnd, oldFirstOrderFunction){

    //console.log("count: " + count);
    //console.log("x_k: " + x_k);
    let earthLookupSize = getClosestCableSize(x_k);
    let Cipe = cableDate[earthLookupSize][0]; // insulation + sheath thickness of earth conductor
    let Kpe = cableDate[earthLookupSize][1];  // K constant of earth conductor
    let dpe = Math.sqrt(4*x_k/pi) + 2 * Cipe; // Overall diameter of earth conductor
    let dpec = Math.sqrt(4*x_k/pi); // Conductor diameter of earth conductor

    // x_(k+1) = x_k - [ f(x_k) / f'(x_k) ]
    // f(x_k)
    let resistiveComponent = (SphInPar * rhoPh * phaseSize + rhoPe * x_k) / (SphInPar * phaseSize * x_k);
    let earthInductiveReactance = 2 * pi * f * (Kpe + 0.2 * Math.log( (2 * dpe) / dpec) ) * 10**(-6)
    let firstOrderFunction = resistiveComponent + phaseInductiveReactance + earthInductiveReactance - equationEnd;

    // f'(x_k)
    let secondOrderFunction = (-rhoPh/x_k**2) - (2 * 10**(-7) * Cipe * f * pi) / (x_k * (Math.sqrt(x_k/pi) + Cipe));

    // x_(k+1)
    let result = x_k - ( firstOrderFunction / secondOrderFunction );
    //console.log("firstOrderFunction: " + firstOrderFunction);
    //console.log("secondOrderFunction: " + secondOrderFunction);

    if (firstOrderFunction != 0) {

        /* 
           This comparison between the old value and new value is to over come what I think is a data type precsion
           problem javascript has. I was seeing the result go -1.734723475976807e-18 to 1.734723475976807e-18 repeatedly 
           never reaching zero. As the result is rounded up to the nearest integer it shouldn't be a problem.
           I've also noticed that the same formula in MS excel completes to zero without error.
        */
        if (oldFirstOrderFunction === -1 * firstOrderFunction){
            return result;
        }
        if (count === 10){
            return result;
        }
        
        result = minEarthEquation(result, ++count, rhoPh, SphInPar, phaseSize, rhoPe, pi, f, phaseInductiveReactance, equationEnd, firstOrderFunction);
    
    }

    document.getElementById('mesxl').value = Math.round(result*100)/100;
    //console.log("result: " + result);

    return result;

}

function getClosestCableSize(x_k){

    // An array of conductor sizes as set out in AS3000 Table 5.1.
    let conductorSizes = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
    let conductorLookupSize = 0;

    /* If the total active conductor size does not match one of the those in Table 5.1
       then we need to choose the next size up condictor. */
    for (i=0; i < conductorSizes.length; i++){
        if (x_k <= conductorSizes[i]) {
            conductorLookupSize = conductorSizes[i];
            break;
        }
    }
    if (conductorLookupSize === 0) { conductorLookupSize = 630 };

    return conductorLookupSize;

}
