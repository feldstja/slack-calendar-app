var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

if (!(process.env.MONGODB_URI)) throw new Error('No MONGODB_URI');
mongoose.connect(process.env.MONGODB_URI, function(){
  console.log('CONNECT TO databasedoug')
});

//==================================SCHEMAS======================================

//USER MODEL SCHEMA
var tokenMDBSchema = new Schema({
  //Username
  access: {
    type: String,
    required: true
  },
  //User's password
  refresh: {
    type: String,
    required: true
  },
  
  slackId:{
    type: String,
    required: true
  }
  //An array of the documents the user has access to
})

//USER MODEL
var tokenMDB = mongoose.model('tokenMDB', tokenMDBSchema);

//DOC MODEL

//==============================================================================

//Export modules
module.exports={
  tokenMDB: tokenMDB,
}
