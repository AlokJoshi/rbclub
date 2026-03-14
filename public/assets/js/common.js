//global
let sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname;
let celebrationsLoaded = false;

function delay(durationInMilliseconds) {
  return new Promise(resolve => setTimeout(resolve, durationInMilliseconds));
}

//delay duration in seconds
async function showCustomAlert(message, delayDuration = 3) {
  swal({ 
    title: 'Riverside Bridge Club',
    text: message 
  });
  // const alertBox = document.getElementById('customAlert');
  // const alertMessage = alertBox.querySelector('p');
  // alertMessage.textContent = message;
  // alertBox.style.display = 'flex';
  // await delay(delayDuration * 1000); // Display for the specified duration
  // // Fade out effect
  // alertBox.style.transition = 'opacity 0.5s';
  // alertBox.style.display = 'none';
}

async function showCustomConfirmWithInput(message) {
  const expected = 'DELETE';
  const userInput = await swal({
    title: message,
    content: {
      element: 'input',
      attributes: {
        placeholder: `Type ${expected} to confirm`,
        autocapitalize: 'off'
      }
    },
    buttons: ['Cancel', 'Confirm']
  });

  return typeof userInput === 'string' &&
    userInput.trim().toUpperCase() === expected;
}

async function getSessionDetails() {
  try {

    const res = await fetch('/get-session-id', {
      method: 'GET'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json()
    sessionId = result.sessionId;
    securelogin = result.securelogin;
    insecurelogin = result.insecurelogin;
    username = result.username;
    userid = result.userid;
    isAdmin = result.isAdmin;
    casuallogin = result.casuallogin;
    fullname = result.fullname;

    return [result.sessionId, result.securelogin, result.insecurelogin, result.username, result.userid, result.isAdmin, result.casuallogin, result.fullname];

  } catch (err) {

    console.error('API error:', err);
  }
}

async function decide() {
  [sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname] = await getSessionDetails()
  // Base the decision on global variables set during login or checks
  console.log(sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname)
  // Check if the session exists
  // const [sessionid,securelogin]= await isUserLoggedIn()

  // remove blurred effect from all content classes
  const contentElements = document.getElementsByClassName('content');
  const show = sessionId && (casuallogin || insecurelogin || securelogin);
  for (let i = 0; i < contentElements.length; i++) {
    if (!show) {
      contentElements[i].classList.add('blurred');
    } else {
      contentElements[i].classList.remove('blurred');
    }
  }

  let logindetails = ''
  let logindetails2 = ``
  if (sessionId && casuallogin) {
    logindetails = `You are logged in as ${username} but you are a casual visitor. You can only view the data.`
    logindetails2 = `${fullname} : As a casual visitor, you can only view the data.`
    showCustomAlert(logindetails, 7)
  } else if (sessionId && insecurelogin) {
    logindetails = `You are logged in as ${username} but you are using a password that is not secure. You can only view the data.`
    logindetails2 = `${fullname} : You are using a password that is not secure. You can only view the data.`
    showCustomAlert(logindetails, 7)
  } else if (sessionId && securelogin && !isAdmin) {
    logindetails = `Note that you are securely logged in as ${username} and you can view data as well as edit your own data.`
    logindetails2 = `${fullname} : You are securely logged in and can view data as well as edit your own data.`
    showCustomAlert(logindetails, 7)
  } else if (sessionId && securelogin && isAdmin) {
    logindetails = `Note that you are logged in as ${username}, an Admin, and can view and edit all data.`
    logindetails2 = `${fullname} : You are logged in as an Admin and can view and edit all data.`
    showCustomAlert(logindetails, 7)
  } else {
    logindetails = `Note that you are not logged in. You must log in with the log-in details sent to you. Alternatively, you can log in by using your full name and phone number. If you are a member and have not received login details, please contact the club.`
    logindetails2 = logindetails
    showCustomAlert(logindetails, 7)
    console.log("User is not logged in.");
  }
  if(document.getElementById('loginresult')){
    document.getElementById('loginresult').textContent = logindetails2;
  }



}

async function decideAboutAdmins() {
  [sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname] = await getSessionDetails()
  // Base the decision on global variables set during login or checks
  console.log(sessionId, securelogin, insecurelogin, username, userid, isAdmin, casuallogin, fullname)
  // Check if the session exists
  // const [sessionid,securelogin]= await isUserLoggedIn()

  // remove blurred effect from all content classes
  const contentElements = document.getElementsByClassName('content');
  const show = sessionId && securelogin && isAdmin;
  for (let i = 0; i < contentElements.length; i++) {
    if (!show) {
      contentElements[i].classList.add('blurred');
    } else {
      contentElements[i].classList.remove('blurred');
    }
  }

  if (!show) {
    showCustomAlert('You must be logged in as an Admin to access this page.', 7)
    console.log("User is not an Admin or not logged in.");
  }

}