//global
let sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin

function delay(durationInMilliseconds) {
  return new Promise(resolve => setTimeout(resolve, durationInMilliseconds));
}

//delay duration in seconds
async function showCustomAlert(message,delayDuration=3) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = alertBox.querySelector('p');
  alertMessage.textContent = message;
  alertBox.style.display = 'flex';
  await delay(delayDuration * 1000); // Display for the specified duration
  // Fade out effect
  alertBox.style.transition = 'opacity 0.5s';
  alertBox.style.display = 'none';
}

function displaynameandphonecheckform() {
  const nameandphonecheckmodal = document.getElementById('nameandphonecheck')
  nameandphonecheckmodal.style.display = 'block'
}

function displayloginform() {
  const loginmodal = document.getElementById('loginmodal')
  loginmodal.style.display = 'block'
}

function displaychangepasswordform() {
  const changepasswordmodal = document.getElementById('changepasswordmodal')
  const changepasswordusername = document.getElementById('changepasswordusername')
  changepasswordusername.value = ''
  const currentpassword = document.getElementById('currentpassword')
  currentpassword.value = ''
  changepasswordmodal.style.display = 'block'
}

function displayaddnewplayerform() {
  if (!isAdmin || !securelogin) {
    showCustomAlert('You must be securely logged in as Admin to add a new player.',10);
    return;
  }
  const addnewplayermodal = document.getElementById('addnewplayermodal')
  const newplayerfirstname = document.getElementById('newplayerfirstname')
  newplayerfirstname.value = ''
  const newplayerlastname = document.getElementById('newplayerlastname')
  newplayerlastname.value = ''
  addnewplayermodal.style.display = 'block'
}

function displaydefaultlogincredentialsform() {
  if (!isAdmin || !securelogin) {
    showCustomAlert('You must be securely logged in as Admin to view default login credentials.',10);
    return;
  }
  const defaultlogincredentials = document.getElementById('defaultlogincredentials')
  const dlc_name = document.getElementById('dlc_name')
  dlc_name.value = ''
  const defaultlogincredentialsresult = document.getElementById('defaultlogincredentialsresult')
  defaultlogincredentialsresult.innerText = ''
  defaultlogincredentials.style.display = 'block'
}

function closedefaultlogincredentialsform() {
  const defaultlogincredentials = document.getElementById('defaultlogincredentials')
  defaultlogincredentials.style.display = 'none'
}

function closeNameAndPhoneCheck() { 
  const nameandphonecheckmodal = document.getElementById('nameandphonecheck') 
  nameandphonecheckmodal.style.display = 'none'
}

async function GetDefaultLoginCredentials() {
  try {
    console.log('Fetching default login credentials');
    const fullname = document.getElementById('dlc_name').value;
    const first = fullname.split(' ')[0];
    const last = fullname.split(' ').slice(1).join(' ');
    const res = await fetch(`/getdefaultlogincredentials`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ first, last })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    const defaultlogincredentialsresult = document.getElementById('defaultlogincredentialsresult')
    defaultlogincredentialsresult.innerText = `Default Username: ${result.username}, Password: ${result.password}`
  } catch (err) {
    console.error('Error fetching default login credentials:', err);
    showCustomAlert(`Error fetching default login credentials: ${err.message}`,5);
  }
}
async function SubmitNewPlayer() {
  try {
    console.log('Adding new player first and last names only');
    const res = await fetch(`/addnewplayer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first: document.getElementById('newplayerfirstname').value,
      last: document.getElementById('newplayerlastname').value
    })
  });
  if (!res.ok) {
    const err = await res.text();
    if (res.status === 400) {
      showCustomAlert('Player with the same first and last name already exists',5);
      return;
    }
    throw new Error(`Add player failed: ${res.status} ${err}`);
  }
    //res.message has the username and password
    const result = await res.json();
    if (!result.success)  {
      showCustomAlert(`Adding new player failed: ${result.message}`,5);
      await createPlayerTable(); // refresh the table display
    } else {
      showCustomAlert(result.message,20);
    }
  } catch (err) {
    console.error('Error adding new player:', err);
    showCustomAlert(`Error adding new player: ${err.message}`,5);
  }
}

async function logout() {
  try {
    const res = await fetch('/logout', {
      method: 'POST'
    });
    
    if (!res.ok) {
      throw new Error('Logout failed');
    }
    
    showCustomAlert('You have been logged out.');
    decide();
  } catch (err) {
    console.error('Logout error:', err);
    showCustomAlert('Error during logout.'+err.message,5);
  }
}

async function nonmemberschanged() {
  //check if the number of selection is other than 2
  const selectElement = document.getElementById('nonmembersselect');

  const message = selectElement.selectedOptions.length == 2 ? "" : "Please select 2 and only 2 from the above list."

  const errorEl = document.getElementById("nonmemberserror")

  errorEl.innerText = message

  console.log(message)

}

function closeLoginModal() {
  const loginModal = document.getElementById("loginmodal");
  loginModal.style.display = "none";
}

function closeChangePasswordModal() {
  const changePasswordModal = document.getElementById("changepasswordmodal");
  changePasswordModal.style.display = "none";
}

function closeAddNewPlayerModal() {
  const addNewPlayerModal = document.getElementById("addnewplayermodal");
  addNewPlayerModal.style.display = "none";
}

function closeResetPasswordModal() {
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    if (resetPasswordModal) {
        resetPasswordModal.style.display = 'none';
        // Clear the token from URL
        window.history.replaceState({}, document.title, '/');
    }
}

async function login() {
  const user_name = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: user_name, password })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (!result.valid) {
      showCustomAlert(`Login failed: ${result.message}`,5);
      return;
    } else {
      console.log(result);
      username = user_name;
      userid = result.userId;
      isAdmin = result.isAdmin;
      securelogin = result.securelogin
      insecurelogin = result.insecurelogin
      casuallogin = result.casuallogin
      // if (isAdmin && securelogin) {
      // showCustomAlert('Successfully and securely logged in ' + username + (isAdmin ? ' (Admin)' : ''),5);
      // }else if (isAdmin && insecurelogin) {
      //   showCustomAlert('Successfully but insecurely logged in ' + username + (isAdmin ? ' (Admin)' : '') + '. Please change your password.',5); 
      // }else if (insecurelogin) {
      //   showCustomAlert('Successfully logged in ' + username + '. Please change your password. You will not be able to change your data till you are securely logged in',10);
      // } 
      decide();
    }
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert(`Login failed: ${err.message}`,5);
  }
  const loginModal = document.getElementById('loginmodal')
  loginModal.style.display = "none";
}

async function changePassword() {
  const username = document.getElementById('changepasswordusername').value;
  const currentpassword = document.getElementById('currentpassword').value;
  const newpassword1 = document.getElementById('newpassword1').value;
  const newpassword2 = document.getElementById('newpassword2').value;
  if (newpassword1 !== newpassword2) {
    showCustomAlert('New passwords do not match',5);
    return;
  }
  try {
    const res = await fetch('/changepassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, oldPassword: currentpassword, newPassword: newpassword1 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    showCustomAlert('Password changed successfully',5);
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert(`Password change failed: ${err.message}`,5);
  }
  const changePasswordModal = document.getElementById('changepasswordmodal')  
  changePasswordModal.style.display = "none";
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
  document.getElementById('isDirector').checked = false;
  document.getElementById('officerPosition').value = 'None';
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
  if (document.getElementById('isDirector').checked) form.append('isDirector', 'on');
  const officerPosition = document.getElementById('officerPosition').value;
  if (officerPosition) form.append('officerPosition', officerPosition);
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
  DisableSubmitButton(false);

  return res.json(); // updated resource (if returned)  
}

async function PopulateFormForEdit(playerId) {
  // Placeholder function to populate form for editing a player
  console.log(`Populate form for editing player with ID: ${playerId}`);
  try {
    DisableSubmitButton(false)
    const res = await fetch(`/api/playerdata/${playerId}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    //todo: fix this
    // document.getElementById('playerImageDisplay').src = result.image_path === null || result.image_path === '' ? 'https://generative-placeholders.stefanbohacek.com/image?width=40&height=40&img=1' : `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${result.image_path} `;
    document.getElementById('playerId').value = result.id || '';
    document.getElementById('firstName').value = result.first || '';
    document.getElementById('lastName').value = result.last || '';
    document.getElementById('email').value = result.email || '';
    document.getElementById('phone').value = result.phone || '';
    document.getElementById('dobMonth').value = result.dob_month || '';
    document.getElementById('acblnumber').value = result.acblNumber || '';
    document.getElementById('ice_phone').value = result.ice_phone || '';
    document.getElementById('ice_relation').value = result.ice_relation || '';
    document.getElementById('m1').checked = result.m1 || false;
    document.getElementById('t1').checked = result.t1 || false;
    document.getElementById('f1').checked = result.f1 || false;
    document.getElementById('ug').checked = result.ug || false;
    document.getElementById('isDirector').checked = result.director || false;
    document.getElementById('officerPosition').value = result.position || '';

    // populate image preview if available (supports either image_data or image_path)
    const preview = document.getElementById('playerImagePreview');
    const hidden = document.getElementById('playerImageData');
    const src = result.image_data || result.image_path || '';
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
    showCustomAlert(result.message,5);
    // Refresh the table after deletion
    await createPlayerTable();
  } catch (err) {
    showCustomAlert(`Error deleting player: ${err.message}`,5);
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

      Object.entries(row).forEach(entry => {
        const key = entry[0]
        const val = entry[1]

        // console.log(key, val)
        const td = document.createElement('td');

        if (playerid_index == col_index && key == 'id') {
          if (!show_playerid) {
            td.classList.add('col-hidden');
          } else {
            td.classList.remove('col-hidden');
          }
        }

        if (dob_month_index == col_index && key == "dob_month") {
          if (!show_dob_month) {
            td.classList.add('col-hidden');
          } else {
            td.classList.remove('col-hidden');
          }
        }

        if (email_index == col_index && key == "email") {
          if (!show_email) {
            td.classList.add('col-hidden');
          } else {
            td.classList.remove('col-hidden');
          }
        }

        if (ice_phone_index == col_index && key == "ice_phone") {
          if (!show_ice_phone) {
            td.classList.add('col-hidden');
          } else {
            td.classList.remove('col-hidden');
          }
        }

        if (ice_relation_index == col_index && key == "ice_relation") {
          if (!show_ice_relation) {
            td.classList.add('col-hidden');
          } else {
            td.classList.remove('col-hidden');
          }
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
        if (((userid === row.id) && securelogin) || (isAdmin && securelogin)) {
          PopulateFormForEdit(row.id);
        } else {
          showCustomAlert('You must be securelylogged in as Admin or as yourself to edit a player record.',10);
        }
      });
      tdEdit.appendChild(iEdit);
      tr.appendChild(tdEdit);

      //add a button for deleting
      const tdDel = document.createElement('td');
      const iDelete = document.createElement('i');
      iDelete.className = 'fas fa-trash';
      iDelete.addEventListener('click', async () => {
        if (isAdmin && securelogin) {
          if (window.prompt(`Type DELETE to confirm deletion of player :${row.first} ${row.last}`, '') === 'DELETE') {
            await DeletePlayer(row.id);
          }
        }else {
          showCustomAlert('You must be securely logged in as Admin to delete a player record.',10);
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
document.addEventListener('DOMContentLoaded', ClearForm);

// Add this after your existing DOMContentLoaded listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on a password reset flow
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // User clicked email link - show reset password modal
        displayResetPasswordModal(token);
        console.log('Displaying reset password modal with token:', token);
    }else{
        console.log('No reset token found in URL.');
    }
});
function displayResetPasswordModal(token) {
    // Hide any other modals that might be open
    closeLoginModal();
    closeForgotPasswordModal();
    closeNameAndPhoneCheck();
    
    // Show reset password modal
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    if (resetPasswordModal) {
        resetPasswordModal.style.display = 'block';
        // Store token in a data attribute for later use
        resetPasswordModal.dataset.token = token;
    }
}

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

async function DoNameAndPhoneCheck() {
  const myname = document.getElementById('myname')
  const name = myname.value
  const fullname = name.replace(/\s+/g, ' ').trim().toLowerCase()
  const phone = document.getElementById('myphone').value.replaceAll('-', '')
  const nameandphonecheckresult = document.getElementById('nameandphonecheckresult')
  let ok
  //hide nameandphonechecksection, show termcheck
  // document.getElementById('nameandphonechecksection').style.display = 'none'
  try {

    const res = await fetch('/checkfullnameandphone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullname, phone })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json()
    if (result.valid) {
      casuallogin = true
      showCustomAlert(result.message,3)
      // nameandphonecheckresult.innerText = "Correct! You seem to be a member of the club."
      ok = true
    } else {
      showCustomAlert(result.message,3)
      // nameandphonecheckresult.innerText = `Sorry ${fullname}! you are not from our club`
      casuallogin = false
      ok = false
    }
    decide()
  } catch (err) {
    console.error('Error checking full name and phone:', err);
    showCustomAlert(`Error checking full name and phone: ${err.message}`,5)
    casuallogin = false
    ok = false
  }
  delay(5000)
  if (ok) {
    const nameandphonecheckmodal = document.getElementById('nameandphonecheck')
    nameandphonecheckmodal.style.display = 'none'
    decide()
  // } else {
  //   window.location = '/'
  }
}

async function forgotPassword() {
    const email = document.getElementById('forgotPasswordEmail').value;
    
    if (!email) {
        showCustomAlert('Please enter your email address');
        return;
    }
    
    try {
        const res = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        showCustomAlert(data.message, 5);
        
        if (data.success) {
            closeForgotPasswordModal();
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        showCustomAlert('Error requesting password reset');
    }
}

function displayForgotPasswordForm() {
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    forgotPasswordModal.style.display = 'block';
}

function closeForgotPasswordModal() {
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    forgotPasswordModal.style.display = 'none';
}

async function resetPassword() {
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const token = resetPasswordModal.dataset.token;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
        showCustomAlert('Password must be at least 6 characters');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showCustomAlert('Passwords do not match');
        return;
    }
    
    try {
        const res = await fetch('/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await res.json();
        showCustomAlert(data.message, 5);
        
        if (data.success) {
            closeResetPasswordModal();
            setTimeout(() => {
                displayloginform();
            }, 2000);
        }
    } catch (err) {
        console.error('Reset password error:', err);
        showCustomAlert('Error resetting password');
    }
}

// Expose for use in console or other scripts
window.toggleColumn = toggleColumn;

// added for modal forms
// Get the modal
var loginModal = document.getElementById("loginmodal");
// var changePasswordModal = document.getElementById("changepasswordmodal");
// var nonmemberscheckmodal = document.getElementById("nonmemberscheckmodal");

// Get the button that opens the modal
// var btn = document.getElementById("open-modal-btn");

// When the user clicks the button, open the modal
// btn.onclick = function() {
//   modal.style.display = "block";
// }




// When the user clicks anywhere outside of the modal, close it
// window.onclick = function (event) {
//   if (event.target == loginModal) {
//   }
// }

// changePasswordModal.style.display = "flex";

//set this to block to see the login modal
// loginModal.style.display = "none";


// createNonPlayerForm();
// nonmemberscheckmodal.style.display = "flex";

// shouldAdmitToSite()

// checkIfUserShouldBeAllowedTemporayLogin()
async function getSessionDetails() {
  try {

    const res = await fetch('/get-session-id', {
      method: 'GET'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json()
    return [result.sessionId, result.securelogin, result.insecurelogin, result.username, result.userid, result.isAdmin, result.casuallogin];  

  } catch (err) {

    console.error('API error:', err);
  }
}
async function PopulateDirectosTable() {
  try {
    const res = await fetch('api/directorsdata', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); 
    const result = await res.json();
    console.log(result);
    const tbody = document.getElementById('directorsTableBody');
    if (!tbody) return console.warn('Table body #directorsTableBody not found');
    tbody.innerHTML = ''; 
    result.forEach(row => {
      const tr = document.createElement('tr');
      // append cells in the order the server returned them
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

async function PopulateOfficersTable() {
  try {
    const res = await fetch('api/officersdata', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); 
    const result = await res.json();
    console.log(result);
    const tbody = document.getElementById('officersTableBody');
    if (!tbody) return console.warn('Table body #officersTableBody not found');
    tbody.innerHTML = ''; 
    result.forEach(row => {
      const tr = document.createElement('tr');
      for (const val of Object.values(row)) {
        const td = document.createElement('td');
        td.textContent = val == null ? '' : val;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('API error:', err);
  }
}

document.addEventListener('DOMContentLoaded', PopulateDirectosTable);
document.addEventListener('DOMContentLoaded', PopulateOfficersTable);

async function decide() {
  [sessionId,securelogin,insecurelogin,username,userid,isAdmin,casuallogin] = await getSessionDetails()
  // Base the decision on global variables set during login or checks
  console.log(sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin)
  // Check if the session exists
  // const [sessionid,securelogin]= await isUserLoggedIn()

  // remove blurred effect from all content classes
  const contentElements = document.getElementsByClassName('content');
  const show = sessionId && (casuallogin || insecurelogin ||securelogin);
  for (let i = 0; i < contentElements.length; i++) {
    if (!show) {
      contentElements[i].classList.add('blurred');
    } else {
      contentElements[i].classList.remove('blurred');
    }
  }

  if (sessionId && casuallogin) {
    showCustomAlert(`Note that you are logged in as ${username} but you are a casual visitor. You can only view the data.`,10)
  }else if (sessionId && insecurelogin) {
    showCustomAlert(`Note that you are logged in as ${username} but you are using a password that is not secure. You can only view the data.`,10)
  } else if (sessionId && securelogin) {
    showCustomAlert(`Note that you are securely logged in as ${username} and you can view data as well as edit your own data.`,10)
  } else if (sessionId && securelogin && isAdmin) {
    showCustomAlert(`Note that you are logged in as ${username}, an Admin, and can view and edit all data.`,10)
  } else {
    console.log("User is not logged in.");
  }
}

decide()

