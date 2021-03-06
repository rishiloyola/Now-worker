//Initialize twitter and appbase modules.
//request module is required for the twitter api
var Twit = require('twit');
var request = require("request");
var Appbase = require("appbase-js");
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


var appbaseObj = new Appbase({
    "url": "https://scalr.api.appbase.io",
    "appname": APPNAME,
    "username": USERNAME,
    "password": PASSWORD
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
                cityDetails = cityDetails.toLowerCase();
                //Storing data using appbase api
                appbaseObj.index({
                  type: 'city',
                  id: parsedbody.response.checkin.id,
                  body: {
                     shout: parsedbody.response.checkin.shout,
                     city: cityDetails,
                     category: parsedbody.response.checkin.venue.categories[0].shortName,
                     latitude: parsedbody.response.checkin.venue.location.lat,
                     longitude: parsedbody.response.checkin.venue.location.lng,
                     venue: parsedbody.response.checkin.venue.name,
                     city_suggest: String(parsedbody.response.checkin.venue.location.city),
                     url: swarmappUrl,
                     username: parsedbody.response.checkin.user.firstName,
                     photourl: parsedbody.response.checkin.user.photo.prefix+"50x50"+parsedbody.response.checkin.user.photo.suffix,
                     state: parsedbody.response.checkin.venue.location.state,
                     country: parsedbody.response.checkin.venue.location.country,
                     location: [parsedbody.response.checkin.venue.location.lat,parsedbody.response.checkin.venue.location.lng]
                  }
                }).on('data', function(res) {
                     console.log(cityDetails);
                     console.log(res);
                }).on('error', function(err) {
                     console.log("indexing error: ", err);
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
            if(parsedbody.response.checkin.venue.location.city && parsedbody.response.checkin.user.firstName && parsedbody.response.checkin.venue.location.state && parsedbody.response.checkin.venue.location.country){
              if(parsedbody.response.checkin.venue.categories[0]){
                if(parsedbody.response.checkin.venue.categories[0].shortName){
                  if(parsedbody.response.checkin.venue.name){
                    if(parsedbody.response.checkin.shout){
                      if(parsedbody.response.checkin.user.photo.prefix && parsedbody.response.checkin.user.photo.suffix){
                        var city = parsedbody.response.checkin.venue.location.city;
                        city = city.toLowerCase();
                        if(city){
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
    }
  return false;  
}

