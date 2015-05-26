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
		},
		// reset query
		resetQuery : function() {
			SOCKET.emit('reset-query');
		}
 	}
}());

/***
* DOM EVENTS
***/
jQuery(document).ready(function($) {

	Query.resetQuery();

	var submitButton 	= $('input#start-query');
	// display submit button if form has values
	$('input.user-query-data').on('keypress', function() {
		if($('input.user-query-data').filter(function() { return $(this).val(); }).length > 0) {
			submitButton.removeClass('hidden-el');
		} else {
			submitButton.addClass('hidden-el');
		}
	});
	
	// init/reset query event
	$('form#side-controls').on('submit', function(ev) {
		ev.preventDefault();

		var $this 				= $(this);
		var submitButton 	= $('input#start-query');

		if($this.hasClass('reset')) {
			// reset query
			$this.removeClass('reset');
			submitButton.removeClass('reset');
			submitButton.attr('value', 'GO');
			Query.resetQuery();
		} else {

			// init query
			var queryVars = {
				queryKeyword  : $('input#keyword').val().toLowerCase(),
				queryLocation : $('input#location').val(),
				queryUser 		: $('input#user').val()
			}

			$this.addClass('reset');
			submitButton.addClass('reset');
			submitButton.attr('value', 'RESET');

			Query.initQuery(queryVars);
		}
	});

	SOCKET.on('display-tweet-info', function(data) {
		console.log(data.object.userData.text);

		var tweetData 	 = data.object.userData,
				tweetContent = tweetData.text,
				followers 	 = tweetData.followers,
				hashtagsArr  = tweetData.hashtags; // Array

		if(hashtagsArr.length == 0) {
			hashtagsArr = ['None'];
		}

		// append data to DOM
		$('DIV#tweet-info-container').html('<p>' + 
			'TWEET BODY:' + tweetContent + '<br>' +
			'FOLLOWERS:' + followers + '<br>' +
			'HASTAGS:' + hashtagsArr.join(', ') +
			'</p>');
	});	

});


