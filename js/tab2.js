
const CableTab = {

    groupCounter: 1,
    
    init(){
        this.groupCounter = 1;
        
        const data = JSON.parse(localStorage.getItem('cableConfig') || "[]");
        data.forEach(d => CableTab.addCableRow(d));
    },

    addCableRow(data = null) {
      const tbody = document.querySelector('#cableTable tbody');
      const row = document.createElement('tr');

      // Size is shared beteen both R (table_34) and X (table_30)
      const sizes = Object.keys(table_34).sort((a, b) => parseFloat(a) - parseFloat(b));
      
      // R (table_34) only values
      const types = Object.keys(table_34[sizes[0]]);
      const temps = Object.keys(table_34[sizes[0]][types[0]]);
      
      // X (table_30) only values
      const forms = Object.keys(table_30[sizes[0]]);
      const insulations = Object.keys(table_30[sizes[0]][forms[0]]);

      const groupId = data?.groupId ?? this.groupCounter++;
      const description = data?.description || "";
      const length = data?.length || '';
      const size = data?.size || sizes[0];
      const type = data?.type || types[0];
      const temp = data?.temp || temps[0];
      const form = data?.form || forms[0];
      const insulation = data?.insulation || insulations[0];

      row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td>${groupId}</td>
        <td><input type="text" class="description" value="${description}"></td>
        <td><input type="number" class="length" value="${length}"></td>
        <td>
          <select class="size">${sizes.map(s => `<option value="${s}" ${s === size ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </td>
        <td>
          <select class="type">${types.map(t => `<option value="${t}" ${t === type ? 'selected' : ''}>${t}</option>`).join('')}</select>
        </td>
        <td>
          <select class="temp">${temps.map(t => `<option value="${t}" ${t === temp ? 'selected' : ''}>${t}</option>`).join('')}</select>
        </td>
        <td>
          <select class="form">${forms.map(t => `<option value="${t}" ${t === form ? 'selected' : ''}>${t}</option>`).join('')}</select>
        </td>
        <td>
          <select class="insulation">${insulations.map(t => `<option value="${t}" ${t === insulation ? 'selected' : ''}>${t}</option>`).join('')}</select>
        </td>
        <td class="r">0</td>
        <td class="x">0</td>
        <td class="total-r">0</td>
        <td class="total-x">0</td>
      `;

      tbody.appendChild(row);
      CableTab.updateRow(row);

      row.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => CableTab.updateRow(row));
      });
    },

    deleteCableRows(){
      const tbody = document.querySelector('#cableTable tbody');
      const rows = tbody.querySelectorAll('tr');

      rows.forEach(row => {
        const checkbox = row.querySelector('.row-select');
        if (checkbox?.checked) {
          row.remove();
        }
      });
      CableTab.updateRow(row);
      
    },

    getJsonData() {
      const rows = [...document.querySelectorAll('#cableTable tbody tr')];
      const data = rows.map(row => ({
//        groupId: row.cells[0].textContent,
        description: row.querySelector('.description').value,
        length: row.querySelector('.length').value,
        size: row.querySelector('.size').value,
        type: row.querySelector('.type').value,
        temp: row.querySelector('.temp').value,
        form: row.querySelector('.form').value,
        insulation: row.querySelector('.insulation').value
      }));
      
      return data;
    },
        

    updateRow(row) {
      const length = parseFloat(row.querySelector('.length').value) || 0;
      const size = row.querySelector('.size').value;
      const type = row.querySelector('.type').value;
      const temp = row.querySelector('.temp').value;
      const form = row.querySelector('.form').value;
      const insulation = row.querySelector('.insulation').value;

      const R = table_34[size]?.[type]?.[temp] ?? 0;
      const X = table_30[size]?.[form]?.[insulation] ?? 0;

      row.querySelector('.r').textContent = R;
      row.querySelector('.x').textContent = X;
      row.querySelector('.total-r').textContent = (R * length/1000).toFixed(3);
      row.querySelector('.total-x').textContent = (X * length/1000).toFixed(3);
      
      // Save the data to localStorage so the user doesn't lose work from a 
      // Browser shutdown etc.
      const data = CableTab.getJsonData();
      localStorage.setItem('cableConfig', JSON.stringify(data));
      updateGroupDropdownFromTable();
    },


    saveConfig() {
      const data = CableTab.getJsonData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cable_config.json';
      a.click();
    },


    loadConfig(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
            
          const data = JSON.parse(e.target.result);
          const tbody = document.querySelector('#cableTable tbody');
          tbody.innerHTML = '';
          data.forEach(d => CableTab.addCableRow(d));
          this.groupCounter = Math.max(...data.map(row => row.groupId)) + 1;

        } catch (err) {
          console.error('Error parsing JSON file:', err); // Logs full error to browser console
          alert('Invalid JSON file:\n' + err.message);    // Gives a clearer alert message
        }
      };
      reader.readAsText(file);
      updateGroupDropdownFromTable();
    }
};
