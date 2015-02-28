var credentials = require('../credentials'),
		twitter 		= require('twitter'),
		helpers 		=	require('../helpers'),
		PythonShell = require('python-shell');
		
// twitter credentials
var t = new twitter({
	consumer_key 				: credentials.consumer_key,
	consumer_secret 		: credentials.consumer_secret,
	access_token_key 		: credentials.access_token_key,
	access_token_secret : credentials.access_token_secret
});

// socket IO
var IO 			= null;

var streamData = function(server) {
	// IO client query
	// var io = require('socket.io')(server);

	SOCKET.on('query-init', function(data) {

		var that = this;

		// augment query data 
		this.queryData = data;
		var keyword = this.queryData.queryKeyword;

		t.search(keyword, { 'count' : 15, 'lang' : 'en', 'result_type' : 'recent' }, function(data) { 

			var dataArray = [],
					dataToPass = [];
			pyScript = new PythonShell('tweet_analysis.py', pySettings);

			// pass data to script
			pyScript.send(data['statuses']);

			// handle response from py
			pyScript.on('message', function(message) {

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
					obj['sentiment']	=	(dataArray[j]['tweet_sentiment_int'] * Math.random() * 10); 	// Pos X	
					obj['age']				=	dataArray[j]['tweet_age'] / 3600;													// Pos Z
					obj['audience']		=	dataArray[j]['user_followers'];														// Pos Y		
					obj['retweet']		= dataArray[j]['tweet_popularity'];													// Surface (min 1)	
					obj['sentimentString']  = dataArray[j]['tweet_sentiment_str'];

					dataToPass.push(obj);
				}

				// map audience to range
				var mappedData = helpers.mapToMaxData(0, 20, dataToPass, 'audience', 'influence');

				// map age to range
				mappedData = helpers.mapToMaxData(0, 20, dataToPass, 'age');

				// map age to range

				// sort by audience
				mappedData.sort(function(a, b) {
					return a.age - b.age;
				});

				// augment twitter data property
				that.processTwitterData = mappedData;

				// emit data array
				SOCKET.emit('query-init-response', that.processTwitterData);
			});
		});
	});

	SOCKET.on('query-init-completed', function() {

		var queryKeyword 	 = this.queryData.queryKeyword,
				processedTData = this.processTwitterData,
				geometryData 	 = this.dataArray,
				that 					 = this;
		
		t.stream(
			'statuses/filter',
			{ track: [ queryKeyword ] },
			function(stream) {
				stream.on('data', function(data) {
					t.currentTwitStream = stream;
					console.log("new tweet");
					var tweetObj = {};

					// init python script
					pyScript = new PythonShell('tweet_analysis.py', pySettings);
					pyScript.send(Array(data));
					pyScript.on('message', function(message) {
						// response from python script
						for(var i in message) {
							tweetObj[i] = message[i];
						}
					});

					// end stream and exit process
					pyScript.end(function(err) {
						if(err) { console.log(err); }

						var pyObj = {
							sentiment 			: tweetObj['tweet_sentiment_int'] * Math.random() * 10, 	// Pos X
							age 						: tweetObj['tweet_age'] / 3600,
							audience				: tweetObj['user_followers'],
							retweet					: tweetObj['tweet_popularity'],
							sentimentString	: tweetObj['tweet_sentiment_str']
						}

						// map data to range
						processedTData.push(pyObj);
						processedTData = helpers.mapToMaxData(-5, 5, processedTData, 'audience', 'influence');
						processedTData = helpers.mapToMaxData(-5, 5, processedTData, 'sentiment');
						processedTData = helpers.mapToMaxData(-5, 5, processedTData, 'age');
						
						// sort by audience

						// TO DO: better sorting here
						// 				influence(defined in helpers.js) gets values that are to high
						//				maybe sorting can be done in helpers > mapToMaxData 
						// 				use audience, age ect and normalize to avoid geometry distortions
						processedTData.sort(function(a, b) {
							return a.sentiment - b.sentiment;
						});

						// emit data array
						SOCKET.emit('streaming-response', processedTData);

					});
				});
			}
		);
	});

	SOCKET.on('reset-query', function() {

		if(t.currentTwitStream !== undefined) {
			t.currentTwitStream.destroy();
			SOCKET.removeAllListeners('streaming-response');
			SOCKET.emit('query-stopped');
		}
	});
}

// python settings
var pySettings = {
  mode 					: 'json',
  pythonPath		: './venv/bin/python',
  pythonOptions	: ['-u'],
  scriptPath		: './venv/',
};

module.exports = {

	// user request
	queryData : {},

	// processed twitter data to exchange with threejs controller
	processTwitterData : {},

	startConnection : function(server) {
		IO = require('socket.io')(server);

		// IO connection
		IO.on('connection', function(socket) {

			SOCKET = socket;
			return SOCKET, streamData();

		});
	}
}


				