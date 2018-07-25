const projectId = process.env.PROJECT_ID;
const sessionId = 'quickstart-session-id';
const query = 'hello';
const languageCode = 'en-US';
const {google} = require('googleapis');
var mongoose = require('mongoose');
var models = require('./models/mongoosemodels.js');
const express = require('express')
const { RTMClient, WebClient } = require('@slack/client');

// Instantiate a DialogFlow client.
mongoose.connect(process.env.MONGODB_URI)
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const app = express()
// Define session path
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The text query request.


const slackToken = process.env.SLACKBOT_OAUTH_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(slackToken);
rtm.start();

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
// See the "Combining with the WebClient" topic below for an example of how to get this ID
// const web = new WebClient(slackToken);

rtm.on('message', (event)=>{
  console.log(event)
  const sessionPath = sessionClient.sessionPath(projectId, event.user);
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URL);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: event.text,
          languageCode: languageCode,
        },
      },
    }

    models.tokenMDB.findOne({
      slackId: event.user,
    })
    // .then(resp => console.log(resp))
    .then(resp => {
      if (!resp){

        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          redirect_url: process.env.REDIRECT_URL
        });
        rtm.sendMessage(authUrl, event.channel);
        console.log(authUrl);


        app.get('/google/callback', (req, res)=>{
          oAuth2Client.getToken(req.query.code, (err, token)=>{
            console.log("TOKEN: ", token)

            oAuth2Client.setCredentials(token);


            const tokenMDB = new models.tokenMDB({
              access: token.access_token,
              refresh: token.refresh_token,
              expiry: token.expiry_date,
              slackId: event.user
            })

            tokenMDB.save()
            .then(resp => {
              if (resp.status === 200){
                rtm.sendMessage('You have authorized us')
              }
            })



          })
        })
      } else{
        oAuth2Client.setCredentials(resp.access);
      }
      sendToDialogFlow(request)
      .then((response)=>{
        console.log(response);
        rtm.sendMessage(response.fulfillmentText, event.channel)
        if(response.allRequiredParamsPresent){
          oAuth2Client.on('token', (err, token) => {
            if (token.refresh_token){

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
          }, (err, resp)=>{
            console.log(err)
          })
          let date = response.parameters.fields.date
          let action = response.parameters.fields.action
        }
      })


    })
  })





  // Load the current channels list asynchrously
  // web.channels.list()
  // .then((res) => {
  //   // Take any channel for which the bot is a member
  //   const channel = res.channels.find(c => c.is_member);
  //
  //   if (channel) {
  //     // We now have a channel ID to post a message in!
  //     // use the `sendMessage()` method to send a simple string to a channel using the channel ID
  //     rtm.sendMessage('Hello, world!', channel.id)
  //       // Returns a promise that resolves when the message is sent
  //       .then((msg) => console.log(`Message sent to channel ${channel.name} with ts:${msg.ts}`))
  //       .catch(console.error);
  //   } else {
  //     console.log('This bot does not belong to any channel, invite it to at least one and try again');
  //   }
  // });




  // An access token (from your Slack app or custom integration - usually xoxb)


  // Send request and log result
  function sendToDialogFlow(request){
    return sessionClient
    .detectIntent(request)
    .then(responses => {
      // console.log('Detected intent');
      const result = responses[0].queryResult;
      // console.log(`  Query: ${result.queryText}`);
      // console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        // console.log(`  Intent: ${result.intent.displayName}`);
        return result
      } else {
        // console.log(`  No intent matched.`);
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
  }
  
  app.listen(1337);
