
const LoadTab = {

    powerInput: null,
    pfInput: null,
    resistanceInput: null,
    reactanceInput: null,
    voltageInput: null,
    
    init(){
        this.voltageInput = document.getElementById('voltage');
        this.powerInput = document.getElementById('power');
        this.pfInput = document.getElementById('power_factor');
        this.resistanceInput = document.getElementById('resistance_2');
        this.reactanceInput = document.getElementById('reactance_2');
        
        [this.voltageInput, this.powerInput, this.pfInput, this.resistanceInput, this.reactanceInput].forEach(input => {
            input.addEventListener('change', (event) => {
              const changedInput = event.target;
              console.log(`${changedInput.id} changed to`, changedInput.value);
              
              const P = parseFloat(this.powerInput.value.trim());
              const pf = parseFloat(this.pfInput.value.trim());
              const V = parseFloat(this.voltageInput.value.trim());
                
              if (isNaN(P) || isNaN(pf) || isNaN(V)){
                return;
              }
                
              if (P > 0 && pf > 0 && V > 0) {
                const I = P / (V * pf);
                const Z = V / I;               // or (V ** 2 * pf) / P
                const theta = Math.acos(pf);

                const R = Z * pf;              // or (V**2 * pf**2) / P
                const X = Z * Math.sin(theta); // or (V**2 * pf / P) * Math.sqrt(1 - pf**2)
                console.log(`R = ${R.toFixed(2)} Ω, X = ${X.toFixed(2)} Ω`);
                this.resistanceInput.value = R.toFixed(2);
                this.reactanceInput.value =  X.toFixed(2);
              } else {
                console.warn("Please enter valid numbers for power, power factor, and voltage.");
              }
            });
        });
        
        const data = JSON.parse(localStorage.getItem('loadConfig') || "[]");
        logger('info', 'Adding Load data:', data);
        data.forEach(d => LoadTab.addLoadRow(d));
    },


    addLoadRow(data = null) {
      const tbody = document.querySelector('#loadTable tbody');
      const row = document.createElement('tr');

      const loadId = data?.loadId ?? LoadTab.getFirstAvailableLoadId();
      const description = data?.description || "";
      const R = data?.R || 0;
      const X = data?.X || 0;

      row.innerHTML = `
        <td class="l_check_td"><input type="checkbox" class="row-select"></td>
        <td class="l_id_td">${loadId}</td>
        <td><input type="text" class="description" value="${description}"></td>
        <td><input type="number" id="load_R" class="resistance" value="${R}"></td>
        <td><input type="number" id="load_X" class="reactance" value="${X}"></td>
      `;

      tbody.appendChild(row);
      logger('debug', "tab3 appendChild row");
      LoadTab.updateRow(row);

      row.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => LoadTab.updateRow(row));
      });
    },


    getFirstAvailableLoadId() {
      const rows = document.querySelectorAll('#loadTable tbody tr');
      const ids = new Set(Array.from(rows).map(row => parseInt(row.children[1].textContent, 10)));

      let candidate = 1;
      while (ids.has(candidate)) {
        candidate++;
      }
      return candidate;
    },


    addLoadToTable(){
        const data = {
            R: this.resistanceInput.value,
            X: this.reactanceInput.value
        };
        LoadTab.addLoadRow(data);
    },
    
    
    deleteCableRows(){
      const tbody = document.querySelector('#loadTable tbody');
      const rows = tbody.querySelectorAll('tr');

      rows.forEach(row => {
        const checkbox = row.querySelector('.row-select');
        if (checkbox?.checked) {
          row.remove();
        }
      });
      LoadTab.updateRow();
      
    },


    getJsonData() {
      const rows = [...document.querySelectorAll('#loadTable tbody tr')];
      const data = rows.map(row => ({
        loadId: row.cells[1].textContent,
        description: row.querySelector('.description').value,
        R: row.querySelector('.resistance').value,
        X: row.querySelector('.reactance').value,
      }));
      
      return data;
    },

    updateRow(row) {

      const data = LoadTab.getJsonData();
      localStorage.setItem('loadConfig', JSON.stringify(data));
      
      updateLoadDropdownFromTable(row);
    },


    saveConfig() {
      const rows = [...document.querySelectorAll('#loadTable tbody tr')];
      const data = LoadTab.getJsonData();
      
      logger('debug', "Save Load data", data);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'load_config.json';
      a.click();
    },


    loadConfig(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
      
        try {
            
          const data = JSON.parse(e.target.result);
          const tbody = document.querySelector('#loadTable tbody');
          tbody.innerHTML = '';
          data.forEach(d => LoadTab.addLoadRow(d));
          logger('debug', "load data", data);
        } catch (err) {
          console.error('Error parsing JSON file:', err); // Logs full error to browser console
          alert('Invalid JSON file:\n' + err.message);    // Gives a clearer alert message
        }
      };
      reader.readAsText(file);
      updateLoadDropdownFromTable();
    }

};
