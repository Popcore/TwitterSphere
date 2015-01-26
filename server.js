var express 		= require('express'),
		http				= require('http'),
		path 				= require('path'),
		twitter 		= require('twitter'),
		controller	= require('./controllers/io-controller.js'),
		PythonShell = require('python-shell');

// init app and server
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

// controller
controller.startConnection(server);
