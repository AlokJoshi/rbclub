


function displayaddnewplayerform() {
  if (!isAdmin || !securelogin) {
    showCustomAlert('You must be securely logged in as Admin to add a new player.', 10);
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
    showCustomAlert('You must be securely logged in as Admin to view default login credentials.', 10);
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
    showCustomAlert(`Error fetching default login credentials: ${err.message}`, 5);
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
        showCustomAlert('Player with the same first and last name already exists', 5);
        return;
      }
      throw new Error(`Add player failed: ${res.status} ${err}`);
    }
    //res.message has the username and password
    const result = await res.json();
    if (!result.success) {
      showCustomAlert(`Adding new player failed: ${result.message}`, 5);
      await createPlayerTable(); // refresh the table display
    } else {
      showCustomAlert(result.message, 5);
    }
  } catch (err) {
    console.error('Error adding new player:', err);
    showCustomAlert(`Error adding new player: ${err.message}`, 5);
  }
}

function closeAddNewPlayerModal() {
  const addNewPlayerModal = document.getElementById("addnewplayermodal");
  addNewPlayerModal.style.display = "none";
}

async function PopulateIndividualEmails(){
  const select = document.getElementById('toEmailIndividualSelect');
  if(!select) return console.warn('Select element #toEmailIndividual not found');
  try {
    const res = await fetch('/api/playerdata', { 
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    select.innerHTML = '<option value="">Select Individual(s)</option>';
    for (const player of result) {
      if(player.email === null || player.email.trim()===''){
        continue;
      }
      const option = document.createElement('option');
      option.value = player.email;
      option.textContent = `${player.first} ${player.last} - ${player.email}`;
      select.appendChild(option);
    }
  } catch (err) {
    console.error('Error populating individual emails:', err);
    showCustomAlert(`Error populating individual emails. ${err}`, 5);
  }
}

async function PopulateEmailList() {

  const tbody = document.getElementById('emaillistbody');
  if (!tbody) return console.warn('Table body #emaillistbody not found');

  tbody.innerHTML = '';

  const res = await fetch('/api/mailinglists', {
    method: 'GET'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();


  result.mailingLists.forEach(row => {
    const tr = document.createElement('tr');

    const id = document.createElement('td');
    id.textContent = row.id;
    tr.appendChild(id);

    const name = document.createElement('td');
    name.textContent = row.name;
    tr.appendChild(name);

    const description = document.createElement('td');
    description.textContent = row.description;
    tr.appendChild(description);

    const cell_edit = document.createElement('td');
    const iEdit = document.createElement('i');
    iEdit.className = 'fas fa-edit';
    iEdit.style.marginLeft = '10px';
    iEdit.title = 'Edit Mailing List';
    iEdit.addEventListener('click', () => {
      // Copy the data to the addMailingList form and enable the update button
      document.getElementById('mailingListId').value = row.id;
      document.getElementById('newMailingListName').value = row.name;
      document.getElementById('newMailingListDescription').value = row.description;
      document.getElementById('updateMailingListButton').disabled = false;
      document.getElementById('addMailingListButton').disabled = true;
    });
    cell_edit.appendChild(iEdit);
    tr.appendChild(cell_edit);

    const cell_delete = document.createElement('td');
    const iDelete = document.createElement('i');
    iDelete.className = 'fas fa-trash';
    iDelete.style.marginLeft = '10px';
    iDelete.title = 'Delete Mailing List';
    iDelete.addEventListener('click', async () => {
      // Implement delete functionality here
      console.log(`Delete mailing list with ID: ${row.id}`);
      const res = await fetch(`/api/mailinglist/${row.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.text();
        showCustomAlert(`Error deleting mailing list: ${res.status} ${err}`, 5);
        return;
      } else {
        showCustomAlert(`Mailing list deleted successfully`, 5);
        await PopulateEmailList(); // Refresh the list after deletion
      }
    });
    cell_delete.appendChild(iDelete);
    tr.appendChild(cell_delete);

    tbody.appendChild(tr);
  });
}

async function UpdateMailingList() {
  const mailingListId = document.getElementById('mailingListId').value;
  const nameInput = document.getElementById('newMailingListName');
  const descriptionInput = document.getElementById('newMailingListDescription');
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!name) {
    showCustomAlert('Please enter a name for the mailing list.', 5);
    return;
  }

  try {
    const res = await fetch('/api/mailinglists', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: mailingListId, name, description })
    });
    if (!res.ok) {
      const err = await res.json();
      showCustomAlert(`Error updating mailing list: ${err.message}`, 5);
      return;
    }
    showCustomAlert('Mailing list updated successfully.', 5);
    await PopulateEmailList();
    nameInput.value = '';
    descriptionInput.value = '';
    document.getElementById('updateMailingListButton').disabled = true;
    document.getElementById('addMailingListButton').disabled = false;
  } catch (err) {
    console.error('Error updating mailing list:', err);
    showCustomAlert(`Error updating mailing list. ${err}`, 5);
  }
}

async function AddMailingList() {
  const nameInput = document.getElementById('newMailingListName');
  const descriptionInput = document.getElementById('newMailingListDescription');
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name) {
    showCustomAlert('Please enter a name for the mailing list.', 5);
    return;
  }

  try {
    const res = await fetch('/api/mailinglists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) {
      const err = await res.json();
      showCustomAlert(`Error adding mailing list: ${err.message}`, 5);
      return;
    }
    showCustomAlert('Mailing list added successfully.', 5);
    await PopulateEmailList();
    nameInput.value = '';
    descriptionInput.value = '';
  } catch (err) {
    console.error('Error adding mailing list:', err);
    showCustomAlert(`Error adding mailing list. ${err}`, 5);
  }
}

async function PopulateMailingLists() {
  try {
    const res = await fetch('/api/mailinglists', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    // Populate the select dropdown
    const select = document.getElementById('mailingListSelect');
    // Populate the other dropdown
    const select2 = document.getElementById('toEmailGroupSelect');
    if (!select) return console.warn('Select element #mailingListSelect not found');
    if (!select2) return console.warn('Select element #toEmailGroupSelect not found');
    select.innerHTML = '<option value="">Select a mailing list</option>';
    select2.innerHTML = '<option value="">Select Group</option>';
    result.mailingLists.forEach(ml => {
      const option = document.createElement('option');
      option.value = ml.id;
      option.textContent = ml.name;
      const option2 = document.createElement('option')
      option2.value = ml.id
      option2.textContent = ml.name
      select.appendChild(option);
      select2.appendChild(option2)
    });
  } catch (err) {
    console.error('Error populating mailing lists:', err);
  }
}

async function loadEmailTo() {
  const select = document.getElementById('mailingListSelect');
  const mailingListId = select.value;
  if (!mailingListId) {
    showCustomAlert('Please select a mailing list to load recipients.', 5);
    return;
  }
}

async function loadEmailRecipients() {
  const select = document.getElementById('mailingListSelect');
  const mailingListId = select.value;
  if (!mailingListId) {
    showCustomAlert('Please select a mailing list to load recipients.', 5);
    return;
  }
  try {
    const res = await fetch(`/api/mailinglist/${mailingListId}/recipients`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    const tableBody = document.getElementById('emailRecipientsTableBody');
    if (!tableBody) return console.warn('Table body #emailRecipientsTableBody not found');
    tableBody.innerHTML = '';
    result.recipients.forEach(recipient => {
      const row = document.createElement('tr');
      const idCell = document.createElement('td');
      idCell.textContent = recipient.mailinglistdetailsid;
      row.appendChild(idCell);
      const nameCell = document.createElement('td');
      nameCell.textContent = recipient.name;
      row.appendChild(nameCell);
      const emailCell = document.createElement('td');
      emailCell.textContent = recipient.email;
      row.appendChild(emailCell);
      const deleteCell = document.createElement('td');
      deleteCell.style.cursor = 'pointer';
      deleteCell.addEventListener('click', async () => {
        // Implement delete functionality here
        const mailingListDetailsId = recipient.mailinglistdetailsid;
        const res = await fetch(`/api/mailinglist/${mailingListDetailsId}/removerecipient`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success) {
          row.remove();
          showCustomAlert(`Recipient ${recipient.name} removed successfully.`, 2);
        } else {
          showCustomAlert(`Error removing recipient. ${result.message}`, 5);
        }
      });
      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fas fa-trash';
      deleteCell.appendChild(deleteIcon);
      row.appendChild(deleteCell);
      tableBody.appendChild(row);
    });
    populateNonEmailRecipients();
  } catch (err) {
    console.error('Error loading email recipients:', err);
    showCustomAlert(`Error loading email recipients. ${err}`, 5);
  }
}

async function populateNonEmailRecipients() {
  try {
    const mailingListId = document.getElementById('mailingListSelect').value;
    const res = await fetch(`/api/nonemailrecipients/${mailingListId}`, {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    const container = document.getElementById('nonEmailRecipients');
    if (!container) return console.warn('Container #nonEmailRecipients not found');
    container.innerHTML = '';
    result.recipients.forEach(recipient => {
      const div = document.createElement('div');
      div.style.cursor = 'pointer';
      div.textContent = `${recipient.name}`;
      div.onclick = async () => {
        // Handle click to include recipient
        const memberid = recipient.playerid;
        const res = await fetch(`/api/mailinglist/${mailingListId}/addrecipient`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberid })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success) {
          div.style.display = 'none';
          showCustomAlert(`Recipient ${recipient.name} added successfully.`, 2);
          loadEmailRecipients(); // Refresh the email recipients list
        } else {
          showCustomAlert(`Error adding recipient. ${result.message}`, 5);
        }
      };
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Error populating non-email recipients:', err);
    showCustomAlert(`Error populating non-email recipients. ${err}`, 5);
  }
}

function sendEmail() {

    const mailinglistId = document.getElementById('toEmailGroupSelect').value;
    const individualEmails = Array.from(document.getElementById('toEmailIndividualSelect').selectedOptions).map(option => option.value);

    
    if(mailinglistId && individualEmails.length > 0){
      showCustomAlert('Please select either a mailing list or individual recipients, not both.', 5);
      return;
    }

    if(!mailinglistId && individualEmails.length === 0){
      showCustomAlert('Please select at least one recipient or a mailing list to send the email to.', 5);
      return;
    }
    
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').value.trim();

  
  if (!subject) {
    showCustomAlert('Please enter a subject for the email.', 5);
    return;
  }

  if (!body) {
    showCustomAlert('Please enter a body for the email.', 5);
    return;
  }

  const emailData = {
    mailinglistId: mailinglistId ? mailinglistId : null,
    individualEmails: individualEmails.length > 0 ? individualEmails : null,
    subject,
    text: body,
    playerid: userid // Assuming userid is available in this scope
  };
  // Send the email using fetch or any other method
  fetch('/api/sendemail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(result => {
      if (result.success) {
        showCustomAlert('Email sent successfully.', 2);
      } else {
        showCustomAlert(`Error sending email. ${result.message}`, 5);
      }
    })
    .catch(err => {
      console.error('Error sending email:', err);
      showCustomAlert(`Error sending email. ${err}`, 5);
    });

}

document.addEventListener('DOMContentLoaded', PopulateEmailList);
document.addEventListener('DOMContentLoaded', PopulateMailingLists);



function SetupForAdmin(isAdmin) {
  // const toEmailIndividual = document.getElementById('toEmailIndividual');
  // const toEmailGroup = document.getElementById('toEmailGroup');

}

async function manageemails(){
  const emailSections = document.getElementsByClassName('email');
  Array.from(emailSections).forEach(section => {
      section.style.removeProperty('display');
  });
  PopulateIndividualEmails()
  const target = document.querySelector('#toEmailIndividual');
  target.scrollIntoView({
    behavior: 'smooth', // optional: smooth animation instead of instant jump
    block: 'center',    // align to 'start' | 'center' | 'end' | 'nearest'
    inline: 'nearest'
  });
  await displayEmails()
}


async function displayEmails() {
  try {
    const emailsbody = document.getElementById('emailsbody');
    if (!emailsbody) return console.warn('Table body #emailsbody not found');
    emailsbody.innerHTML = '';
    const res = await fetch('/api/emails', {
      method: 'GET'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (result.success) {
      const emails = result.emails;
      if (emails.length === 0) {
        emailsbody.innerHTML = '<tr><td colspan="7">No emails found.</td></tr>';
        return;
      }
      emails.forEach(email => {
        const row = document.createElement('tr');
        const dt = new Date(email.sentdate).toDateString();
        const to = email.senttoemail && email.senttoemail.length>7 ? email.senttoemail.substring(0,7) + '...' : email.senttoemail;
        const subject = email.subject && email.subject.length>15 ? email.subject.substring(0,15) + '...' : email.subject;
        const reply = email.reply && email.reply.length>15 ? email.reply.substring(0,15) + '...' : email.reply?email.reply:'';
        const emtext = email.emailtext && email.emailtext.length > 20 ? email.emailtext.substring(0,20) + '...' : email.emailtext;
        if(email.delivered){  
          row.style.color = 'blue'; // mails delivered in blue
        }
        row.innerHTML = `
          <td>${dt}</td>
          <td>${email.sender}</td>
          <td>${to}</td>
          <td>${subject}</td>
          <td>${emtext}</td>
          <td>${reply}</td>
        `;
        row.dataset.emailId = email.id; // Store email ID in a data attribute for later use
        row.dataset.messageid=email.messageid; // Store message ID for fetching replies
        row.dataset.sentbyplayerid=email.sentbyplayerid; // Store player ID for later use
        row.dataset.storagekey=email.storagekey; // Store storage key for later use
        row.dataset.delivered=email.delivered; // Store delivered status for later use
        row.dataset.to = email.senttoemail; // Store recipient email for later use
        row.dataset.subject = email.subject; // Store subject for later use
        row.dataset.emailtext = email.emailtext; // Store email text for later use
        row.addEventListener('click', () => {
          // Implement click functionality to view email details and replies
          viewEmailModal(row.dataset)
        });
        emailsbody.appendChild(row);
      });

    } else {
      showCustomAlert(`Error fetching emails. ${result.message}`, 5);
    }
  } catch (err) {
    console.error('Error fetching emails:', err);
    showCustomAlert(`Error fetching emails. ${err}`, 5);
  } 
}

SetupForAdmin(isAdmin)

decideAboutAdmins()
