/***
* QUERY MODULE
***/
var Query = (function() {

	// private properties
	// ...

 	return {
 		// init query handler
	 	initQuery : function(data) {
			SOCKET.emit('query-init', data);
		},

		// location query handler
		locationQuery : function(data) {
			//...
		},

		// hastag query handler
		hastagQuery : function(data) {
			//...
		}
 	}
}());

/***
* DOM EVENTS
***/
jQuery(document).ready(function($) {

	// init query event
	$('form#side-controls').on('submit', function(ev) {
		ev.preventDefault();

		var queryVars = {
			queryKeyword : $('input#keyword').val().toLowerCase(),
			queryLocation : $('input#location').val(),
			queryUser : $('input#user').val()
		}

		Query.initQuery(queryVars);
	});

	// other events
	// ...

});