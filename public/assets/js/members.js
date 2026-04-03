






function displaynameandphonecheckform() {
  const nameandphonecheckmodal = document.getElementById('nameandphonecheck')
  nameandphonecheckmodal.style.display = 'block'
}

function displayloginform() {
  const loginmodal = document.getElementById('loginmodal')
  loginmodal.style.display = 'block'
  const usernameInput = document.getElementById('username');
  usernameInput.value = ''
  const passwordInput = document.getElementById('password');
  passwordInput.value = ''
}

function displaychangepasswordform() {
  const changepasswordmodal = document.getElementById('changepasswordmodal')
  const changepasswordusername = document.getElementById('changepasswordusername')
  changepasswordusername.value = ''
  const currentpassword = document.getElementById('currentpassword')
  currentpassword.value = ''
  changepasswordmodal.style.display = 'block'
}

function closeNameAndPhoneCheck() {
  const nameandphonecheckmodal = document.getElementById('nameandphonecheck')
  nameandphonecheckmodal.style.display = 'none'
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
    await delay(2000)
    decide();
  } catch (err) {
    console.error('Logout error:', err);
    showCustomAlert('Error during logout.' + err.message, 5);
  }
}

function closeLoginModal() {
  const loginModal = document.getElementById("loginmodal");
  loginModal.style.display = "none";
}

function closeChangePasswordModal() {
  const changePasswordModal = document.getElementById("changepasswordmodal");
  changePasswordModal.style.display = "none";
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
      showCustomAlert(`Login failed: ${result.message}`, 5);
      return;
    } else {
      console.log('Login successful for user:', user_name,
        'User ID:', result.userId, 'Is Admin:', result.isAdmin, 'Full Name:', result.fullname,
        'Secure Login:', result.securelogin, 'Insecure Login:', result.insecurelogin, 'Casual Login:', result.casuallogin);
      console.log(result);
      username = user_name;
      userid = result.userId;
      isAdmin = result.isAdmin;
      securelogin = result.securelogin
      insecurelogin = result.insecurelogin
      casuallogin = result.casuallogin
      fullname = result.fullname

      decide();
    }
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert(`Login failed: ${err.message}`, 5);
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
    showCustomAlert('New passwords do not match', 5);
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
    showCustomAlert('Password changed successfully', 5);
  } catch (err) {
    console.error('API error:', err);
    showCustomAlert(`Password change failed: ${err.message}`, 5);
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
  document.getElementById('dobDate').value = '';
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

async function populateCelebrations() {
  const celebrations = document.getElementById('celebrations');
  try {
    const res = await fetch('/api/celebrations', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log(result);
    celebrations.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a celebration';
    celebrations.appendChild(defaultOption);

    result.celebrations.forEach(celebration => {
      const opt = document.createElement('option');
      opt.value = celebration.id;
      opt.dataset.description = celebration.celebrationdescription;
      opt.textContent = `${celebration.celebrationname} - (${celebration.celebrationdate})`;
      celebrations.appendChild(opt);
    });
  } catch (err) {
    console.error('API error:', err);
  }
}

async function addCelebration() {
  const cn = document.getElementById('celebrationname');
  if (!cn?.value?.trim()) {
    alert('Please enter a celebration name');
    return;
  }
  const cdate = document.getElementById('celebrationdate');
  if (!cdate?.value) {
    alert('Please enter a celebration date');
    return;
  }
  const cd = document.getElementById('celebrationdescription');
  if (!cd) {
    alert('Celebration description element not found');
    return;
  }
  const fileInput = document.getElementById('celebrationImageInput');
  const form = new FormData();
  form.append('createdByPlayerId', userid);
  form.append('celebrationDate', cdate.value);
  form.append('celebrationName', cn.value.trim());
  form.append('celebrationDescription', cd.value.trim());
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    for (const file of fileInput.files) {
      form.append('celebrationimages', file);
    }
  }
  const res = await fetch(`/api/celebration2`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const result = await res.json();
    showCustomAlert(`Failed to add celebration: ${result.message}`, 5);
  } else {
    //res returns the celebration id
    const result = await res.json();
    if (result.success) {
      const celebrationid = result.celebrationid;
      // const imageForm = document.getElementById('celebrationImageForm');
      // imageForm.dataset.celebrationid = celebrationid;
      showCustomAlert('Celebration added successfully. You can add more pictures by selecting this celebration from the drop-down and uploading images.', 5);
      populateCelebrations()
      //close the celebration creation modal
      closeCelbrationModal();
    } else {
      showCustomAlert(`Failed to add celebration: ${result.message}`, 5);
    }
  }
}

function closeCelbrationModal() {
  const modal = document.getElementById('addcelebrationmodal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function deleteCelebrationImage(celebrationImageId) {
  if (!celebrationImageId) return alert('Missing celebration image id');
  // if (!confirm('Are you sure you want to delete this image?')) return;
  // if (!showCustomConfirm('Are you sure you want to delete this image?')) return;
  const response = await fetch(`/api/celebration/image/${celebrationImageId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    showCustomAlert('Image deleted successfully', 3);
    displayCelebrationPhotos();
  } else {
    const result = await response.json().catch(() => ({}));
    showCustomAlert(result.message || 'Failed to delete image', 3);
  }
}

async function uploadMoreCelebrationImages() {
  const form = document.getElementById('moreCelebrationImageForm');
  const fileInput = document.getElementById('moreCelebrationImageInput');
  const celebrationsEl = document.getElementById('celebrations');
  if (!celebrationsEl) return alert('Celebrations element not found');
  const celebrationid = celebrationsEl.selectedOptions[0]?.value;

  if (!celebrationid) return showCustomAlert('Please select a celebration from the drop-down first', 3);
  if (!fileInput?.files?.[0]) return showCustomAlert('Select an image first', 3);

  const formData = new FormData();
  formData.set('celebrationid', celebrationid);
  for (const file of fileInput.files) {
    formData.append('celebrationImages', file);
  }
  // formData.set('playerImage', fileInput.files); // now we are uploading multiple files

  const response = await fetch('/api/celebration/images', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Upload result:', result);
    showCustomAlert('Image(s) uploaded successfully', 3);
    displayCelebrationPhotos();
  } else {
    const result = await response.json().catch(() => ({}));
    showCustomAlert(result.message || 'Failed to upload image(s)', 3);
  }
}

function showCreateCelebrationModal() {
  const modal = document.getElementById('addcelebrationmodal');
  if (modal) {
    modal.style.display = 'block';
  }
}


async function displayCelebrationPhotos() {

  const celebrationRelated = document.getElementById('celebrationrelated');

  const select = document.getElementById('celebrations');
  celebrationid = select?.value;
  const description = select?.selectedOptions[0]?.dataset?.description;
  document.getElementById('celdescdisplay').value = description;
  if (document.getElementById('celebrations').selectedIndex === 0) {
    if (celebrationRelated) {
      celebrationRelated.style.display = 'none';
      return
    }
  }

  try {
    const celebrationDescriptionEl = document.getElementById('celdescdisplay');
    if (celebrationDescriptionEl) {
      celebrationDescriptionEl.style.display = 'block';
    }
    const response = await fetch(`/api/celebration/${celebrationid}/images`, {
      method: 'GET'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const container = document.getElementById('celebrationPhotos');
    container.innerHTML = '';
    for (const img of result) {
      const div = document.createElement('div');
      div.style = `display: inline-block; margin: 5px; width: 100%; border: 1px solid #ddd;`;

      const iDel = document.createElement('i');
      iDel.className = 'fas fa-trash-alt';
      iDel.style = 'position: relative; top: 5px; right: 5px; cursor: pointer;';
      iDel.title = 'Delete image';
      iDel.addEventListener('click', () => {
        if (showCustomYesNo('Are you sure you want to delete this image?')) {
          deleteCelebrationImage(img.id);
        }
      });
      div.appendChild(iDel);
      const imgEl = document.createElement('img');
      imgEl.src = img.url;
      imgEl.alt = img.description || 'Celebration photo';
      imgEl.style.width = '100%';
      imgEl.style.height = 'auto';
      imgEl.style.margin = '5px';
      div.appendChild(imgEl);
      container.appendChild(div);
    }

    if (celebrationRelated) {
      celebrationRelated.style.display = 'block';
    }
    console.log('Celebration photos:', result);
  } catch (err) {
    console.error('Error fetching celebration photos:', err);
  }
}

async function deleteCelebration() {
  const option = document.getElementById("celebrations")?.selectedOptions[0];
  if (!option) return showCustomAlert('No celebration selected');
  const celebrationid = option.value;
  const result = await showCustomConfirmWithInput('Are you sure you want to delete this celebration? Type DELETE to confirm.');
  if (!result) return;

  const response = await fetch(`/api/celebration/${celebrationid}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    showCustomAlert('Celebration deleted successfully', 3);
    // Refresh the celebrations list
    populateCelebrations();
  } else {
    const result = await response.json().catch(() => ({}));
    showCustomAlert(result.message || 'Failed to delete celebration', 3);
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
  form.append('dob_date', document.getElementById('dobDate').value);
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
  const playerImageData = document.getElementById('playerImageData').value;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    form.append('playerImage', fileInput.files[0]);
  } else if (playerImageData) {
    const blob = await (await fetch(playerImageData)).blob();
    form.append('playerImage', blob, 'avatar.png'); // give it a filename
  }
  console.log('Submitting changes (multipart)...');
  const res = await fetch(`/api/playerdata/${playerId}`, {
    method: 'PUT',
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed: ${res.status} ${err}`);
  } else {
    showCustomAlert('Player updated successfully', 5);
    document.getElementById("addoreditplayer").style.display = "none";
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

function CancelChanges() {
  document.getElementById("addoreditplayer").style.display = "none";
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
    const src = result.image_data || result.image_path || '';
    document.getElementById('playerImageDisplay').src = src === '' ? 'https://generative-placeholders.stefanbohacek.com/image?width=40&height=40&img=1' : `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${src}`;
    document.getElementById('playerId').value = result.id || '';
    document.getElementById('firstName').value = result.first || '';
    document.getElementById('lastName').value = result.last || '';
    document.getElementById('email').value = result.email || '';
    document.getElementById('phone').value = result.phone || '';
    document.getElementById('dobMonth').value = result.dob_month || '';
    document.getElementById('dobDate').value = result.dob_date || '';
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
    // const hidden = document.getElementById('playerImageData');
    if (src) {
      if (preview) { preview.src = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${src}`;; preview.style.display = 'inline-block'; }
      // if (hidden) hidden.value = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${src}`;
    } else {
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      // if (hidden) hidden.value = '';
    }

    // Focus on the first name field for convenience
    const el = document.getElementById('addoreditplayer');
    el.style.display = 'grid';
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
    showCustomAlert(result.message, 5);
    // Refresh the table after deletion
    await createPlayerTable();
  } catch (err) {
    showCustomAlert(`Error deleting player: ${err.message}`, 5);
  }
}

async function createPlayerTable() {
  try {
    const playerid_index = 0; // zero-based index of ID column
    const image_index = 1; // zero-based index of image column
    const dob = 6; // zero-based index of DOB column
    const email_index = 4; // zero-based index of email column
    const ice = 7; // zero-based index of ice column

    const show_playerid = false
    const show_dob = document.getElementById('DOB').checked;
    const show_email = document.getElementById('Email').checked;
    const show_ice = document.getElementById('ICE').checked;

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

        if (dob == col_index && key == "dob") {
          if (!show_dob) {
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

        if (ice == col_index && key == "ice") {
          if (!show_ice) {
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
          img.style.borderRadius = '20px';
          td.appendChild(img);
        } else {
          td.textContent = val ?? '';
        }
        tr.appendChild(td);
        col_index++;
      });

      //add a button for editing
      const tdEdit = document.createElement('td');
      tdEdit.style = 'text-align: center;';
      const iEdit = document.createElement('i');
      iEdit.className = 'fas fa-edit';
      iEdit.title = 'Edit Player';

      iEdit.addEventListener('click', () => {
        if (((userid === row.id) && securelogin) || (isAdmin && securelogin)) {
          PopulateFormForEdit(row.id);
        } else {
          showCustomAlert('You must be securelylogged in as Admin or as yourself to edit a player record.', 10);
        }
      });
      tdEdit.appendChild(iEdit);
      tr.appendChild(tdEdit);

      //add a button for deleting
      const tdDel = document.createElement('td');
      tdDel.style = 'text-align: center;';
      const iDelete = document.createElement('i');
      iDelete.className = 'fas fa-trash';
      iDelete.title = 'Delete Player';
      iDelete.addEventListener('click', async () => {
        if (isAdmin && securelogin) {
          const result = await showCustomConfirmWithInput('Are you sure you want to delete this player? Type DELETE to confirm.');
          if (result) {
            await DeletePlayer(row.id);
          }
        } else {
          showCustomAlert('You must be securely logged in as Admin to delete a player record.', 10);
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

function displayaddannouncementform() {
  const auaform = document.getElementById('addupdateannouncements')
  auaform.style.display = 'grid'
  //clear the form
  document.getElementById('announcementId').value = ''
  document.getElementById('announcementtitle').value = ''
  document.getElementById('announcementtext').value = ''
  document.getElementById('displaytill').value = ''
  document.getElementById('priority').value = ''
  document.getElementById('btnNewContainer').style.display = 'block'
  document.getElementById('btnUpdateContainer').style.display = 'none'

  if (auaform) {
    auaform.scrollIntoView({ behavior: 'smooth', block: 'center' });
    auaform.setAttribute('tabindex', '-1');
    auaform.focus();
  } else {
    console.warn('Login button not found to scroll into view and focus.');
  }
}


document.addEventListener('DOMContentLoaded', createPlayerTable);
document.addEventListener('DOMContentLoaded', ClearForm);
document.addEventListener('DOMContentLoaded', PopulateBlogList);

let blogEditorInitPromise = null;

async function PopulateBlogList() {
  try {
    const bloglist = document.getElementById('bloglistid');
    if (!bloglist) {
      console.warn('Blog list element with id "bloglistid" not found');
      return;
    }
    const res = await fetch('/api/blogs', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    bloglist.innerHTML = '';
    if (result.success) {
      const blogs = result.blogs;
      if (blogs.length === 0) {
        bloglist.innerHTML = '<option>No blogs found.</option>';
        return;
      }
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a blog';
      bloglist.appendChild(defaultOption);
      blogs.forEach(blog => {
        const option = document.createElement('option');
        option.value = blog.id;
        option.textContent = `${blog.title.slice(0, 50)} by ${blog.author}`;
        option.dataset.blog = blog.blog
        bloglist.appendChild(option);
      });
    }

  } catch (err) {
    console.error('Error populating blog list:', err);
    showCustomAlert(`Error populating blog list. ${err}`, 5);
  }
}

function ensureBlogEditor() {
  if (typeof tinymce === 'undefined') {
    console.warn('TinyMCE not loaded yet');
    return Promise.resolve(null);
  }

  const existingEditor = tinymce.get('blogcontent');
  if (existingEditor) return Promise.resolve(existingEditor);

  if (!blogEditorInitPromise) {
    blogEditorInitPromise = tinymce
      .init({
        selector: '#blogcontent',
        license_key: 'gpl'
      })
      .then(editors => editors && editors[0])
      .catch(err => {
        blogEditorInitPromise = null;
        throw err;
      });
  }

  return blogEditorInitPromise;
}

async function showblog() {
  const bloglist = document.getElementById('bloglistid');
  const selectedOption = bloglist?.selectedOptions[0];
  const blogHtml = selectedOption?.dataset.blog || '';
  const blogid = selectedOption?.value || '';

  try {
    const editor = await ensureBlogEditor();
    if (editor) {
      editor.mode.set('readonly')
      editor.setContent(blogHtml);
      displayBlogComments(blogid)
      return;
    }
  } catch (err) {
    console.error('Error initializing TinyMCE:', err);
  }
  //if tinymce is not initialized, fall back on just
  //showing html content itself in the textarea (not rendered)
  const blogcontent = document.getElementById('blogcontent');
  if (blogcontent) {
    blogcontent.value = blogHtml;
  }

  displayBlogComments(blogid)
}

// Add this after your existing DOMContentLoaded listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on a password reset flow
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    // User clicked email link - show reset password modal
    displayResetPasswordModal(token);
    console.log('Displaying reset password modal with token:', token);
  } else {
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
      showCustomAlert(result.message, 3)
      // nameandphonecheckresult.innerText = "Correct! You seem to be a member of the club."
      ok = true
    } else {
      showCustomAlert(result.message, 3)
      // nameandphonecheckresult.innerText = `Sorry ${fullname}! you are not from our club`
      casuallogin = false
      ok = false
    }
    decide()
  } catch (err) {
    console.error('Error checking full name and phone:', err);
    showCustomAlert(`Error checking full name and phone: ${err.message}`, 5)
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

function getAvatar() {
  return new Promise((resolve) => {
    updateCardAvatarsInModal();
    updatePeopleAvatarsInModal();
    const modal = document.getElementById('selectAvatarModal');
    modal.style.display = 'block';
    const submitBtn = modal.querySelector('#submitAvatarSelection');
    const cancelBtn = modal.querySelector('#closeAvatarSelection');

    const cleanup = (result) => {
      submitBtn.removeEventListener('click', submitAvatarSelection);
      cancelBtn.removeEventListener('click', closeSelectAvatarModal);
      modal.style.display = 'none';
      resolve(result);
    };

    const submitAvatarSelection = () => {
      cleanup({ url: modal.dataset.url } || null);
    }
    const closeSelectAvatarModal = () => {
      cleanup(null);
    }

    submitBtn.addEventListener('click', submitAvatarSelection);
    cancelBtn.addEventListener('click', closeSelectAvatarModal);
  });
}

//testing. Remove this in actual code

async function useAvatarSelection() {
  const result = await getAvatar();
  if (result) {
    console.log('Avatar selected:', result);
    const playerImageData = document.getElementById('playerImageData');
    const playerImagePreview = document.getElementById('playerImagePreview');
    if (playerImageData) {
      playerImageData.value = result.url;
    }
    if (playerImagePreview) {
      playerImagePreview.src = result.url;
      playerImagePreview.style.display = 'inline-block';
    }
  }
  console.log('Selected avatar:', result);
}

function useAvatarSelection2() {
  //here we get the input element to figure or the card
  const avatarTextInput = document.getElementById('avatartext');
  const text = avatarTextInput.value;
  const parts = text.toLowerCase().split('');
  if (parts.length < 2) return

  const suit = 'cdhs'.includes(parts[0]) ? parts[0] : 'cdhs'.includes(parts[1]) ? parts[1] : null;
  if (!suit) return;

  const rank = ('ajqjt98765432'.includes(parts[0])) ? parts[0] : ('ajqjt98765432'.includes(parts[1]) ? parts[1] : null);
  if (!rank) return;

  const spritesheet = document.createElement('img');
  spritesheet.src = '/images/gallery/card/deck.png';
  spritesheet.onload = () => {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const startX = 0; // Starting X coordinate of the first avatar in the sprite sheet
    const startY = 0; // Starting Y coordinate of the first avatar in the sprite sheet
    const avatarWidth = 206; // Width of each avatar in the sprite sheet
    const avatarHeight = 281; // Height of each avatar in the sprite sheet
    const gapX = 1; // Horizontal gap between avatars in the sprite sheet
    const gapY = 3; // Vertical gap between avatars in the sprite sheet
    const suitIndex = 'cdhs'.indexOf(suit);
    const rankIndex = 'a23456789tjqk'.indexOf(rank);
    const x = startX + rankIndex * (avatarWidth + gapX);
    const y = startY + suitIndex * (avatarHeight + gapY);
    canvas.width = avatarWidth / 4;
    canvas.height = avatarHeight / 4;
    ctx.drawImage(spritesheet, x, y, avatarWidth, avatarHeight, 0, 0, avatarWidth / 4, avatarHeight / 4);
    const playerImageData = document.getElementById('playerImageData');
    const playerImagePreview = document.getElementById('playerImagePreview');
    const dataUrl = canvas.toDataURL('image/png');
    if (playerImageData) {
      playerImageData.value = dataUrl;
    }
    if (playerImagePreview) {
      playerImagePreview.src = dataUrl;
      playerImagePreview.style.display = 'inline-block';
    }
  }
}

function updatePeopleAvatarsInModal() {
  //here we get the input element to figure or the card
  // const avatarTextInput = document.getElementById('avatartext');
  // const text = avatarTextInput.value;
  // const parts = text.toLowerCase().split('');
  // if (parts.length < 2) return

  // const suit = 'cdhs'.includes(parts[0]) ? parts[0] : 'cdhs'.includes(parts[1]) ? parts[1] : null;
  // if (!suit) return;

  // const rank = ('ajqjt98765432'.includes(parts[0])) ? parts[0] : ('ajqjt98765432'.includes(parts[1]) ? parts[1] : null);
  // if (!rank) return;
  const modal = document.getElementById('selectAvatarModal');
  const spritesheet = document.createElement('img');
  spritesheet.src = '/images/gallery/people/people.png';
  spritesheet.onload = () => {
    const avatarSelection = document.getElementById('avatarSelection');
    const startX = 25; // Starting X coordinate of the first avatar in the sprite sheet
    const startY = 25; // Starting Y coordinate of the first avatar in the sprite sheet
    const avatarWidth = 100; // Width of each avatar in the sprite sheet
    const avatarHeight = 250; // Height of each avatar in the sprite sheet
    const gapX = 0; // Horizontal gap between avatars in the sprite sheet
    const gapY = 0; // Vertical gap between avatars in the sprite sheet
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 15; col++) {
        console.log(`row=${row}, col=${col}`);
        const canvas = document.createElement('canvas');
        canvas.className = 'avatar-option';
        const ctx = canvas.getContext('2d');
        const x = startX + col * (avatarWidth + gapX);
        const y = startY + row * (avatarHeight + gapY);
        canvas.width = avatarWidth / 2;
        canvas.height = avatarHeight / 4;
        ctx.drawImage(spritesheet, x, y, avatarWidth, avatarHeight / 2, 0, 0, avatarWidth / 2, avatarHeight / 4);
        canvas.onclick = function () {          // Remove highlight from all avatars
          document.querySelectorAll('.avatar-option').forEach(canvas => {
            canvas.style.borderRadius = '';
          });
          // Highlight the selected avatar
          this.style.borderRadius = '20px';
          // Store the selected avatar value and URL in the modal's dataset for later use
          // modal.dataset.card = `${rank}${suit}`;
          modal.dataset.url = canvas.toDataURL('image/png'); // Store the data URL of the selected avatar
        };
        avatarSelection.appendChild(canvas);
      }
    }
  }
}

function showAvatarSelectionModal() {
  const modal = document.getElementById('selectAvatarModal');
  modal.style.display = 'block';
  getAvatar().then(result => {
    if (result) {
      console.log('Avatar selected:', result);
      const playerImageData = document.getElementById('playerImageData');
      const playerImagePreview = document.getElementById('playerImagePreview');
      if (playerImageData) {
        playerImageData.value = result.url;
      }
      if (playerImagePreview) {
        playerImagePreview.src = result.url;
        playerImagePreview.style.display = 'inline-block';
      }
    }
    console.log('Selected avatar:', result);
  });
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

async function PopulateDirectorsTable() {
  try {
    const res = await fetch('api/directorsdata', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    // console.log(result);
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
    console.log(result.mailingLists);
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




function CancelAnnouncement() {
  document.getElementById('addupdateannouncements').style.display = 'none';
}

async function PopulateAnnouncements(params) {
  try {
    const res = await fetch('/api/announcements', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    const container = document.getElementById('announcementTableBody');
    if (!container) return console.warn('Container #announcementTableBody not found');
    container.innerHTML = '';
    result.announcements.forEach(announcement => {
      const row = document.createElement('tr');

      const pictureCell = document.createElement('td');
      pictureCell.style.display = 'flex';
      pictureCell.style.justifyContent = 'center';
      pictureCell.style.alignItems = 'center';
      pictureCell.style.width = '100px';
      pictureCell.style.height = '100px';
      // pictureCell.style.borderRadius = '50%';
      const img = document.createElement('img');
      img.src = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${announcement.image_path}`;
      img.alt = announcement.name;
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.borderRadius = '50%';
      img.title = announcement.fromname;
      pictureCell.appendChild(img);
      row.appendChild(pictureCell);

      const contentCell = document.createElement('td');

      const contentDiv = document.createElement('div');
      contentDiv.style.maxHeight = '200px';
      contentDiv.style.overflowY = 'auto';

      // const contentDivFrom = document.createElement('div');
      // contentDivFrom.textContent = `From: ${announcement.fromname}`;
      // contentDivFrom.style.fontStyle = 'italic';
      // contentDiv.appendChild(contentDivFrom);

      const contentDivTitle = document.createElement('div');
      contentDivTitle.textContent = `${announcement.title} - ${announcement.fromname}`;
      contentDivTitle.style.fontWeight = 'bold';
      contentDiv.appendChild(contentDivTitle);

      const contentDivContent = document.createElement('div');
      contentDivContent.textContent = announcement.announcement;
      contentDiv.appendChild(contentDivContent);
      contentCell.appendChild(contentDiv);
      row.appendChild(contentCell);

      const editCell = document.createElement('td');
      const iEdit = document.createElement('i');
      iEdit.className = 'fas fa-edit';
      iEdit.style.cursor = 'pointer';
      iEdit.style.margin = '0 5px';

      iEdit.addEventListener('click', () => {
        const adminOrCreator = (isAdmin && securelogin) || ((userid === announcement.playerid) && securelogin);
        if(!adminOrCreator) {
          showCustomAlert('You must be securely logged in as Admin or as the creator of the announcement to update this announcement.', 10);
          return;
        }
        // User is authorized to edit this announcement
        // Copy the data to the addAnnouncement form and enable the update button
        const auaform = document.getElementById('addupdateannouncements')
        if (!auaform) {
          console.warn('addunpdateannouncements form not found');
          return;
        }
        auaform.style.display = 'grid';
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementtitle').value = announcement.title || '';
        document.getElementById('announcementtext').value = announcement.announcement || '';
        document.getElementById('displaytill').value = announcement.displaytill;
        document.getElementById('priority').value = announcement.priority;
        document.getElementById('btnNewContainer').style.display = 'none';
        document.getElementById('btnUpdateContainer').style.display = 'block';
        auaform.scrollIntoView({ behavior: 'smooth', block: 'center' });
        auaform.setAttribute('tabindex', '-1');
        auaform.focus();
      });
      editCell.appendChild(iEdit);
      // row.appendChild(editCell);

      // const deleteCell = document.createElement('td');
      const iDelete = document.createElement('i');
      iDelete.className = 'fas fa-trash';
      iDelete.style.cursor = 'pointer';
      iDelete.addEventListener('click', async () => {
        if ((isAdmin && securelogin) || ((userid === announcement.playerid) && securelogin)) {
          // User is authorized to delete this announcement
        } else {
          showCustomAlert('You must be securely logged in as Admin or as the creator of the announcement to delete this announcement.', 10);
          return;
        }
        const result = await showCustomConfirmWithInput(`Type DELETE to confirm deletion of announcement Title:${announcement.title},
          Announcement:${announcement.announcement.substr(0, 15)}...`);
        if (result) {
          const res = await fetch(`/api/announcement/${announcement.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const result = await res.json();
          if (result.success) {
            showCustomAlert('Announcement deleted successfully.', 2);
            PopulateAnnouncements();
          } else {
            showCustomAlert(`Error deleting announcement. ${result.message}`, 5);
          }
        }
      });
      editCell.appendChild(iDelete);
      // deleteCell.appendChild(iDelete);
      row.appendChild(editCell);

      // Store following values for later use in edit/update operations
      row.dataset.announcementid = announcement.id;
      row.dataset.playerid = announcement.playerid;
      row.dataset.displaytill = announcement.displaytill;
      row.dataset.priority = announcement.priority;
      container.appendChild(row);
    });
  } catch (err) {
    console.error('Error populating announcements:', err);
    showCustomAlert(`Error populating announcements. ${err}`, 5);
  }
}

async function updateAnnouncement() {
  const announcementId = document.getElementById('announcementId').value;
  const title = document.getElementById('announcementtitle').value.trim();
  const text = document.getElementById('announcementtext').value.trim();
  const displaytill = document.getElementById('displaytill').value;
  const priority = document.getElementById('priority').value;
  if (!title && !text) {
    showCustomAlert('Please enter a title or text for the announcement.', 5);
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(displaytill)) {
    showCustomAlert('Invalid date format. Please use correct date format.', 5);
    return;
  }
  const announcementData = {
    title,
    announcement: text,
    displaytill,
    priority,
    playerid: userid
  };
  fetch(`/api/announcement/${announcementId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(announcementData)
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(result => {
    if (result.success) {
      showCustomAlert('Announcement updated successfully.', 2);
      CancelAnnouncement();
      PopulateAnnouncements();
      // scroll the announcements into view
      const announcementsTable = document.getElementById('announcementtable');
      if (announcementsTable) {
        announcementsTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      showCustomAlert(`Error updating announcement. ${result.message}`, 5);
    }
  })
  .catch(err => {
    console.error('Error updating announcement:', err);
    showCustomAlert(`Error updating announcement. ${err}`, 5);
  });
}

async function addAnnouncement() {
  const title = document.getElementById('announcementtitle').value.trim();
  const text = document.getElementById('announcementtext').value.trim();
  const displaytill = document.getElementById('displaytill').value;
  const priority = document.getElementById('priority').value;
  document.getElementById('announcementId').value = '';
  if (!title && !text) {
    showCustomAlert('Please enter a title or text for the announcement.', 5);
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(displaytill)) {
    showCustomAlert('Invalid date format. Please use correct date format.', 5);
    return;
  }
  const announcementData = {
    title,
    announcement: text,
    displaytill,
    priority,
    playerid: userid
  };

  // Send the announcement data using fetch or any other method
  fetch('/api/announcement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(announcementData)
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(result => {
    if (result.success) {
      showCustomAlert('Announcement added successfully.', 2);
      PopulateAnnouncements();
      //close the add/edit announcement form
      CancelAnnouncement()
      // scroll the announcements into view
      const announcementsTable = document.getElementById('announcementtable');
      if (announcementsTable) {
        announcementsTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      showCustomAlert(`Error adding announcement. ${result.message}`, 5);
    }
  })
  .catch(err => {
    console.error('Error adding announcement:', err);
    showCustomAlert(`Error adding announcement. ${err}`, 5);
  });

}

document.addEventListener('DOMContentLoaded', async () => {
  await PopulateDirectorsTable();
  await PopulateOfficersTable();
  await PopulateAnnouncements();
  await PopulatePOTMForm();
  await displayPOTM();
  await setupCelebrationsLazyLoad();
  await updateVoteInfo();

});

// Ks

async function clearAllPOTMCommentsInDatabase() {
  const potmmonth = new Date().getMonth() + 1; // Current month
  const potmyear = new Date().getFullYear(); // Current year
  const playerid = userid;

  try {
    const res = await fetch(`/api/clearpotmcomments/${potmmonth}/${potmyear}/${playerid}`, {
      method: 'POST',
    });
    console.log('All POTM comments cleared from the database.');
  } catch (err) {
    console.error('Error clearing POTM comments:', err);
  }

  resetPhraseBackgrounds()
}

function resetPhraseBackgrounds() {
  document.querySelectorAll('.phrase').forEach(phraseDiv => {
    phraseDiv.style.backgroundColor = ''; // Reset background color
  });
}


async function PopulatePOTMForm() {
  const potm_month = new Date().getMonth(); // Current month
  const potmmonth = new Date(new Date().getFullYear(), potm_month, 1).toLocaleString('default', { month: 'long' });
  const potmyear = new Date().getFullYear(); // Current year
  const potmlabel = document.getElementById('potmlabel');
  if (potmlabel) {
    potmlabel.textContent = `My vote for Player of the Month for ${potmmonth} ${potmyear} goes to:`;
  }
  try {
    const res = await fetch('/api/registeredusers', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Process the data and populate the POTM modal
    const selectPOTM = document.getElementById('potm');
    if (!selectPOTM) return console.warn('Select element #potm not found');
    let innerHTML = '<option value="">None</option>';
    data.users.forEach(user => {
      if (user.username !== username) { // Exclude current user from the list to prevent self-selection as POTM
        innerHTML += `<option value="${user.id}">${user.first} ${user.last}</option>`;
      }
    });
    selectPOTM.innerHTML = innerHTML;

    const commentPOTM = document.getElementById('commentonpotm');
    if (!commentPOTM) return console.warn('Div element #commentonpotm not found');
    commentPOTM.innerHTML = '';
    const resWords = await fetch('/api/getpotmwords', {
      method: 'GET'
    });
    if (!resWords.ok) throw new Error(`HTTP ${resWords.status}`);
    const dataWords = await resWords.json();
    // Process the data and populate the POTM modal
    const words = dataWords.words;
    words.forEach(word => {
      const phraseDiv = document.createElement('div');
      phraseDiv.className = 'phrase';
      phraseDiv.textContent = word;
      phraseDiv.onclick = async (event) => {
        phraseDiv.dataset.selected = phraseDiv.dataset.selected === 'true' ? 'false' : 'true';
        phraseDiv.style.backgroundColor = phraseDiv.dataset.selected === 'true' ? '#d3d3d3' : ''; // Highlight the selected phrase
        const phrase = event.target.textContent.trim();
        console.log(`Clicked phrase: ${phrase}`);
        // send this to a backend
        // const potmplayerid = document.getElementById('potm').value;
        // if (!potmplayerid) {
        //   showCustomAlert('Please first select a player for Player of the Month.', 5);
        //   return;
        // }
        // const potmmonth = new Date().getMonth() + 1; // Current month
        // const potmyear = new Date().getFullYear(); // Current year
        // await fetch('/api/savephrase', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({ playerid: userid, potmplayerid, potmmonth, potmyear, potmphrase: phrase }),
        // });
        // console.log(`Phrase \'${phrase}\' saved to database!`);
      };
      commentPOTM.appendChild(phraseDiv);
    });
  } catch (err) {
    console.error('Error fetching POTM data:', err);
    showCustomAlert(`Error fetching POTM data. ${err}`, 5);
  }
}

async function updatePOTM() {
  const potmSelect = document.getElementById('potm');
  if (!potmSelect) return;
  const potmplayerid = potmSelect.value;
  const potmmonth = new Date().getMonth() + 1; // Current month
  const potmyear = new Date().getFullYear(); // Current year
  const commentPOTM = document.getElementById('commentonpotm');
  if (!commentPOTM) return console.warn('Div element #commentonpotm not found');
  const selectedPhrases = Array.from(commentPOTM.querySelectorAll('.phrase')).filter(phraseDiv => phraseDiv.dataset.selected === 'true').map(div => div.textContent.trim());
  try {
    const res = await fetch('/api/updatepotm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ potmmonth, potmyear, playerid: userid, potmplayerid, selectedPhrases })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (result.success) {
      showCustomAlert('Player of the Month updated successfully.', 2);
      displayPOTM();
    } else {
      showCustomAlert(`Error updating Player of the Month. ${result.message}`, 5);
    }
  } catch (err) {
    console.error('Error updating POTM:', err);
    showCustomAlert(`Error updating Player of the Month. ${err}`, 5);
  }
  closeVotePOTMModal();
  updateVoteInfo();
}

async function updateVoteInfo() {
  await getSessionDetails() // Ensure we have the latest session details before proceeding
  const potmmonth = new Date().getMonth() + 1; // Current month
  const potmyear = new Date().getFullYear(); // Current year
  if (userid > 0) {
    const res = await fetch(`/api/getvoteinfo/${userid}/${potmmonth}/${potmyear}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const voteInfoDiv = document.getElementById('voteinfo');
    if (voteInfoDiv) {
      voteInfoDiv.textContent = data.message;
    }
  }
}

function closeSelectAvatarModal() {
  const modal = document.getElementById('selectAvatarModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// function openSelectAvatarModal() {
//   const modal = document.getElementById('selectAvatarModal');
//   if (modal) {
//     updateCardAvatarsInModal()
//     modal.style.display = 'block';
//     modal.dataset.card = "" //reset selected card
//     modal.dataset.selected = false //reset selected card value
//     modal.dataset.url = "" //reset selected card url
//   }
// }

function submitAvatarSelection() {
  const modal = document.getElementById('selectAvatarModal');
  modal.dataset.selected = true;
  closeSelectAvatarModal();
}

function updateCardAvatarsInModal() {
  const modal = document.getElementById('selectAvatarModal');
  const avatarEl = document.getElementById('avatarSelection');
  const spriteSheet = document.createElement('img');
  spriteSheet.src = `/images/gallery/card/deck.png`;
  const startX = 0; // Starting X coordinate of the first avatar in the sprite sheet
  const startY = 0; // Starting Y coordinate of the first avatar in the sprite sheet
  const avatarWidth = 206; // Width of each avatar in the sprite sheet
  const avatarHeight = 281; // Height of each avatar in the sprite sheet
  const gapX = 1; // Horizontal gap between avatars in the sprite sheet
  const gapY = 3; // Vertical gap between avatars in the sprite sheet
  spriteSheet.onload = function () {
    //create 52 avatar options from the sprite sheet
    //first rows are C,D,H,S
    //columns start with Ace and go up to King
    const suits = ['C', 'D', 'H', 'S'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let index = 0;
    suits.forEach((suit, suitIndex) => {
      ranks.forEach((rank, rankIndex) => {
        const canvas = document.createElement('canvas');
        canvas.width = avatarWidth / 4;
        canvas.height = avatarHeight / 4;
        const ctx = canvas.getContext('2d');
        const x = startX + rankIndex * (avatarWidth + gapX);
        const y = startY + suitIndex * (avatarHeight + gapY);
        ctx.drawImage(spriteSheet, x, y, avatarWidth, avatarHeight, 0, 0, avatarWidth / 4, avatarHeight / 4);
        const avatarDataUrl = canvas.toDataURL();
        const img = document.createElement('img');
        img.src = avatarDataUrl;
        img.alt = `${rank}${suit}`;
        img.className = 'avatar-option';
        img.onclick = function () {          // Remove highlight from all avatars
          document.querySelectorAll('.avatar-option').forEach(img => {
            img.style.borderRadius = '';
          });
          // Highlight the selected avatar
          this.style.borderRadius = '20px';
          // Store the selected avatar value and URL in the modal's dataset for later use
          modal.dataset.card = `${rank}${suit}`;
          modal.dataset.url = avatarDataUrl;
        };

        avatarEl.appendChild(img);
      });
    });
  }
}

async function displayPOTM() {
  const potmmonth = new Date().getMonth() + 1; // Current month
  const potmyear = new Date().getFullYear(); // Current year
  try {
    const res = await fetch(`/api/getpotm/${potmmonth}/${potmyear}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // The data displays an array of 0 to 3 players
    // each object in that array has first, last, and image_path properties
    const potmheading = document.getElementById('potmheading');
    if (potmheading) {
      potmheading.textContent = `Players of the Month for ${potmmonth}/${potmyear}`;
    }
    let index = 1;
    data.potm.forEach(player => {
      const potmName = document.getElementById(`potmName${index}`);
      if (potmName) {
        potmName.textContent = `${player.first} ${player.last}`;
      }
      const potmImage = document.getElementById(`potmImage${index}`);
      if (potmImage) {
        potmImage.src = `https://rbcstorage.sfo3.cdn.digitaloceanspaces.com/${player.image_path}`;
        potmImage.alt = `${player.first} ${player.last}`;
      }
      const potmComment = document.getElementById(`potmComment${index}`);
      if (potmComment) {
        potmComment.textContent = player.comments_concat;
      }
      index++
    });
  } catch (err) {
    console.error('Error fetching POTM data:', err);
    showCustomAlert(`Error fetching POTM data. ${err}`, 5);
  }
}



async function playing(day) {
  const checkbox = document.getElementById(`playing${day}`);
  const isChecked = checkbox.checked;
  // Here you can send the isChecked value to the server or handle it as needed
  try {
    const res = await fetch('/api/setplayingintentions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerId: userid, day, intention: isChecked ? 1 : 0 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    console.log('Set playing intentions result:', result);

    //the following can cause a loop condition.
    //await setPlayingIntentions() // Refresh the intentions from the server to ensure the UI is in sync with the server state
  } catch (error) {
    console.error('Error setting playing intentions:', error);
  }
}

function closeplayingModal() {
  const playingModal = document.getElementById('playingModal');
  if (playingModal) {
    playingModal.style.display = 'none';
  }
}

function closestComingMonday(date) {
  const base = new Date(date)
  const day = base.getDay();
  let diff = (8 - day) % 7; //values 0 to 6
  const hours = date.getHours();
  if (diff === 0 && hours > 12) {
    diff = 7;
  }
  base.setDate(base.getDate() + diff);
  return base;
}

function closestComingTuesday(date) {
  const base = new Date(date)
  const day = base.getDay();
  let diff = (9 - day) % 7; //values 0 to 6
  const hours = date.getHours();
  if (diff === 0 && hours > 12) {
    diff = 7;
  }
  base.setDate(base.getDate() + diff);
  return base;
}

function closestComingFriday(date) {
  const base = new Date(date)
  const day = base.getDay();
  let diff = (12 - day) % 7; //values 0 to 6
  const hours = date.getHours();
  if (diff === 0 && hours > 12) {
    diff = 7;
  }
  base.setDate(base.getDate() + diff);
  return base;
}

function closestComing4thSundayOfMonth(date) {
  //based on current schedule of the unit game
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  let firstSunday = new Date(firstDayOfMonth);
  firstSunday.setDate(firstDayOfMonth.getDate() + ((7 - firstDayOfMonth.getDay()) % 7));
  let fourthSunday = new Date(firstSunday);
  fourthSunday.setDate(firstSunday.getDate() + 21);
  if (fourthSunday < date) {
    const firstDayOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    firstSunday = new Date(firstDayOfNextMonth);
    firstSunday.setDate(firstDayOfNextMonth.getDate() + ((7 - firstDayOfNextMonth.getDay()) % 7));
    fourthSunday = new Date(firstSunday);
    fourthSunday.setDate(firstSunday.getDate() + 21);
  }
  return fourthSunday;
}

async function displayPlayIntentions() {

  await getSessionDetails() // Ensure we have the latest session details before proceeding

  if (userid > 0) {
    // Show playing intentions modal
    const playingModal = document.getElementById('playingModal');
    if (playingModal) {
      playingModal.style.display = 'block';
      const lblplayingm1 = document.getElementById('lblplayingm1');
      lblplayingm1.innerText = `Mon. (${closestComingMonday(new Date()).toLocaleDateString()})`;
      const lblplayingt1 = document.getElementById('lblplayingt1');
      lblplayingt1.innerText = `Tue. (${closestComingTuesday(new Date()).toLocaleDateString()})`;
      const lblplayingf1 = document.getElementById('lblplayingf1');
      lblplayingf1.innerText = `Fri. (${closestComingFriday(new Date()).toLocaleDateString()})`;
      const lblplayingug = document.getElementById('lblplayingug');
      lblplayingug.innerText = `Sun. (${closestComing4thSundayOfMonth(new Date()).toLocaleDateString()})`;

      await setPlayingIntentions() // Set the current value of the checkboxes based on the user's current intentions for those days
    }
  }
}

async function setPlayingIntentions() {
  // we need to set the current value of the checkboxes based on the user's current intentions for those days, which we can get from the server
  const res = await fetch(`/api/getplayingintentions/${userid}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();
  const intentions = result.intentions;
  document.getElementById('playingm1').checked = (intentions.m1 == 1);
  document.getElementById('playingt1').checked = (intentions.t1 == 1);
  document.getElementById('playingf1').checked = (intentions.f1 == 1);
  document.getElementById('playingug').checked = (intentions.ug == 1);
}

function checkTotalFileSize() {
  //use this function when files are being added
  const input = document.getElementById('moreCelebrationImageInput');
  const submitButton = document.getElementById('uploadMoreCelebrationImageId');
  const maxTotalSize = 10 * 1024 * 1024; // 10 MB limit (adjust as needed)
  let totalSize = 0;

  // Clear previous error messages
  // errorMsg.textContent = '';
  submitButton.disabled = false;

  if (input.files.length > 10) {
    showCustomAlert('You can upload a maximum of 10 files with a total size of 10 MB only at a time.');
    submitButton.disabled = true;
    return;
  }

  if (input.files.length > 0) {
    for (const file of input.files) {
      totalSize += file.size;
    }

    if (totalSize > maxTotalSize) {
      const maxSizeMB = maxTotalSize / (1024 * 1024);
      showCustomAlert(`Total file size (${(totalSize / (1024 * 1024)).toFixed(2)} MB) exceeds the limit of ${maxSizeMB} MB.`);
      submitButton.disabled = true; // Disable the submit button
    }
  }
}

function checkTotalFileSize2() {
  //use this function when files are being added
  const input = document.getElementById('celebrationImageInput');
  const submitButton = document.getElementById('addcelebration');
  const maxTotalSize = 10 * 1024 * 1024; // 10 MB limit (adjust as needed)
  let totalSize = 0;

  // Clear previous error messages
  // errorMsg.textContent = '';
  submitButton.disabled = false;

  if (input.files.length > 10) {
    showCustomAlert('You can upload a maximum of 10 files with a total size of 10 MB only at a time.');
    submitButton.disabled = true;
    return;
  }

  if (input.files.length > 0) {
    for (const file of input.files) {
      totalSize += file.size;
    }

    if (totalSize > maxTotalSize) {
      const maxSizeMB = maxTotalSize / (1024 * 1024);
      showCustomAlert(`Total file size (${(totalSize / (1024 * 1024)).toFixed(2)} MB) exceeds the limit of ${maxSizeMB} MB.`);
      submitButton.disabled = true; // Disable the submit button
    }
  }
}

function setupCelebrationsLazyLoad() {
  const select = document.getElementById('celebrations');
  if (!select) return;

  const loadIfNeeded = async () => {
    if (celebrationsLoaded) return;
    celebrationsLoaded = true;
    await populateCelebrations();
  };

  select.addEventListener('focus', loadIfNeeded, { once: false });
  select.addEventListener('pointerdown', loadIfNeeded, { once: false });
}

function displayBlogComments() {
  const blog = document.getElementById('bloglistid')?.selectedOptions[0];
  if (!blog) return console.warn('No blog selected');
  const blogid = blog.value;
  const blogCommentsSection = document.getElementById('blogComments');
  if (!blogCommentsSection) return console.warn('Section #blogComments not found');

  const res = fetch(`/api/blogcomments/${blogid}`, {
    method: 'GET'
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    ).then(result => {
      blogCommentsSection.innerHTML = '';
      result.comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'blog-comment';
        const iDel = document.createElement('i');
        iDel.className = 'fas fa-trash';
        iDel.style = 'position: relative; top: 5px; right: 5px; cursor: pointer;';
        iDel.title = 'Delete Comment';
        iDel.addEventListener('click', () => deleteComment(comment.id));
        const commenterName = document.createElement('div');
        commenterName.className = 'blog-commenter-name';
        commenterName.textContent = `${comment.createddate} - ${comment.commenter} says:`;
        const commentText = document.createElement('div');
        commentText.className = 'blog-comment-text';
        commentText.textContent = comment.comment;
        commentDiv.appendChild(commenterName);
        commentDiv.appendChild(commentText);
        commentDiv.appendChild(iDel);
        blogCommentsSection.appendChild(commentDiv);
      });
    });
}

async function deleteComment(commentId) {
  const result = await showCustomConfirmWithInput('Type DELETE to confirm deletion of this comment.');
  if (!result) return;

  try {
    const res = await fetch(`/api/blogcomment/${commentId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (!result.success) {
      showCustomAlert(`Error deleting comment: ${result.message}`, 5);
      return;
    }
    showCustomAlert('Comment deleted successfully!', 3);
    displayBlogComments();
  } catch (err) {
    showCustomAlert(`Error deleting comment: ${err}`, 5);
  }
}

async function submitComment() {
  const blog = document.getElementById('bloglistid')?.selectedOptions[0];
  if (!blog) return console.warn('No blog selected');
  const blogid = blog.value;
  const commentInput = document.getElementById('blogcomment');
  if (!commentInput) return console.warn('No comment input found');
  const comment = commentInput.value.trim();
  if (!comment) return console.warn('Comment is empty');

  try {
    const res = await fetch(`/api/blogcomment/${blogid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerid: userid, comment })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (!result.success) {
      showCustomAlert(`Error submitting comment: ${result.message}`, 5);
      return;
    }
    showCustomAlert('Comment submitted successfully!', 3);
    commentInput.value = '';
    displayBlogComments();
  } catch (err) {
    showCustomAlert(`Error submitting comment: ${err}`, 5);
  }
}

function showPOTMVoteModal() {
  const modal = document.getElementById('votePOTM');
  if (modal) {
    modal.style.display = 'block';
    PopulatePOTMForm()
  }
}

function closeVotePOTMModal() {
  const modal = document.getElementById('votePOTM');
  if (modal) {
    modal.style.display = 'none';
  }
}


function createblog() {
  window.open('/blogs');
}

window.addEventListener('DOMContentLoaded', decide)

displayPlayIntentions()
