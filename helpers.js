var helpers = function() {
	this.name = 'helpers';
	this.version = '0.1.0';
}

/**
* get numeric array m,aximum value
*
* @params numericArr, type:array, the numeric array
* @return type:int, the max value
*/
function arrayMax(numericArr) {
	return Math.max.apply(null, numericArr);
}

/**
* map an array of values accordin to their max input / max value ratio 
*
* @params min, max, type:int, the max and min values to map the array data to
* @params tweetsData, type:array, the body of data
* @params valueToCompare, type:string, the tweet obj propery to compare 
* @return type:int, the mapped value
*/
var mapToMaxData = function(min, max, tweetsData, valueToCompare) {
	var tweetsDataMax = 0,
			tweetsDataMin = 999999999999,
			ratio = 0;

	// get min and max values
	for(var i = 0; i < tweetsData.length; i++) {
		if(tweetsData[i][valueToCompare] > tweetsDataMax) {
			tweetsDataMax = tweetsData[i][valueToCompare];
		}

		if(tweetsData[i][valueToCompare] < tweetsDataMin) {
			tweetsDataMin = tweetsData[i][valueToCompare];
		}
	}

	ratio = max / tweetsDataMax;
	for(var j = 0; j < tweetsData.length; j++) {
		tweetsData[j][valueToCompare] = tweetsData[j][valueToCompare] * ratio;
	}

	return tweetsData;
}

/**
* normalize an array of values according to min an max values
*
* @params minRange, minRange, type:int, the min and max values to normalize the array data to
* @params minInput, maxInput type:int, the min and max data that will be passed
* @params valueToCompare, type:string, the row value to normalize 
* @return type:int, the normalized value
*/
var normailzeToRange = function(minRange, maxRange, minInput, maxInput, value) {
	if(value < minInput ) {
		value = minInput;
	} else if(value > maxInput) {
		value = maxInput;
	}
	// normalize value to 0-1 range
	// formula: (value - min)/(max-min)
	var normalizedVal = (value - minInput) / (maxInput - minInput);

	// map nornmalized value to man - max input range
	var absRange = Math.abs(minRange) + Math.abs(maxRange);
	var mappedPercentageVal = ((normalizedVal * 100) * absRange) / 100;
	var mappedVal = minRange + mappedPercentageVal;

	return mappedVal;
}

/**
* distibute array values to an array of vertices
*
* @params polygonVerticesArray, type:array, the polygon vertices array
* @params tweetsData, type:array of int, the data to distibute
* @return type:array, the distributed tweetsData values + distibuted polygonVerticesArray reminders 
*/
function distributeVertices(polygonVerticesArray, tweetsData) {
	var totalVerticesLength = polygonVerticesArray.length,
			totalDataLength = tweetsData.length,
			totalData = 0,
			dataToVerticesRatio = 0,
			verticesReminder = 0,
			distibutedData = [],
			distibutedDataTotal = 0;

	if(totalDataLength > totalVerticesLength) {
		console.log('Error => Data exceed available space');
		return
	}

	for (var ii = 0; ii < totalDataLength; ii++) {
		totalData += parseInt(tweetsData[ii]);
	}

	dataToVerticesRatio = totalVerticesLength/totalData;

	for (var jj = 0; jj < totalDataLength; jj++) {
		distibutedData.push(tweetsData[jj] * dataToVerticesRatio);
	}

	for (var kk = 0; kk < distibutedData.length; kk++) {
		distibutedDataTotal += distibutedData[kk];
	}

	verticesReminder = totalVerticesLength % distibutedDataTotal;

	for(var yy = 0, tweetsCounter = 0, tweetsDistributionCounter = 0, changeArr = false; yy < polygonVerticesArray.length; yy++) {
		if(changeArr == false) {
			for(var ll = 0; ll <= distibutedData[tweetsCounter]; ll++) {
				polygonVerticesArray[yy].x = tweetsData[ytweetsDistributionCounter].xVal;
				polygonVerticesArray[yy].y = tweetsData[tweetsDistributionCounter].yVal;
				polygonVerticesArray[yy].z = tweetsData[tweetsDistributionCounter].zVal;
				yy++;
				tweetsDistributionCounter++;
				if(ll == distibutedData[tweetsCounter] - 1) {
					changeArr = true;
					tweetsCounter++;
					break;
				}
			}
		} else {
			polygonVerticesArray[yy].x = (tweetsData[tweetsCounter-1].xVal + tweetsData[tweetsCounter].xVal)/2;
			polygonVerticesArray[yy].y = (tweetsData[tweetsCounter-1].yVal + tweetsData[tweetsCounter].yVal)/2;
			polygonVerticesArray[yy].z = (tweetsData[tweetsCounter-1].zVal + tweetsData[tweetsCounter].zVal)/2;
			changeArr = false;
		}
	}

	// NOW WE NEED TO:
	// 1) RETURN THE DISTRIBUTED DATA AND REMINDER
	// 2) MAP AND DISTRIBUTE 1 DATA UNIT AND 1 REMINDER UNIT TO VERTICES ARRAY
	// 3) UPDATED REMINDER UNIT INTERVAL VERTEX.X VERTEX.Y VERTEX.Z 
	// TO VALUES BETWEEN DATA[ALPHA].X - DATA[BETA].X | DATA[ALPHA].Y - DATA[BETA].Y | DATA[ALPHA].Z - DATA[BETA].Z
}

module.exports.mapToMaxData = mapToMaxData;
module.exports.normailzeToRange = normailzeToRange;
module.exports.distributeVertices = distributeVertices;
