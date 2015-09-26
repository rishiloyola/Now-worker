//Initialize twitter and appbase modules.
//request module is required for the twitter api
var Twit = require('twit');
var request = require("request");
var appbase = require("appbase-js");
var elasticsearch = require('elasticsearch');
var fs = require("fs");
var content = fs.readFileSync("config.json");
var jsonContent = JSON.parse(content);


const HOSTNAME = jsonContent.appbase.hostname
const APPNAME = jsonContent.appbase.appname
const USERNAME = jsonContent.appbase.username
const PASSWORD = jsonContent.appbase.password


//Required authetication of twitter api
var T = new Twit({
      consumer_key: jsonContent.twitter.consumer_key,       
      consumer_secret: jsonContent.twitter.consumer_secret,     
      access_token: jsonContent.twitter.access_token,     
      access_token_secret: jsonContent.twitter.access_token_secret
  });
  
  
var client = new elasticsearch.Client({
      host: 'https://'+USERNAME+":"+PASSWORD+"@"+HOSTNAME,
  });
  
  
//Filter tweets related to swarmapp
var stream = T.stream('statuses/filter', { track: 'swarmapp', language: 'en' });


//Streaming of twitter tweets
stream.on('tweet', function (tweet) {
  if(tweet && tweet.entities && tweet.entities.urls[0] && tweet.entities.urls[0].display_url){
    try{
        //swarmapp url of the check in
        var swarmappUrl = tweet.entities.urls[0].display_url;
        //extracting id from that url
        var FSid = swarmappUrl.split("/")[2];
        //created url to get data of that checkin from swarmapp
        var FSurl = "https://api.foursquare.com/v2/checkins/resolve?shortId="+FSid+"&oauth_token="+jsonContent.foursquare.oauth_token+"&v=20150919";
        
        //Getting data from foursquare
        request(FSurl, function(error, response, body) {
          var parsedbody = JSON.parse(body);
          
          if(parsedbody.meta.code==200){
            
            if(parsedbody.response.checkin.venue.location.city && parsedbody.response.checkin.venue.categories[0].shortName && parsedbody.response.checkin.venue.name && parsedbody.response.checkin.shout){
              
              var cityDetails = String(parsedbody.response.checkin.venue.location.city);
              //Storing data using appbase api
              client.index({
                index: 'Check In',
                type: 'city',
                id: parsedbody.response.checkin.id,
                body: {
                  shout: parsedbody.response.checkin.shout,
                  city: cityDetails,
                  category: parsedbody.response.checkin.venue.categories[0].shortName,
                  latitude: parsedbody.response.checkin.venue.location.lat,
                  longitude: parsedbody.response.checkin.venue.location.lng,
                  venue: parsedbody.response.checkin.venue.name,
                  query_suggest: cityDetails,
                  url: swarmappUrl
                }
              }).then(function(response) {
                
                console.log(cityDetails);
                console.log(response);
              
              }, function(error) {
                
                console.log(error);
              
              });
            }
          }
        });
        
      }catch(error){
       
        console.log("an error occurred "+error);
      
      } 
    }
});


