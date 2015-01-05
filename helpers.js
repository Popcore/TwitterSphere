var helpers = function() {
	this.name = 'helpers';
	this.version = '0.1.0';
}

	/**
	* map a number against a predefined range
	*
	* @params tweetsData, type:array, the body of data
	* @params valueToCompare, type:string, the tweet obj propery to compare 
	* @return type:int, the mapped value
	*/
	var mapToFixedRange = function(min, max, tweetsData, valueToCompare) {
		var tweetsDataMax = 0,
				tweetsDataMin = 999999999999,
				ratio = 0;

		// get min and max values
		for(var i = 0; i < tweetsData.length; i++) {
			if(tweetsData[i][valueToCompare] > tweetsDataMax) {
				tweetsDataMax = tweetsData[i][valueToCompare];
			} else if(tweetsData[i][valueToCompare] < tweetsDataMin) {
				tweetsDataMin = tweetsData[i][valueToCompare];
			}
		}

		// map values
		ratio = max / tweetsDataMax;
		for(var j = 0; j < tweetsData.length; j++) {
			tweetsData[j][valueToCompare] = tweetsData[j][valueToCompare] * ratio;
		}

		return tweetsData;

	}

	function distributeVertices(polygonVertices, tweetsData) {
		// to do
	}

module.exports.mapToFixedRange = mapToFixedRange;


