jQuery(document).ready(function($) {

	var socket = io();

	// connect to socket io
	socket.connect(window.location.origin);

	// init query event
	$('button#start-query').on('click', function() {
		data = 'my query data';
		socket.emit('query-init', data);
	});

	// init query response
	socket.on('query-init-response', function(response) {
		console.log(response);
	})

});