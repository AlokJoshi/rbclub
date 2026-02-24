require('dotenv').config({ quiet: true });

const FormData = require("form-data"); // form-data v4.0.1
const Mailgun = require( "mailgun.js"); // mailgun.js v11.1.0

async function sendSimpleEmail() {
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
      to: ["Alok Joshi <alokjoshiofaarmax@gmail.com>"],
      subject: "Hello Alok Joshi",
      text: "Congratulations Alok Joshi, you just sent an email with Mailgun! You are truly awesome!",
    });

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}

module.exports = {
    sendSimpleEmail
};
