module.exports = function(app) {

	// index
	app.get('/', function(req, res) {
		res.render('index.jade');
	});
}