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

	function displayAddressSelector(locations) {
		var responselength = locations.length;
		var toAppend = '<div id="address-selector"><select>';
		toAppend += '<option disabled selected>SELECT LOCATION</location>';

		for(var i = 0; i < responselength; i++) {
			toAppend += '<option data-index=' + i + '>' + locations[i].formatted_address + '</li>';
		}
		toAppend += '</select></div>';

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
						var southWestLat = Math.round(response.results[0].geometry.bounds.southwest.lat),
								southWestLng = Math.round(response.results[0].geometry.bounds.southwest.lng),
						 		northEastLat = Math.round(response.results[0].geometry.bounds.northeast.lat),
						 		northEastLng = Math.round(response.results[0].geometry.bounds.northeast.lng);
						
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
								var southWestLat = Math.round(response.results[j].geometry.bounds.southwest.lat),
									southWestLng = Math.round(response.results[j].geometry.bounds.southwest.lng),
						 			northEastLat = Math.round(response.results[j].geometry.bounds.northeast.lat),
						 			northEastLng = Math.round(response.results[j].geometry.bounds.northeast.lng);

							  coordinates.push({
									southWest : southWestLng.toString() + ',' + southWestLat.toString(),
									northEast : northEastLng.toString() + ',' + northEastLat.toString()
								});
							} else {
								var southWestLat = Math.round(response.results[j].geometry.viewport.southwest.lat),
										southWestLng = Math.round(response.results[j].geometry.viewport.southwest.lng),
						 				northEastLat = Math.round(response.results[j].geometry.viewport.northeast.lat),
						 				northEastLng = Math.round(response.results[j].geometry.viewport.northeast.lng);

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

	Query.resetQuery();

	var locationCoordinates;

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
				 	Query.initQuery(queryString);
				}

			} else {
				console.log('Error : No User Data');
			}
			
		}
	});

	// init/reset query event > multiple addresses
	$('body').on('change', 'div#address-selector', function(ev) {
		ev.preventDefault();
		console.log('multiple shit');

		var $this = $(this);
		var index = $this.find(':selected').data('index');
		
		//if( locationCoordinates.runQuery == true ) {
		 	var queryString = locationCoordinates.coordinates[index].southWest + ',' + locationCoordinates.coordinates[index].northEast;
		 	console.log(queryString);
		 	Query.initQuery(queryString);
		//} 

		$this.remove();

	});


	SOCKET.on('display-tweet-info', function(data) {
		//console.log(data.object.userData.text);

		var tweetData 	 = data.object.userData,
				tweetContent = tweetData.text,
				followers 	 = tweetData.followers,
				hashtagsArr  = tweetData.hashtags; // Array

		if(hashtagsArr.length == 0) {
			hashtagsArr = ['None'];
		}

		// append data to DOM
		// => it screws up the mouse tracking position
		$('DIV#tweet-info-container').html('<p>' + 
			'TWEET BODY:' + tweetContent + '<br>' +
			'FOLLOWERS:' + followers + '<br>' +
			'HASTAGS:' + hashtagsArr.join(', ') +
			'</p>');
	});	

});


