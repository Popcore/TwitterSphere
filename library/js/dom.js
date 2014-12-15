jQuery(document).ready(function($) {
	console.log('rocknroll');
	// connect to socket io
	io.connect(window.location.origin);

	// query event
	$('input#start-query').on('click', function() {
		data = 'my query data';
		io.emit('query-init', data);
	});

});