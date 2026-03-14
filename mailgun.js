require('dotenv').config({ quiet: true });
const crypto = require('crypto')

const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require( "mailgun.js"); // mailgun.js v11.1.0


const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex')

    return (encodedToken === signature)
}

async function sendEmail({addresses, subject, text, html='',emailid=''}) {
  // emailid is an optional parameter that can be used to track the email in the database
  // this requires that we first save the data in the emails table and then pass the emailid to this function to include in the email headers or body for tracking purposes
  
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });
  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: "info@riversidebridgeclub.com",
      to: addresses,
      subject,
      text,
      html,
      'v:emailid': emailid // include emailid in the email variables for tracking
    });

    console.log(data); // logs response data
    return data;
  } catch (error) {
    console.log(error); //logs any error
    return null;
  }
}

async function getMessageEvents(recipientEmail) {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
    mg.domains.list()
    .then(domains => console.log(domains)) // logs array of domains
    .catch(err => console.error(err)); // logs any error

  //   mg.messages.retrieveStoredEmail(process.env.MAILGUN_DOMAIN,process.env.MAILGUN_API_KEY)
  // .then(storedEmail => console.log(storedEmail)) // logs response data
  // .catch(err => console.error(err)); // logs any error
  // } catch (error) {
  //   console.log(error);
  
} 
function saveEmailRecord(emailData) {
  // This function would contain logic to save the email data to a database
    const {sentbyplayerid,recipients,subject,text,timestamp} = emailData;
    //first save the email data to the emails table
    
    // For example, you could use an ORM like Sequelize or Mongoose to save the data to a SQL or NoSQL database
    // The emailData parameter would contain all the relevant information about the email event, such as recipient, event type, timestamp, etc.
    // You would need to define a schema for your email records and then create a new record with the emailData
}

module.exports = {
    sendEmail,
    getMessageEvents,
    verify,
    saveEmailRecord
};
