var express 		= require('express'),
		http				= require('http'),
		path 				= require('path'),
		twitter 		= require('twitter'),
		PythonShell = require('python-shell'),
		io 					= require('socket.io');

// python settings
var pySettings = {
  mode: 'json',
  pythonPath: './venv/bin/python',
  pythonOptions: ['-u'],
  scriptPath: './venv/',
};

var app = express(),
		server = http.Server(app);

// app settings
app.set('port', process.env.PORT || 8006);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'library')));

// routes
require('./routes.js')(app);

// server
server.listen(app.get('port'), function() {
	console.log('Server running @ http://127.0.0.1:%d', app.get('port'));
});

// socket io
io.listen(server);

// talk to twitter
var credentials = require('./credentials');
var t = new twitter({
	consumer_key 				: credentials.consumer_key,
	consumer_secret 		: credentials.consumer_secret,
	access_token_key 		: credentials.access_token_key,
	access_token_secret : credentials.access_token_secret
});

// 1A. entry point => search
io.on('query-init', function() {
	console.log('hello');
})

t.search('sneakers -RT', { 'count' : 2, 'result_type' : 'recent' }, function(data) {

	//console.log(data['statuses']);
	var dataArray = [];
	
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
			for (var k in dataArray[j]) {
				console.log('key: ' + k + ' | val: ' + dataArray[j][k]);
			}
			console.log('========================================');
		}

	});
	
});


// 1B. entry point => search by trends/place
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


