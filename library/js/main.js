// 2.1 => render scene
// IMPORTANT: render scene 
//							opt 1) after tweetData array has been populated
//							opt 2) render something on page load and update scene when tweetData array is ready

var animation = null,
		container, 
		renderer,
		scene,
		camera,
		mesh,
		sphere,
		sphere2,
		controls,
		start = Date.now(),
		dirLight,
		ambientLight,
		networkPoly = {},
		fov = 30;

function init() {

	container = document.getElementById('container');

	scene = new THREE.Scene();

	// add camera
	camera = new THREE.PerspectiveCamera(
		fov,
		container.offsetWidth / container.offsetHeight,
		1,
		10000 );
	camera.position.z = 300;
	camera.target = new THREE.Vector3(0, 0, 0);

	scene.add(camera);

	var attributes = {
		displacement : { type : 'f', value : [] },
		attribColors : { type : 'v4', value : [] }
	}
	var uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  		: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 		: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  		: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 	: { type: 'f', value: 0.0 },
				'cameraPosY' 	: { type: 'f', value: 0.0 },
				'cameraPosZ' 	: { type: 'f', value: 0.0 },
				'myColor'			: { type: 'c', value : new THREE.Color( 0xffccff ) }
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true,
	});

	// add sphere
	sphere = new THREE.Mesh( new THREE.IcosahedronGeometry(20, 0), shaderMaterial );

	sphere.geometry.dynamic = true;
	
	// populate array of attributes
	var vertices = sphere.geometry.vertices;
	var faces = sphere.geometry.faces;

	for (var v = 0; v < vertices.length; v++) {
		attributes.displacement.value.push( Math.random() * 30 );

		var red = Math.random();
	  var green = Math.random();
	  var blue = Math.random();
	  var alpha = 1;
	  attributes.attribColors.value.push(new THREE.Vector4( red, green, blue, alpha ));
	}

	console.log(attributes.attribColors.value);

	// update verices array
	shaderMaterial.needsUpdate = true;

	scene.add(sphere);

	//mouse control
	controls = new THREE.TrackballControls(camera, container);
	controls.addEventListener( 'change', render );

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( container.offsetWidth, container.offsetHeight );
	renderer.setClearColor(0x00000a, 1); 
	container.appendChild( renderer.domElement ); 
};

function animate() {
	animation = requestAnimationFrame( animate );
	controls.update();
	render();
}

function render() {
	renderer.render( scene, camera );
}

function augmentIcosaResolution(self, dataLength, radius, currentRes) {

	self = new THREE.IcosahedronGeometry(radius, currentRes);
	
	if(self.vertices.length > dataLength) {
		return self;
	} else {
		++currentRes;
		return augmentIcosaResolution(self, dataLength, radius, currentRes);
	}
}

function distributeVertices(networkPolygonVerticesArray, tweetsData, valueToDistribute, displacementVal) {
	var totalVerticesLength = networkPolygonVerticesArray.length,
			totalDataLength = tweetsData.length,
			totalData = 0,
			dataToVerticesRatio = 0,
			verticesReminder = 0,
			distibutedData = [],
			distibutedDataTotal = 0,
			changeArr = false;

	if(totalDataLength > totalVerticesLength) {
		console.log('Error => Data exceed available space');
		return;
	}

	for (var ii = 0; ii < totalDataLength; ii++) {
		totalData += parseInt(tweetsData[ii][valueToDistribute]); 
	}

	dataToVerticesRatio = totalVerticesLength/totalData;

	for (var jj = 0; jj < totalDataLength; jj++) {
		var distributedVal = (Math.floor(tweetsData[jj][valueToDistribute] * dataToVerticesRatio) == 0) ? 1 : Math.floor(tweetsData[jj][valueToDistribute] * dataToVerticesRatio);
		distibutedData.push(distributedVal);
	}

	for (var kk = 0; kk < distibutedData.length; kk++) {
		distibutedDataTotal += distibutedData[kk];
	}

	if(distibutedDataTotal > totalVerticesLength) {
		var dd1 = totalVerticesLength;
		var dd2 = distibutedData.length - 1;
		while(dd1--) {
			var currentDataTot = 0;

			if(distibutedData[dd2] > 1) {
				distibutedData[dd2] -= 1;

				for(var tt = 0; tt < distibutedData.length; tt++) {
					currentDataTot += distibutedData[tt];
				}
				
				if(currentDataTot <= totalVerticesLength) {
					distibutedDataTotal = currentDataTot;
					break;
				} else if(dd2 < 0) {
					dd2 = distibutedData.length - 1;
				} else {
					dd2--;
				}
			} else {
				if(dd2 >= 0) {
					dd2--;
				} else {
					dd1 = totalVerticesLength;
					dd2 = distibutedData.length - 1;
				}
			}
		}
	}

	verticesReminder = totalVerticesLength % distibutedDataTotal;

	// console.log('total networkPoly vertices =>' + totalVerticesLength + ' distributed data total=> ' + distibutedDataTotal);
	// console.log('Total data length =>' + totalData);
	// console.log('dataToVerticesRatio =>' + dataToVerticesRatio);
	console.log('distibutedData =>' + distibutedData);
	console.log('verticesReminder =>' + verticesReminder);

	// add inbetweeners (= modulo) to distributeData array
	for(var aa = 0; aa < totalVerticesLength; aa++) {
		if(aa % 2 !== 0 && verticesReminder > 0) {
			distibutedData.splice(aa, 0, 'pass');
			verticesReminder--;
		}
	}

	for(var yy = 0, dataLoopCounter = 0, tweetCounter = 0; yy < totalVerticesLength; yy++) {
		
		if(distibutedData[yy] !== 'pass') {
			for(var xx = 0; xx < distibutedData[dataLoopCounter]; xx++) {
				console.log('in use');
				networkPolygonVerticesArray[yy].x = networkPolygonVerticesArray[yy].x + tweetsData[tweetCounter]['sentiment'];
				networkPolygonVerticesArray[yy].y = networkPolygonVerticesArray[yy].y + tweetsData[tweetCounter]['influence'];
				networkPolygonVerticesArray[yy].z = networkPolygonVerticesArray[yy].z + tweetsData[tweetCounter]['age'];
				networkPolygonVerticesArray[yy].status = 'in use';
				if(distibutedData[dataLoopCounter] > 1 && xx < distibutedData[dataLoopCounter] - 1 && yy < totalVerticesLength - 1) {
					yy++;
				}		
				displacementVal.push( Math.random() * 2 );		
			}
			if(dataLoopCounter < distibutedData.length - 1) {
				dataLoopCounter++;
			}
			if(tweetCounter < distibutedDataTotal - 1) {
				tweetCounter++;
			}
		} else {
			console.log('empty');
			networkPolygonVerticesArray[yy].x = networkPolygonVerticesArray[yy].x + ((tweetsData[tweetCounter-1]['sentiment'] + tweetsData[tweetCounter + 1]['sentiment'])/2);
			networkPolygonVerticesArray[yy].y = networkPolygonVerticesArray[yy].y + ((tweetsData[tweetCounter-1]['influence'] + tweetsData[tweetCounter + 1]['influence'])/2);
			networkPolygonVerticesArray[yy].z = networkPolygonVerticesArray[yy].z + ((tweetsData[tweetCounter-1]['age'] + tweetsData[tweetCounter + 1]['age'])/2);
			networkPolygonVerticesArray[yy].status = 'empty';
			if(dataLoopCounter < distibutedData.length - 1) {
				dataLoopCounter++;
			}
			displacementVal.push( Math.random() * 2 );
		}
	}
	return networkPolygonVerticesArray, displacementVal;
}

function addStreamedData(tweetObjArray, newTweet, radius, currentRes) {
	var addedData = false;
	for(var ii = 0; ii < tweetObjArray.length; ii++) {
		if(tweetObjArray[ii].status == 'empty') {
			tweetObjArray[ii].x = newTweet['sentiment'];
			tweetObjArray[ii].y = newTweet['influence'];
			tweetObjArray[ii].z = newTweet['age'];
			tweetObjArray[ii].status = 'in use'; 
			addedData = true;
			console.log('Added Data to Poly');
			break;
		}	
	} 

	if(addedData == false) {
		currentRes++;
		var augemntedPoly = new THREE.IcosahedronGeometry(radius, currentRes);

		for(var ll = 0; ll < augemntedPoly.vertices; ll++) {
			if(augemntedPoly.vertices[ll].status == 'empty' || augemntedPoly.vertices[ll].status == 'undefined') {
				augemntedPoly.vertices[ll].x = newTweet['sentiment'];
				augemntedPoly.vertices[ll].y = newTweet['influence'];
				augemntedPoly.vertices[ll].z = newTweet['age'];
				augemntedPoly.vertices[ll].status = 'in use';
				console.log('Created new Poly'); 
				break;
			}	
		}
	}
}

init();

animate();

/*
* INIT NETWORK GRAPH
*/
SOCKET.on('query-init-response', function(response) {

	scene.remove(sphere);

	// generate new geometry
	var resolution = 0;
	var radius = 30;
	networkPoly = augmentIcosaResolution(networkPoly, response.length, radius, resolution);
	
	// displace vertices
	var attributes = {
		displacement: { type : 'f', value : [] }
	}
	
	// displacement array 
	var displacementValues = attributes.displacement.value;
	
	distributeVertices(networkPoly.vertices, response, 'influence', displacementValues);

	console.log('vertices data => ');
	console.log(networkPoly.vertices);

	var uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  				: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 			: { type: 'f', value: 0.2 },
				'cameraPosY' 			: { type: 'f', value: 0.2 },
				'cameraPosZ' 			: { type: 'f', value: 0.2 },
				'myColor'					: { type : 'c', value : new THREE.Color( 0xffccff ) },
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true
		// wireframe				: true,
		// wireframeLinewidth : 5
	});

	networkPoly.computeFaceNormals();
	networkPoly.computeVertexNormals();
	networkPoly.verticesNeedUpdate = true;
	networkPoly.elementsNeedUpdate = true;
	shaderMaterial.side = THREE.DoubleSide;
	shaderMaterial.needsUpdate = true;
	attributes.displacement.needsUpdate = true;

	// add geometry to scene
	sphere2 = new THREE.Mesh( networkPoly, shaderMaterial );
	scene.add(sphere2);

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	render();
	SOCKET.emit('query-init-completed');
});

/*
* AUGMENT NETWORK GRAPH WITH STREAMING DATA
*/
SOCKET.on('streaming-response', function(response) {
	// augment vertices array
	// see: http://stackoverflow.com/questions/24531109/three-js-vertices-does-not-update
	
	var radius = 30,
			resolution = 0;

	// case 1: response.length <= networkPoly.vertices.length
	if(response.length <= networkPoly.vertices.length) {
		// distribute vertices of updated data objects array
		var attributes = {
			displacement: { type : 'f', value : [] }
		}
		var displacementValues = attributes.displacement.value;
		distributeVertices(networkPoly.vertices, response, 'influence', displacementValues);
		console.log('networkPoly = ');
		console.log(networkPoly.vertices);

		// update geometry
		networkPoly.computeFaceNormals();
		networkPoly.computeVertexNormals();
		networkPoly.verticesNeedUpdate = true;
		networkPoly.elementsNeedUpdate = true;
		attributes.displacement.needsUpdate = true;
	} else {
		console.log('We need to updated the geometry resolution');
		scene.remove(sphere2);
	}
	

	// 1a) if response.length > networkPoly.vertices.length => augment geometry
	// 1b) else skip this step

	// 2a) map data to new geometry
	// 2b) add new data to existing empty slots ??? how do we sort geometry so that it makes sense?

	// 3) display geometry

});