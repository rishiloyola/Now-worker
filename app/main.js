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
  
//Filter tweets related to swarmapp
var stream = T.stream('statuses/filter', { track: 'swarmapp', language: 'en' });
  
var client = new elasticsearch.Client({
      host: 'https://'+USERNAME+":"+PASSWORD+"@"+HOSTNAME,
  });


//Streaming of twitter tweets
stream.on('tweet', function (tweet) {
  
  if(verifyTweets(tweet)){
        //swarmapp url of the check in
        var swarmappUrl = tweet.entities.urls[0].display_url;
        //extracting id from that url
        var FSid = swarmappUrl.split("/")[2];
        //created url to get data of that checkin from swarmapp
        var FSurl = "https://api.foursquare.com/v2/checkins/resolve?shortId="+FSid+"&oauth_token="+jsonContent.foursquare.oauth_token+"&v=20150919";
        
        //Getting data from foursquare
        request(FSurl, function(error, response, body) {
          try{
            
            if(verifyFoursquare(body,error)){
              
              var parsedbody = JSON.parse(body);

              if(parsedbody.meta.code==200){
                
                var cityDetails = String(parsedbody.response.checkin.venue.location.city);
                //Storing data using appbase api
                client.index({
                  index: 'Check In',
                  type: 'city',
                  size: 200,
                  id: parsedbody.response.checkin.id,
                  body: {
                     shout: parsedbody.response.checkin.shout,
                     city: cityDetails,
                     category: parsedbody.response.checkin.venue.categories[0].shortName,
                     latitude: parsedbody.response.checkin.venue.location.lat,
                     longitude: parsedbody.response.checkin.venue.location.lng,
                     venue: parsedbody.response.checkin.venue.name,
                     city_suggest: cityDetails,
                     url: swarmappUrl,
                     username: parsedbody.response.checkin.user.firstName,
                     photourl: parsedbody.response.checkin.user.photo.prefix+"50x50"+parsedbody.response.checkin.user.photo.suffix
                  }
                }).then(function(response) {
                     console.log(cityDetails);
                     console.log(response);
                }, function(error) {
                     console.log(error);
                });
              }
            
            }
          
          }catch(error){
           console.log(error);
          }
      });
    }
});


function verifyTweets(tweet){
  if(tweet){
    if(tweet.entities){
      if(tweet.entities.urls[0]){
        if(tweet.entities.urls[0].display_url){
          return true;
        }
      }
    }
  }
}


function verifyFoursquare(fsdata,error){
  if(fsdata && !error){
      var parsedbody = JSON.parse(fsdata);
      if(parsedbody.response){
        if(parsedbody.response.checkin){
          if(parsedbody.response.checkin.venue && parsedbody.response.checkin.user){
            if(parsedbody.response.checkin.venue.location.city && parsedbody.response.checkin.user.firstName){
              if(parsedbody.response.checkin.venue.categories[0]){
                if(parsedbody.response.checkin.venue.categories[0].shortName){
                  if(parsedbody.response.checkin.venue.name){
                    if(parsedbody.response.checkin.shout){
                      if(parsedbody.response.checkin.user.photo.prefix && parsedbody.response.checkin.user.photo.suffix){
                        return true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  return false;  
}

