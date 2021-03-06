/***
* QUERY MODULE
***/
var Query = (function() {

	// private properties
	// ...

 	return {
 		// init query handler
	 	initQuery : function(data) {
			SOCKET.emit('query-init-completed', data);
		},

		// location query handler
		locationQuery : function(data) {
			SOCKET.emit('query-by-location', data);
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

var Helpers = ( function() {
	// private properties
	var googleAPIUrl = 'http://maps.google.com/maps/api/geocode/json?address=';

	// private methods
	function displayAddressSelector(locations) {
		var responselength = locations.length;
		var toAppend = '<div id="address-selector">';
		toAppend += '<div id="top-bar"><span id="close"></span></div>';
		toAppend += '<select>';
		toAppend += '<option disabled selected>SELECT LOCATION</option>';

		for(var i = 0; i < responselength; i++) {
			toAppend += '<option data-index=' + i + '>' + locations[i].formatted_address + '</li>';
		}
		toAppend += '</select>';
		//toAppend += '<button class="cancel">CANCEL</button>';
		toAppend += '</div>';

		$('body').append(toAppend);
	}

	return {
		getLocationsCoordinates : function(locationName) {
			var latitude,
					longitude,
					coordinates,
					cleanLocationName = locationName.queryLocation.replace(' ', '-').toLowerCase(),
					responseCoordinates = { a : 'vvvv' };

			$.ajax({
				url 		: googleAPIUrl + cleanLocationName,
				async		: false,
				success : function(response) {
					console.log(response);
					var responselength = response.results.length;

					if(responselength === 1) {
						var southWestLat = response.results[0].geometry.bounds.southwest.lat,
								southWestLng = response.results[0].geometry.bounds.southwest.lng,
						 		northEastLat = response.results[0].geometry.bounds.northeast.lat,
						 		northEastLng = response.results[0].geometry.bounds.northeast.lng;
						
						responseCoordinates = {
							runQuery : true,
							coordinates : {
								southWest : southWestLng.toString() + ',' + southWestLat.toString(),
								northEast : northEastLng.toString() + ',' + northEastLat.toString()
							}
						}
					} else {
						displayAddressSelector(response.results);
						coordinates = [];
						for(var j = 0; j < responselength; j++) {
							if(response.results[j].geometry.bounds !== undefined) {
								var southWestLat = response.results[j].geometry.bounds.southwest.lat,
									southWestLng = response.results[j].geometry.bounds.southwest.lng,
						 			northEastLat = response.results[j].geometry.bounds.northeast.lat,
						 			northEastLng = response.results[j].geometry.bounds.northeast.lng;

							  coordinates.push({
									southWest : southWestLng.toString() + ',' + southWestLat.toString(),
									northEast : northEastLng.toString() + ',' + northEastLat.toString()
								});
							} else {
								var southWestLat = response.results[j].geometry.viewport.southwest.lat,
										southWestLng = response.results[j].geometry.viewport.southwest.lng,
						 				northEastLat = response.results[j].geometry.viewport.northeast.lat,
						 				northEastLng = response.results[j].geometry.viewport.northeast.lng;

								coordinates.push({
									southWest : southWestLng.toString() + ',' + southWestLat.toString(),
									northEast : northEastLng.toString() + ',' + northEastLat.toString()
								});
							}
							
						}

						responseCoordinates =  {
						 	runQuery  	: false,
						 	coordinates : coordinates
						}
					}
				},
				error : function(error) {
					console.log(error);
				},
			});
			return responseCoordinates
		}
	}
}());

/***
* DOM EVENTS
***/
jQuery(document).ready(function($) {

	// Query.resetQuery();

	var locationCoordinates,
	submitButton = $('input#start-query');

	// display submit button if form has values
	$('input.user-query-data').on('keypress', function() {
		if($('input.user-query-data').filter(function() { return $(this).val(); }).length >= 0) {
			submitButton.removeClass('hidden-el');
		} else {
			submitButton.addClass('hidden-el');
		}
	});

	// remove form values if click on different tweet
	// allow 1 tyoe of query only
	$('input[type=text]').on('click', function() {

		if($(this).val() == '') {
			$('input[type=text]').each(function() {
				$(this).val('');
			});
		}
	});
	
	// init/reset query event
	$('form#side-controls').on('submit', function(ev) {
		ev.preventDefault();

		var $this 				= $(this),
				submitButton 	= $('input#start-query');

		if($this.hasClass('reset')) {
			// reset query
			$this.removeClass('reset');
			submitButton.removeClass('reset');
			submitButton.attr('value', 'GO');
			Query.resetQuery();

		} else {
			if( $('input#keyword').val().toLowerCase() !== '' ) {
				// init keyword query
				console.log($('input#keyword').val().toLowerCase());
				queryVar = {
					queryKeyword  : $('input#keyword').val().toLowerCase(),
				}

				$this.addClass('reset');
				submitButton.addClass('reset');
				submitButton.attr('value', 'RESET');
				Query.initQuery(queryVar);

			} else if( $('input#location').val() !== undefined ) {
				// init location query
				queryVar = {
					queryLocation : $('input#location').val()
				}

				// query google maps api
				locationCoordinates = Helpers.getLocationsCoordinates(queryVar);
				console.log(locationCoordinates);

				if( locationCoordinates !== undefined && locationCoordinates.runQuery == true ) {
				 	var queryString = locationCoordinates.coordinates.southWest + ',' + locationCoordinates.coordinates.northEast;
				 	console.log(queryString);
				 	Query.locationQuery(queryString);
				}

			} else {
				console.log('Error : No User Data');
			}
			
		}
	});

	// init/reset query event > multiple addresses
	$('body').on('change', 'div#address-selector', function(ev) {
		ev.preventDefault();

		var $this = $(this);
		var index = $this.find(':selected').data('index');
		
		var queryString = locationCoordinates.coordinates[index].southWest + ',' + locationCoordinates.coordinates[index].northEast;
		console.log(queryString);
		console.log('QUERY BY LOCATION > Multiple');
		Query.locationQuery(queryString);

		$this.remove();

	});

	// hide location select and reset query field
	$(document).on('click', 'span#close', function() {
		console.log('close');
		$('div#address-selector').remove();
		$('input#location').val('');
	});


	// display tweet info when object is selected
	SOCKET.on('display-tweet-info', function(data) {

		var tweetData 	 = data.object.userData,
				tweetContent = tweetData.text,
				followers 	 = tweetData.followers,
				hashtagsArr  = tweetData.hashtags; // Array

		if(hashtagsArr.length == 0) {
			hashtagsArr = ['None'];
		}

		// append data to DOM
		// => it screws up the mouse tracking position
		$('div#tweet-info-container').slideToggle(100).html('<p class="tweet-content">' + 
			'TWEET BODY:' + tweetContent + '<br>' +
			'FOLLOWERS:' + followers + '<br>' +
			'HASHTAGS:' + hashtagsArr.join(', ') +
			'</p>');
	});	

	// hide tweet info on deselection
	SOCKET.on('hide-tweet-info', function() {
		$('div#tweet-info-container').hide(100);
	});

});


