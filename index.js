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
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL);

  rtm.on('message', (event)=>{
    console.log(event)
    const sessionPath = sessionClient.sessionPath(projectId, event.user);

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
          redirect_url: process.env.REDIRECT_URL,
          state: JSON.stringify({userId: event.user, channelId: event.channel})
        });
        rtm.sendMessage(authUrl, event.channel);
        console.log(authUrl);
        console.log("RESPONSE SHOULD NOT BE HERE:", resp)

      } else{
        console.log("RESPONSE RIGHT HERE:", resp)
        oAuth2Client.setCredentials({
          access_token: resp.access,
          refresh_token: resp.refresh,
        });
      }
      sendToDialogFlow(request)
      .then((response)=>{
        console.log("RESPONSE:", response);
        rtm.sendMessage(response.fulfillmentText, event.channel)
        if(response.allRequiredParamsPresent && response.action !== 'input.welcome'){
          oAuth2Client.on('token', (err, token) => {
            console.log("TOKEN:", token)
            if (token.refresh_token){
              console.log("TOKEN:", token)
            }
          })
          const calendar = google.calendar({version: 'v3', auth: oAuth2Client})
          // var event = {
          //
          // };
          console.log("ACTION:", response.parameters.fields.action.listValue.values[0].stringValue)
          console.log("DATETIME:", response.parameters.fields.time.stringValue)

          let d = new Date(response.parameters.fields.time.stringValue)
          let e = new Date(d + (1000 * 60 * 30))

          let dStr = e.toISOString();
          console.log("EEEEE:", dStr)

          var otherEvent = {
            'summary': response.parameters.fields.action.listValue.values[0].stringValue,
            'start': {
              'dateTime': response.parameters.fields.time.stringValue,
            },
            'end': {
              'dateTime': dStr,
            },
          };

          calendar.events.insert({
            'calendarId': 'primary',
            'resource': otherEvent
          });


        }
      })
    })
  })


  // An access token (from your Slack app or custom integration - usually xoxb)
  app.get('/google/callback', (req, res)=>{
    oAuth2Client.getToken(req.query.code, (err, token)=>{
      if(err){
        console.log("HERES THE ERROR:", err)
        return
      }

      console.log("TOKEN 2: ", token)
      if(token){
        console.log("TOKEN 3: ", token)
        let obj = JSON.parse(req.query.state)
        oAuth2Client.setCredentials(token);

        console.log("TOKEN 4: ", token)

        const tokenMDB = new models.tokenMDB({
          access: token.access_token,
          refresh: token.refresh_token,
          expiry: token.expiry_date,
          slackId: obj.userId
        })
        console.log("TOKEN 5: ", token)

        tokenMDB.save()
        .then(resp => {
          console.log("TOKEN 6:", resp)
          res.send('good job')
          rtm.sendMessage('You have authorized us', obj.channelId)
        })
      }
    })
  })

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
