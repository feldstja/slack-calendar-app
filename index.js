const projectId = process.env.PROJECT_ID;
const sessionId = 'quickstart-session-id';
const query = 'hello';
const languageCode = 'en-US';
const {google} = require('googleapis');
var mongoose = require('mongoose');
var models = require('./models/mongoosemodels.js');
const express = require('express')
const { RTMClient } = require('@slack/client');

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const app = express()
// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The text query request.
const request = {
  session: sessionPath,
  queryInput: {
    text: {
      text: query,
      languageCode: languageCode,
    },
  },
};

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    // state: {
    //   id: 12345
    // },
    redirect_url: process.env.REDIRECT_URL
  });
  console.log(authUrl);

  app.get('/google/callback', (req, res)=> {

    //tokenMDB.findBy(slackId: )


    res.send('Finished')
    oAuth2Client.getToken(req.query.code, (err, token)=>{
       console.log("TOKEN: ", token)

    oAuth2Client.setCredentials(token);


    oAuth2Client.on('token', (err, token) => {
      if (token.refresh_token){
        const tokenMDB = new models.tokenMDBSchema({
          access: token.access_token,
          refresh: token.refresh_token,
        })

      }
    })
      const calendar = google.calendar({version: 'v3', auth: oAuth2Client})
      calendar.events.quickAdd({
        calendarId: 'primary',
        text: 'codealong at 3:00 pm today',
        //   body: {
        //   "end": {
        //     dateTime: new Date(Date.now() + 90000)
        //   },
        //   "start": {
        //     dateTime: new Date(Date.now() + 30000)
        //   },
        //   "summary": 'doing a codealong',
        // }
      }, (err, resp)=>console.log(resp))
    })
  })



// An access token (from your Slack app or custom integration - usually xoxb)
const slackToken = process.env.CLIENT_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(slackToken);
rtm.start();

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
// See the "Combining with the WebClient" topic below for an example of how to get this ID
const conversationId = 'abcde';

// The RTM client can send simple string messages
rtm.sendMessage('Hello there', conversationId)
  .then((res) => {
    // `res` contains information about the posted message
    console.log('Message sent: ', res.ts);
  })
  .catch(console.error);

  // Send request and log result
  sessionClient
  .detectIntent(request)
  .then(responses => {
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
    } else {
      console.log(`  No intent matched.`);
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
  });

  app.listen(1337);
