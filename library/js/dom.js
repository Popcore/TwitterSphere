/***
* QUERY MODULE
***/
var QUERY = (function() {
 	var Events = {};

 	// init query handler
 	Events.initQuery = function(data) {
		var data = data;
		SOCKET.emit('query-init', data);
	} 

	// location query handler
	Events.locationQuery = function(data) {
		//...
	}

	// hastag query handler
	Events.hastagQuery = function(data) {
		//...
	}

	return Events;
}());

/***
* DOM EVENTS
***/
jQuery(document).ready(function($) {

	// init query event
	$('button#start-query').on('click', function() {
		data = 'my query data';
		QUERY.initQuery(data);
	});

	// other events
	// ...

});