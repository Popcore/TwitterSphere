 jQuery(document).ready(function($) {

	// init query event
	$('button#start-query').on('click', function() {
		data = 'my query data';
		SOCKET.emit('query-init', data);
	});

});