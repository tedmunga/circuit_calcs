
const LoadTab = {

    loadCounter: 1,
    powerInput: null,
    pfInput: null,
    resistanceInput: null,
    reactanceInput: null,
    voltageInput: null,
    
    init(){
        this.loadCounter = 1;
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
                const R = (V ** 2 * pf) / P;
                const X = (V ** 2 * Math.sqrt(1 - pf ** 2)) / P;
                console.log(`R = ${R.toFixed(2)} Ω, X = ${X.toFixed(2)} Ω`);
                this.resistanceInput.value = R.toFixed(2);
                this.reactanceInput.value =  X.toFixed(2);
              } else {
                console.warn("Please enter valid numbers for power, power factor, and voltage.");
              }
            });
        });
    },

    addLoadRow(data = null) {
      const tbody = document.querySelector('#loadTable tbody');
      const row = document.createElement('tr');

      const loadId = data?.loadId ?? this.loadCounter++;
      const description = data?.description || "";
      const R = data?.R || 0;
      const X = data?.X || 0;

      row.innerHTML = `
        <td>${loadId}</td>
        <td><input type="text" class="description" value="${description}"></td>
        <td><input type="number" class="resistance" value="${R}"></td>
        <td><input type="number" class="reactance" value="${X}"></td>
      `;

      tbody.appendChild(row);
      logger('debug', "tab3 appendChild row");
      LoadTab.updateRow(row);

      row.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => LoadTab.updateRow(row));
      });
    },
    
    addLoadToTable(){
        const data = {
            R: this.resistanceInput.value,
            X: this.reactanceInput.value
        };
        LoadTab.addLoadRow(data);
    },

    updateRow(row) {
        
      //~ const length = parseFloat(row.querySelector('.length').value) || 0;
      //~ const size = row.querySelector('.size').value;
      //~ const type = row.querySelector('.type').value;
      //~ const temp = row.querySelector('.temp').value;
      //~ const form = row.querySelector('.form').value;
      //~ const insulation = row.querySelector('.insulation').value;

      //~ const R = table_34[size]?.[type]?.[temp] ?? 0;
      //~ const X = table_30[size]?.[form]?.[insulation] ?? 0;

      //~ row.querySelector('.r').textContent = R;
      //~ row.querySelector('.x').textContent = X;

      updateLoadDropdownFromTable();
    },

    saveConfig() {
      const rows = [...document.querySelectorAll('#loadTable tbody tr')];
      const data = rows.map(row => ({
        loadId: row.cells[0].textContent,
        description: row.querySelector('.description').value,
        R: row.querySelector('.resistance').value,
        X: row.querySelector('.reactance').value,

      }));
      
      logger('debug', "save data", data);

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
          this.loadCounter = Math.max(...data.map(row => row.loadId)) + 1;
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
