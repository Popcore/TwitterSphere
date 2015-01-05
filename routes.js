module.exports = function(app) {

	// INDEX
	app.get('/', function(req, res) {
		res.render('index.jade');
	});
}