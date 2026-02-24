require('dotenv').config({ quiet: true });


const myHeaders = new Headers();
myHeaders.append("Authorization", process.env.INFOBIP_API_KEY);
// myHeaders.append("Authorization", "App 2347a8a728bc006038bbdaaccedc61c5-43993e1e-6bf9-4e99-b2b9-7452006697d5");
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Accept", "application/json");

const raw = JSON.stringify({
    "messages": [
        {
            "destinations": [{ "to": "19092244618" }],
            "from": process.env.INFOBIP_SENDER,
            "text": "This is a preregistered test message from Infobip. Enjoy your free trial!"
        }
    ]
});

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
};

// fetch("https://api.infobip.com/sms/2/text/advanced", requestOptions)
//     .then((response) => response.text())
//     .then((result) => console.log(result))
//     .catch((error) => console.error(error));

function sendTestSMS() {
    fetch("https://api.infobip.com/sms/2/text/advanced", requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
}

module.exports = {
    sendTestSMS
};