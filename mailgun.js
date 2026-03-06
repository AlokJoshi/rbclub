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

async function sendEmail(addresses, subject, text) {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: "info@riversidebridgeclub.com",
      // from: "Mailgun Sandbox <postmaster@sandbox0836465be48442e79cc9ccf38025f456.mailgun.org>",
      // to: ["Alok Joshi <alokjoshiofaarmax@gmail.com>","ajoshi@flash.net"],
      to: addresses,
      subject: subject,
      text: text,
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
