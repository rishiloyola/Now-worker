//Initialize twitter and appbase modules
var fs = require("fs");
var content = fs.readFileSync("config.json");
var jsonContent = JSON.parse(content);
var request = require("request");
var appbase = require("appbase-js");
var elasticsearch = require('elasticsearch');

const HOSTNAME = jsonContent.appbase.hostname
const APPNAME = jsonContent.appbase.appname
const USERNAME = jsonContent.appbase.username
const PASSWORD = jsonContent.appbase.password

//Required authetication of twitter api

var client = new elasticsearch.Client({
    host: 'https://'+USERNAME+":"+PASSWORD+"@"+HOSTNAME,
  });

 client.indices.putMapping({
    index: 'Check In',
    type: 'city',
    body: {
        properties:{
          query_suggest : {
          "type" : "completion"
        }
      }
    }
    }).then(function(response) {
        console.log(response);
    }, function(error) {
        console.log(error);
});
