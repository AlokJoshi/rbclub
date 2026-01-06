function greet(name) {
  return `Hello, ${name}!`;
}

async function showAttendance(day) {
  try {
    console.log(`Showing attendance for ${day}`);
    const res = await fetch(`/api/attendance/${day}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);

    const el = document.getElementById('attendanceTable');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.setAttribute('tabindex', '-1');
    el.focus();
    // create expectedlistofplayers table here
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return console.warn('Table body #attendanceTableBody not found');
    tbody.innerHTML = '';
    result.forEach(row => {
      const tr = document.createElement('tr');
      // append cells in the order the server returned them
      // query returns only first, last, and phone and email
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        td.textContent = val == null ? '' : val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('API error:', err);
  }
}

async function SubmitChanges() {
  const playerId = document.getElementById('playerId').value;
  // Build FormData for multipart upload (includes file if selected)
  const form = new FormData();
  form.append('first', document.getElementById('firstName').value);
  form.append('last', document.getElementById('lastName').value);
  form.append('email', document.getElementById('email').value);
  form.append('phone', document.getElementById('phone').value);
  form.append('dob_month', document.getElementById('dobMonth').value);
  form.append('acblNumber', document.getElementById('acblnumber').value);
  form.append('ice_phone', document.getElementById('ice_phone').value);
  form.append('ice_relation', document.getElementById('ice_relation').value);
  if (document.getElementById('m1').checked) form.append('m1', 'on');
  if (document.getElementById('t1').checked) form.append('t1', 'on');
  if (document.getElementById('f1').checked) form.append('f1', 'on');
  if (document.getElementById('ug').checked) form.append('ug', 'on');
  const fileInput = document.getElementById('playerImageInput');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    form.append('playerImage', fileInput.files[0]);
  }
  console.log('Submitting changes (multipart)...');
  const res = await fetch(`/api/playerdata/${playerId}`, {
    method: 'PUT',
    body: form
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed: ${res.status} ${err}`);
  }

  createPlayerTable(); // refresh the table display

  const el = document.getElementById('listofplayers');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.setAttribute('tabindex', '-1');
  el.focus();

  return res.json(); // updated resource (if returned)  
}
async function AddPlayer() {
  // Placeholder function to add a player
  console.log('Adding a new player...');
  // Build FormData for multipart upload (includes file if selected)
  const form = new FormData();
  form.append('first', document.getElementById('firstName').value);
  form.append('last', document.getElementById('lastName').value);
  form.append('email', document.getElementById('email').value);
  form.append('phone', document.getElementById('phone').value);
  form.append('dob_month', document.getElementById('dobMonth').value== ''?0:document.getElementById('dobMonth').value);
  form.append('acblNumber', document.getElementById('acblnumber').value);
  form.append('ice_phone', document.getElementById('ice_phone').value);
  form.append('ice_relation', document.getElementById('ice_relation').value);
  if (document.getElementById('m1').checked) form.append('m1', 'on');
  if (document.getElementById('t1').checked) form.append('t1', 'on');
  if (document.getElementById('f1').checked) form.append('f1', 'on');
  if (document.getElementById('ug').checked) form.append('ug', 'on');
  const fileInput2 = document.getElementById('playerImageInput');
  if (fileInput2 && fileInput2.files && fileInput2.files[0]) {
    form.append('playerImage', fileInput2.files[0]);
  }
  console.log('Adding player (multipart)...');
  const res = await fetch(`/api/playerdata`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    const err = await res.text();
    if (res.status === 400) {
      alert('Player with the same first and last name already exists');
      return;
    }
    throw new Error(`Add player failed: ${res.status} ${err}`);
  }

  createPlayerTable(); // refresh the table display

  const el = document.getElementById('listofplayers');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.setAttribute('tabindex', '-1');
  el.focus();

  return res.json(); // updated resource (if returned) 
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

    // populate image preview if available (supports either image_data or image_path)
    const preview = document.getElementById('playerImagePreview');
    const hidden = document.getElementById('playerImageData');
    const src = result[0].image_data || result[0].image_path || '';
    if (src) {
      if (preview) { preview.src = src; preview.style.display = 'inline-block'; }
      if (hidden) hidden.value = src;
    } else {
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      if (hidden) hidden.value = '';
    }

    // Focus on the first name field for convenience
    const el = document.getElementById('addoreditplayer');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.setAttribute('tabindex', '-1');
    el.focus();

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
    const playerid_index = 0; // zero-based index of ID column
    const image_index = 1; // zero-based index of image column
    const dob_month_index = 6; // zero-based index of DOB_Month column
    const email_index = 4; // zero-based index of email column
    const ice_phone_index = 7; // zero-based index of ice_phone column
    const ice_relation_index = 8; // zero-based index of ice_relation column

    const show_playerid = false
    const show_dob_month = document.getElementById('DOB_Month').checked;
    const show_email = document.getElementById('Email').checked;
    const show_ice_phone = document.getElementById('Ice_phone').checked;
    const show_ice_relation = document.getElementById('ICE_Relation').checked;

    var col_index = 0;
    const res = await fetch('/api/playerdata');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const tbody = document.getElementById('mainTableBody');
    if (!tbody) return console.warn('Table body #mainTableBody not found');
    tbody.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      // append cells in the order the server returned them
      col_index = 0;
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        if (playerid_index === col_index && !show_playerid) {
          td.classList.add('col-hidden');
        }
        if (image_index === col_index) {
          const img = document.createElement('img');
          if (val===null || val==='') {
            img.src = 'https://placehold.co/60x40/png';
            img.alt = 'No Image';
          } else {
            img.src = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${val}`;
            img.alt = 'Player Image';
            img.width = 60;
            img.height = 40;
          }
          td.appendChild(img);
        }
        if (dob_month_index === col_index && !show_dob_month) {
          td.classList.add('col-hidden');
        }
        if (email_index === col_index && !show_email) {
          td.classList.add('col-hidden');
        }
        if (ice_phone_index === col_index && !show_ice_phone) {
          td.classList.add('col-hidden');
        }
        if (ice_relation_index === col_index && !show_ice_relation) {
          td.classList.add('col-hidden');
        }
        td.textContent = val == null ? '' : val;
        tr.appendChild(td);
        col_index++;
      });

      //add a button for editing
      const tdEdit = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button small';
      button.textContent = 'Edit';
      button.addEventListener('click', () => {
        PopulateFormForEdit(row.id);
      });
      tdEdit.appendChild(button);
      tr.appendChild(tdEdit);

      //add a button for deleting
      const tdDel = document.createElement('td');
      const buttonDel = document.createElement('button');
      buttonDel.type = 'button';
      buttonDel.className = 'button small';
      buttonDel.textContent = 'Delete';
      buttonDel.addEventListener('click', () => {
        DeletePlayer(row.id);
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

// Image input handling: read selected image as DataURL and store in hidden input for submission
function setupImageInput() {
  const fileInput = document.getElementById('playerImageInput');
  const preview = document.getElementById('playerImagePreview');
  const hidden = document.getElementById('playerImageData');
  if (!fileInput) return;
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      if (hidden) hidden.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      const dataUrl = ev.target.result;
      if (preview) { preview.src = dataUrl; preview.style.display = 'inline-block'; }
      if (hidden) hidden.value = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupImageInput();
});

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