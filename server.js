var express 		= require('express'),
		http				= require('http'),
		path 				= require('path'),
		twitter 		= require('twitter'),
		helpers 		=	require('./helpers'),
		PythonShell = require('python-shell');

// init app, server and sockets
var app = express(),
		server = http.Server(app),
		io = require('socket.io')(server);

// app settings
app.set('port', process.env.PORT || 8006);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'library')));

// python settings
var pySettings = {
  mode: 'json',
  pythonPath: './venv/bin/python',
  pythonOptions: ['-u'],
  scriptPath: './venv/',
};

// routes
require('./routes.js')(app);

// server
server.listen(app.get('port'), function() {
	console.log('Server running @ http://127.0.0.1:%d', app.get('port'));
});

// connect to twitter
var credentials = require('./credentials');
var t = new twitter({
	consumer_key 				: credentials.consumer_key,
	consumer_secret 		: credentials.consumer_secret,
	access_token_key 		: credentials.access_token_key,
	access_token_secret : credentials.access_token_secret
});

// 1A. query entry point => search
io.on('connection', function(socket) {
	console.log('io socket open');
	socket.on('query-init', function() {
		t.search('nike -RT', { 'count' : 5, 'result_type' : 'popular', 'lang' : 'en' }, function(data) {

			var dataArray = [],
					dataToPass = [];
			pyScript = new PythonShell('tweet_analysis.py', pySettings);

			// pass data to script
			pyScript.send(data['statuses']);

			// handle response
			pyScript.on('message', function(message) {
				// response from python script
				var tweetData = {}
				for( var i in message ) {
					tweetData[i] = message[i];
				}

				dataArray.push(tweetData);
				return dataArray;
			});

			// end stream and exit process
			pyScript.end(function(err) {

				if(err) { console.log(err); }

				for (var j = 0; j < dataArray.length; j++) {

					var obj = {};
					obj['sentiment']	=	(dataArray[j]['tweet_sentiment'] * Math.random() * 10); 	// Pos X	
					obj['age']				=	dataArray[j]['tweet_age'] / 3600;						// Pos Z
					obj['audience']		=	dataArray[j]['user_followers'];							// Pos Y		
					obj['retweet']		= dataArray[j]['tweet_popularity'];						// Surface (min 1)	
				
					//console.log('SENTIMENT: ' + sentiment);
					//console.log('AGE: ' + age);
					//console.log('AUDIENCE: ' + audience);
					//console.log('RETWEETS: ' + retweet);
					console.log(obj);
					dataToPass.push(obj)
					console.log('========================================');
				}

				// map audience to range
				var a = helpers.mapToFixedRange(0, 30, dataToPass, 'audience');
				// sort by age
				a.sort(function(a, b) {
					return a.audience - b.audience;
				});
				console.log(a);
				// emit data array
				socket.emit('query-init-response', dataToPass);

			});
		});
	});
});




// 1B. query entry point => search by trends/place
/**
* TO TEST!!!
* must be able to PASS LOCATION as argument
**/
/*
function getByLocation(location) {
	// pass location into query
	t.get('/trends/place.json?id=1', function(data, res) {
		for(var i in data) {
			console.log(data[i]);
		}
	});
}
*/

// 2A. real time stream
/*
t.stream(
	'statuses/filter',
	{ track: ['sneakers'] },
	function(stream) {
		stream.on('data', function(tweet) {
			console.log("new tweet");

			// init python script
			pyScript = new PythonShell('tweet_analysis.py', pySettings);
			// pass data to script
			pyScript.send(tweet.text);

			pyScript.on('message', function(message) {
				// response from python script
				console.log(message);
			});

			// end stream and exit process
			pyScript.end(function(err) {
				if(err) { console.log(err); }

				console.log('=========== END ===========');
			});
			// console.log('tweet user => ');
			// for(var i in tweet.user) {
			// 	console.log(i + ' => ' + tweet.user[i]);
			// }
			// console.log('tweet text => ' + tweet.text);
			// console.log('tweet geo => ' + tweet.geo);
			// console.log('tweet coordinates => ' + tweet.coordinates);
			// console.log('tweet place => ' + tweet.place);
			// console.log('tweet date => ' + tweet.created_at);
			// console.log('retweet => ' + tweet.retweet_count);
		});
	}
);
// pyScript.send('testing');
*/


