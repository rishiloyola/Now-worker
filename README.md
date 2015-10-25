# Now-worker

We created Now as a way to find realtime checkins around the globe.
We use the Twitter streaming API for finding all the tweets with a swarmapp link, which we then send to the Foursquare API for getting the check-in JSON response.
We use appbase.io to transform this into queriable live data.
We put together a small frontend that allows neat filtering based on city selection and categories or by browsing the map view.
Without further ado, here are the important links: [now worker code](https://github.com/rishiloyola/Now-worker/), [now](https://github.com/rishiloyola/Now) and the [demo](http://rishiloyola.github.io/Now/src/index.html).

##Dependency Installation

Twit api

```
$ npm install twit
```

request module for nodejs

```
$ npm install request
```

AppBase setup

```
$ npm install appbase-js
```
To run the worker also need to do changes in ```config.json``` file. Need to add **Twitter**, **Foursquare** and **Appbase** api authentication key.

