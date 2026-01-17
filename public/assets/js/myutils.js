// const express = require("express");

function greet(name) {
  return `Hello, ${name}!`;
}

//Global variables
let AdminLoggedIn = false;
let UserLoggedIn = false;
let UserLoggedInID = 0;

// async function checkIfUserShouldBeAllowedTemporayLogin(){
//   const q1 = await DoNameCheck()
//   const q2 = await PopulateTerms()
//   const q3 = await PopulateNonMembers()
//   if(q1 && q2 && q3) showCustomAlert("You passed all checks")
// }

function delay(durationInMilliseconds) {
  return new Promise(resolve => setTimeout(resolve, durationInMilliseconds));
}

async function showCustomAlert(message) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = alertBox.querySelector('p');
  alertMessage.textContent = message;
  alertBox.style.display = 'flex';
  await delay(3000); // Display for 3 seconds
  // Fade out effect
  alertBox.style.transition = 'opacity 0.5s';
  alertBox.style.display = 'none';
}

async function nonmemberschanged() {
  //check if the number of selection is other than 2
  const selectElement = document.getElementById('nonmembersselect');

  const message = selectElement.selectedOptions.length == 2 ? "" : "Please select 2 and only 2 from the above list."

  const errorEl = document.getElementById("nonmemberserror")

  errorEl.innerText = message

  console.log(message)

}

async function DoNonMembersCheck() {
  const selectElement = document.getElementById('nonmembersselect');
  const nonmemberscheckresult = document.getElementById('nonmemberscheckresult')
  try {

    const res = await fetch('/checknonmembers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "nonmembers": [selectElement.selectedOptions[0].value,
        selectElement.selectedOptions[1].value]
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()

    // const nonmemberscheckmodal = document.getElementById('nonmemberscheckmodal')
    // nonmemberscheckmodal.style.display = 'none'
    // const namecheckmodal = document.getElementById('namecheckmodal')
    // namecheckmodal.style.display = 'block'
    
    //result object has botharenonmember and temporarylogin properties
    const botharenonmember=result.botharenonmembers
    const temporarylogin=result.temporarylogin
    if (botharenonmember) {
      showCustomAlert(`Correct! ${selectElement.selectedOptions[0].value} and 
        ${selectElement.selectedOptions[1].value} do not play at our club.`)
      nonmemberscheckresult.innerText = "You correctly identified the non-members"
      // return true
    } else {
      showCustomAlert(`Sorry! that answer is wrong.`)
      nonmemberscheckresult.innerText = "Sorry you failed to identify the non-members."
      // return false
    }
    if(temporarylogin){
      showCustomAlert ('Congratulations. You have passed all checks.')
      //close the form
      const form = document.getElementById("namecheckmodal")
      form.display.style = 'none'
    }else{
      showCustomAlert ('Sorry. You have failed the checks.')
      window.location.href = "localhost:3000"  
    }
  } catch (err) {
    console.error('Error checking non-members:', err);
    return false
  }

}

async function isAdmin(userId) {
  try {
    const res = await fetch('/isadmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.isAdmin;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}


async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    UserLoggedIn = true;
    UserLoggedInID = result.userId;
    AdminLoggedIn = result.isAdmin;
    console.log(`Is Admin: ${AdminLoggedIn}`);
    showCustomAlert('Successfully logged in ' + username + (AdminLoggedIn ? ' (Admin)' : ''));
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert('Login failed: ' + err.message);
  }
  const loginModal = document.getElementById('login-modal')
  loginModal.style.display = "none";
}

async function changePassword() {
  const username = document.getElementById('changepasswordusername').value;
  const currentpassword = document.getElementById('currentpassword').value;
  const newpassword1 = document.getElementById('newpassword1').value;
  const newpassword2 = document.getElementById('newpassword2').value;
  if (newpassword1 !== newpassword2) {
    showCustomAlert('New passwords do not match');
    return;
  }
  try {
    const res = await fetch('/changepassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, currentpassword, newpassword1 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    showCustomAlert('Password changed successfully');
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert('Password change failed: ' + err.message);
  }
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

function ClearForm() {
  document.getElementById('playerImageDisplay').src = '';
  document.getElementById('playerImagePreview').src = '';
  document.getElementById('playerId').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('dobMonth').value = '';
  document.getElementById('acblnumber').value = '';
  document.getElementById('ice_phone').value = '';
  document.getElementById('ice_relation').value = '';
  document.getElementById('m1').checked = false;
  document.getElementById('t1').checked = false;
  document.getElementById('f1').checked = false;
  document.getElementById('ug').checked = false;
  document.getElementById('playerImageInput').value = '';
  document.getElementById('playerImageData').value = '';
}

function DisableSubmitButton(disable) {
  const btn = document.getElementById('submitPlayerChangesButton');
  if (btn) btn.disabled = disable;
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

  ClearForm();
  DisableSubmitButton(true);

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
  form.append('dob_month', document.getElementById('dobMonth').value == '' ? 0 : document.getElementById('dobMonth').value);
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
      showCustomAlert('Player with the same first and last name already exists');
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
    document.getElementById('playerImageDisplay').src = result[0].image_path === null || result[0].image_path === '' ? 'https://generative-placeholders.stefanbohacek.com/image?width=40&height=40&img=1' : `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${result[0].image_path} `;
    // document.getElementById('playerImagePreview').src = result[0].image_path===null ||result[0].image_path===''?'https://generative-placeholders.stefanbohacek.com/image?width=40&height=40&img=1':`https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${result[0].image_path} `;
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
    showCustomAlert(result.message);
    // Refresh the table after deletion
    await createPlayerTable();
  } catch (err) {
    showCustomAlert('Error deleting player:', err);
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
    var row_index = 0;
    rows.forEach(row => {
      row_index++;
      const tr = document.createElement('tr');
      // append cells in the order the server returned them
      col_index = 0;
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        if (playerid_index === col_index && !show_playerid) {
          td.classList.add('col-hidden');
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
        if (image_index === col_index) {
          const img = document.createElement('img');
          if (val === null || val === '') {
            img.src = `https://generative-placeholders.stefanbohacek.com/image?width=40&height=40&img=${row_index}`;
            img.alt = 'No Image';
          } else {
            img.src = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${val}`;
            img.alt = 'Player Image';
            img.width = 40;
            img.height = 40;
          }
          img.borderRadius = 20;
          td.appendChild(img);
        } else {
          td.textContent = val == null ? '' : val;
        }
        tr.appendChild(td);
        col_index++;
      });

      //add a button for editing
      const tdEdit = document.createElement('td');
      const iEdit = document.createElement('i');
      iEdit.className = 'fas fa-edit';

      iEdit.addEventListener('click', () => {
        if (UserLoggedInID === row.id || AdminLoggedIn) {
          PopulateFormForEdit(row.id);
        } else {
          showCustomAlert('You must be logged in as Admin or as yourself to edit a player record.');
        }
      });
      tdEdit.appendChild(iEdit);
      tr.appendChild(tdEdit);

      //add a button for deleting
      const tdDel = document.createElement('td');
      const iDelete = document.createElement('i');
      iDelete.className = 'fas fa-trash';
      iDelete.addEventListener('click', async () => {
        if (AdminLoggedIn) {
          if (window.prompt(`Type DELETE to confirm deletion of player :${row.first} ${row.last}`, '') === 'DELETE') {
            await DeletePlayer(row.id);
          }
          else {
            showCustomAlert('You must be loggen in as Admin to delete a player record.');
          }
        }
      });
      tdDel.appendChild(iDelete);
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
      showCustomAlert('Please select an image file');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function (ev) {
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

//function to check if the user should be admitted to the site
async function shouldAdmitToSite() {
  //show a modal message explaining the two options:
  //1. Login with the provided login details
  //2. Gain admittance after proving that
  //   a. Your name matches with club user list
  //   b. You can spot a non-bridge term in a list of bridge terms
  //   c. You can spot 2 non-members in a list of members and members
  const shouldAdmitToSiteModal = document.getElementById('shouldadmittositemodal')
  shouldAdmitToSiteModal.style.display = 'block'
}
async function IwantToLogin() {
  const shouldAdmitToSiteModal = document.getElementById('shouldadmittositemodal')
  shouldAdmitToSiteModal.style.display = 'none'
  var loginModal = document.getElementById("login-modal");
  loginModal.style.display = "block";
}

async function IwantToAnswerQuestions() {
  const shouldAdmitToSiteModal = document.getElementById('shouldadmittositemodal')
  shouldAdmitToSiteModal.style.display = 'none'
  var IwantToAnswerQuestions = document.getElementById("namecheckmodal");
  IwantToAnswerQuestions.style.display = "block";
}

async function PopulateTerms() {
  // const questionsModal = document.getElementById('namecheckmodal')
  // questionsModal.style.display = 'none'
  // const termCheckModal = document.getElementById('termcheckmodal')

  //populate the terms
  const res = await fetch('/bridgeterms', {
    method: 'GET'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const result = await res.json()
  console.log(result);
  const select = document.getElementById('bridgeterm')
  // termCheckModal.style.display = "block";
  result.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.term;
    option.textContent = `${row.term}`;
    select.appendChild(option);
  })
}

async function PopulateNonMembers() {
  // const questionsModal = document.getElementById('namecheckmodal')
  // questionsModal.style.display = 'none'
  // const nonmemberscheckmodal = document.getElementById('nonmemberscheckmodal')
  // nonmemberscheckmodal.style.display = 'block'
  try {
    const res = await fetch('/mixofmembersandnonmembers', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    const select = document.getElementById('nonmembersselect');
    if (!select) return console.warn('Select element #nonmembersselect not found');
    select.innerHTML = '';
    result.forEach(player => {
      const option = document.createElement('option');
      option.value = player.first;
      option.textContent = `${player.first}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error creating non-member form:', err);
  }
}

async function DoTermCheck() {
  document.getElementById('termcheck').style.display='none'
  await PopulateNonMembers()
  document.getElementById('nonmemberscheck').style.display='block'  
  try {

    const select = document.getElementById('bridgeterm')
    const termcheckresult = document.getElementById('termcheckresult')
    //now hide this modal
    if (select.selectedOptions.length !== 1) {
      showCustomAlert('Please select one invalid Bridge term and then click on this button')
    } else {
      const invalidbridgeTerm = select.selectedOptions[0].value
      const res = await fetch(`/isinvalidbridgeterm/${invalidbridgeTerm}`, {
        method: 'GET'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      // const termcheckmodalmodal = document.getElementById('termcheckmodal')
      // termcheckmodalmodal.style.display = 'none'
      // const namecheckmodal = document.getElementById('namecheckmodal')
      // namecheckmodal.style.display = 'block'
      if (result == true) {
        showCustomAlert(`Correct! You seem to know Bridge terms`)
        termcheckresult.innerText = "You correctly identified invalid Bridge term."
        return true
      } else {
        showCustomAlert(`Sorry! you failed to identify the invalid Bridge term.`)
        termcheckresult.innerText = `Sorry ${invalidbridgeTerm} is a valid Bridge term.`
        return false
      }
    }
  } catch (err) {
    console.log(`Error while checking bridge term: ${err}`)
    showCustomAlert('Error checking bridge term:', err)
    return false
  }
}
async function DoNameCheck() {
  const myname = document.getElementById('myname')
  const name = myname.value
  const fullname = name.replace(/\s+/g, ' ').trim().toLowerCase()
  const namecheckresult = document.getElementById('namecheckresult')
  //hide namecheck, show termcheck
  document.getElementById('namecheck').style.display='none'
  await PopulateTerms()
  document.getElementById('termcheck').style.display='block'
  try {

    const res = await fetch('/checkfullname', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullname })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()
    if (result == true) {
      showCustomAlert(`Correct! You seem to a member of the club`)
      namecheckresult.innerText = "Correct! You seem to be a member of the club."
      return true
    } else {
      showCustomAlert(`Sorry! you are not from our club`)
      namecheckresult.innerText = `Sorry ${fullname}! you are not from our club`
      return false
    }
  } catch (err) {
    console.error('Error checking full name:', err);
    showCustomAlert('Error checking full name:', err)
    return false
  }
}

// Expose for use in console or other scripts
window.toggleColumn = toggleColumn;

// added for modal forms
// Get the modal
var loginModal = document.getElementById("login-modal");
var changePasswordModal = document.getElementById("changePassword-modal");
var nonmemberscheckmodal = document.getElementById("nonmemberscheckmodal");

// Get the button that opens the modal
// var btn = document.getElementById("open-modal-btn");

// Get the <span> element that closes the modal
const span1 = document.getElementsByClassName("close")[0];
const span2 = document.getElementsByClassName("close")[1];

// When the user clicks the button, open the modal
// btn.onclick = function() {
//   modal.style.display = "block";
// }

// When the user clicks on <span> (x), close the modal
span1.onclick = function () {
  loginModal.style.display = "none";
}
span2.onclick = function () {
  changePasswordModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == loginModal) {
    loginModal.style.display = "none";
  }
}

// changePasswordModal.style.display = "flex";

//set this to block to see the login modal
loginModal.style.display = "none";


// createNonPlayerForm();
// nonmemberscheckmodal.style.display = "flex";

shouldAdmitToSite()

// checkIfUserShouldBeAllowedTemporayLogin()