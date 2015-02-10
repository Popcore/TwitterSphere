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
  mode: 'json',
  pythonPath: './venv/bin/python',
  pythonOptions: ['-u'],
  scriptPath: './venv/',
};

module.exports = {

	// user request
	queryData : {},

	// processed twitter data to exchange with threejs controller
	processTwitterData : {},

	// geomtry data sent from threejs
	geometryArray : {},

	logthis : function() {
		console.log('controller');
	},

	startConnection : function(server) {
		var io = require('socket.io')(server);

		// IO connection
		io.on('connection', function(socket) {

			socket.on('query-init', function(data) {

				var that = this;

				// augment query data 
				this.queryData = data;
				var keyword = this.queryData.queryKeyword;

				t.search(keyword, { 'count' : 5, 'lang' : 'en', 'result_type' : 'recent' }, function(data) { 

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
							obj['sentiment']	=	(dataArray[j]['tweet_sentiment'] * Math.random() * 10); 	// Pos X	
							obj['age']				=	dataArray[j]['tweet_age'] / 3600;													// Pos Z
							obj['audience']		=	dataArray[j]['user_followers'];														// Pos Y		
							obj['retweet']		= dataArray[j]['tweet_popularity'];													// Surface (min 1)	
						
							dataToPass.push(obj);
						}

						// map audience to range
						var mappedData = helpers.mapToMaxData(0, 30, dataToPass, 'audience');

						// sort by audience
						mappedData.sort(function(a, b) {
							return a.age - b.age;
						});

						// augment twitter data property
						that.processTwitterData = mappedData;

						// emit data array
						socket.emit('query-init-response', that.processTwitterData);
					});

				});
			});

			socket.on('query-init-completed', function() {

				var stremingData = 'Hello World. Contorller is streaming data',
						queryKeyword = this.queryData.queryKeyword,
						processedTData = this.processTwitterData,
						geometryData = this.dataArray,
						that = this;
				
				t.stream(
					'statuses/filter',
					{ track: [ queryKeyword ] },
					function(stream) {
						stream.on('data', function(data) {
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
									sentiment : tweetObj['tweet_sentiment'] * Math.random() * 10, 	// Pos X
									age 			: tweetObj['tweet_age'] / 3600,
									audience	: tweetObj['user_followers'],
									retweet		: tweetObj['tweet_popularity']
								}

								// map audience to range
								processedTData.push(pyObj);
								processedTData = helpers.mapToMaxData(0, 30, processedTData, 'audience');
								
								// sort by audience
								processedTData.sort(function(a, b) {
									return a.audience - b.audience;
								});

								// emit data array
								socket.emit('streaming-response', processedTData);

							});
						});
					}
				);
			});
		});
	},

	stremaData : function(server) {
		// IO client query
		var io = require('socket.io')(server);

	}

}