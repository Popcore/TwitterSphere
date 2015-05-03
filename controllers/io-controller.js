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

// python settings
var pySettings = {
  mode 					: 'json',
  pythonPath		: './venv/bin/python',
  pythonOptions	: ['-u'],
  scriptPath		: './venv/',
};

// socket IO
var IO 			= null;

var streamData = function(SOCKET) {

	SOCKET.on('query-init', function(data) {

		var that = this;

		// augment query data 
		this.queryData = data;
		var keyword = this.queryData.queryKeyword;

		console.log(keyword);

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
					obj['sentiment']	=	(dataArray[j]['tweet_sentiment_int'] * Math.random() * 10); // Pos X	
					obj['age']				=	dataArray[j]['tweet_age'] / 3600;														// Pos Z
					obj['audience']		=	dataArray[j]['user_followers'];															// Pos Y		
					obj['retweet']		= dataArray[j]['tweet_popularity'];														// Surface (min 1)	
					obj['sentimentString']  = dataArray[j]['tweet_sentiment_str'];

					dataToPass.push(obj);
				}

				// map audience to range
				var mappedData = helpers.mapToMaxData(0, 20, dataToPass, 'audience', 'influence');

				// map age to range
				mappedData = helpers.mapToMaxData(0, 20, dataToPass, 'age');

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
					console.log(data);
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

						// map audience to range
						// cap max size
						var normalizedAudience = helpers.normailzeToRange(20, 100, 0, 9999, tweetObj['user_followers']);

						console.log('real number = ' + tweetObj['user_followers']);
						console.log('audience radius =' + normalizedAudience);

						var pyObj = {
							text 						: tweetObj['tweet_text' ],
							age 						: tweetObj['tweet_age'] / 3600, // Z Pos 
							sentiment 			: tweetObj['tweet_sentiment_int'] + Math.random() * 10, // X Pos
							audience				: normalizedAudience, // Y Pos
							retweets_number : tweetObj['tweet_popularity'],
							sentimentString	: tweetObj['tweet_sentiment_str'],
							retweetted_ID		: tweetObj['retweet'],
							hashtags				: tweetObj['tweet_hashtags']
						}

						// processedTData.push(pyObj);
						// processedTData = helpers.mapToMaxData(-1, 1, processedTData, 'sentiment');
						// processedTData = helpers.mapToMaxData(-1, 1, processedTData, 'age');

						// emit data array
						SOCKET.emit('streaming-response', pyObj);

					});
				});
			}
		);
	});

	SOCKET.on('reset-query', function() {
		// destroy twitter stream
		if(t.currentTwitStream !== undefined) {
			t.currentTwitStream.destroy();
			SOCKET.removeAllListeners('streaming-response');
			SOCKET.emit('query-stopped');
		}
	});
}

module.exports = {

	// user request
	queryData : {},

	// processed twitter data to exchange with threejs controller
	processTwitterData : {},

	startConnection : function(server) {
		IO = require('socket.io')(server);
		IO.on('connection', function(socket) {
			var SOCKET = socket;
			streamData(SOCKET);
		});
	}
}


				