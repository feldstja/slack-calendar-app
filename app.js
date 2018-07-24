const projectId = process.env.PROJECT_ID;
const sessionId = 'quickstart-session-id';
const query = 'hello';
const languageCode = 'en-US';
const {google} = require('googleapis');

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

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
     process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.NGROK + '/google/callback');

     const authUrl = oAuth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: SCOPES,
       });
       console.log(authUrl);

       app.get('/google/callback', (res, req)=> {
         console.log(req.query)

         oAuth2Client.getToken(req.query.code, (err, token)=>{
           oAuth2Client.setCredentials(token);
           const calendar = google.calendar({version: 'v3', auth: oAuth2Client})
           calendar.events.insert({
             calendarID: 'primary',
             summary: 'doing a codealong',
             start: {
               date: new Date(Date.now() + 30000)
             },
             end: {
               date: new Date(Date.now() + 90000)
             }
           }, (err, resp)=>console.log(resp))
           console.log(token)
         })
       })
// Send request and log result
sessionClient
  .detectIntent(request)
  .then(responses => {
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  RespoTHISISINAPPJSnse: ${result.fulfillmentText}`);
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
    } else {
      console.log(`  No intent matched.`);
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
app.listen(3000)
