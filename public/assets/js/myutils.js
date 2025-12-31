function greet(name) {
  return `Hello, ${name}!`;
}
async function SubmitChanges() {
  const playerId = document.getElementById('playerId').value;
  const data = {
    first: document.getElementById('firstName').value,
    last: document.getElementById('lastName').value,    
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    dob_month: document.getElementById('dobMonth').value,
    acblNumber: document.getElementById('acblnumber').value,
    ice_phone: document.getElementById('ice_phone').value,
    ice_relation: document.getElementById('ice_relation').value,
    m1: document.getElementById('m1').checked,
    t1: document.getElementById('t1').checked,
    f1: document.getElementById('f1').checked,
    ug: document.getElementById('ug').checked
  };      
  // Placeholder function to submit changes
  console.log('Submitting changes...');
  const res = await fetch(`/api/playerdata/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed: ${res.status} ${err}`);
  }
  return res.json(); // updated resource (if returned)  
}
function AddPlayer() {
  // Placeholder function to add a player
  console.log('Adding a new player...');
} 

async function PopulateFormForEdit(playerId) {
  // Placeholder function to populate form for editing a player
  console.log(`Populate form for editing player with ID: ${playerId}`);
  try {
    const res = await fetch(`/api/playerdata/${playerId}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result[0]); 
    document.getElementById('playerId').value = result[0].id || '';
    document.getElementById('firstName').value = result[0].first || '';
    document.getElementById('lastName').value = result[0].last || '';
    document.getElementById('email').value = result[0].email || '';
    document.getElementById('phone').value = result[0].phone || '';
    document.getElementById('dobMonth').value = result[0].dob_month || '';
    document.getElementById('acblnumber').value = result[0].acblNumber || '';
    document.getElementById('ice_phone').value = result[0].ice_phone || '';
    document.getElementById('ice_relation').value = result[0].ice_relation || '';
    document.getElementById('m1').checked = result[0].m1 || false;
    document.getElementById('t1').checked = result[0].t1 || false;
    document.getElementById('f1').checked = result[0].f1 || false;
    document.getElementById('ug').checked = result[0].ug || false;
  } catch (err) {
    console.error(`Error populating form for player:${playerId}`, err);
  }   
}
async function DeletePlayer(playerId) {
  // Placeholder function to delete a player
  console.log(`Delete player with ID: ${playerId}`);
  try {
    const res = await fetch(`/api/playerdata/${playerId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result.message); 
    // Refresh the table after deletion
    await createPlayerTable();
  } catch (err) {
    console.error('Error deleting player:', err);
  }   
}

async function createPlayerTable() {
  try {
    const res = await fetch('/api/playerdata');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const tbody = document.getElementById('mainTableBody');
    if (!tbody) return console.warn('Table body #mainTableBody not found');
    tbody.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      // append cells in the order the server returned them
      var firstElement = true; //assume first element is ID
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        if( firstElement ) {
          td.classList.add('col-hidden');
          firstElement = false;
        }
        td.textContent = val == null ? '' : val;
        tr.appendChild(td);
      });

      //add a button for editing
      const tdEdit = document.createElement('td');
      const button = document.createElement('button');
      button.textContent = 'Edit';
      button.addEventListener('click', () => {
        alert(`Edit player with ID: ${row.id}`);
        PopulateFormForEdit(row.id);
        alert('Now transfer focus to the form for editing.');
      });
      tdEdit.appendChild(button);
      tr.appendChild(tdEdit);

      //add a button for deleting
      const tdDel = document.createElement('td');
      const buttonDel = document.createElement('button');
      buttonDel.textContent = 'Delete';
      buttonDel.addEventListener('click', () => {
        alert(`Delete player with ID: ${row.id}`);
        DeletePlayer(row.id);
        alert('Now populate the table again.');
      });
      tdDel.appendChild(buttonDel);
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('API error:', err);
  }
}

document.addEventListener('DOMContentLoaded', createPlayerTable);

/**
 * Toggle visibility of a column by zero-based index for a given table selector.
 * Example: toggleColumn('#playersTable', 2);
 */
function toggleColumn(tableSelector, colIndex) {
  const table = document.querySelector(tableSelector);
  if (!table) return;
  table.querySelectorAll('tr').forEach((tr) => {
    const cell = tr.children[colIndex];
    if (cell) cell.classList.toggle('col-hidden');
  });
}

// Expose for use in console or other scripts
window.toggleColumn = toggleColumn;