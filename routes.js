module.exports = function(app) {

	// INDEX
	app.get('/', function(req, res) {
		res.render('index.jade');
	});

	// Test Page
	app.get('/test', function(req, res) {
		res.render('test.jade');
	});
}