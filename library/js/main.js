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
		controls,
		start = Date.now(),
		dirLight,
		ambientLight,
		networkPoly = {},
		tweetData = [],
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
		displacement: { type : 'f', value : [] }
	}
	var uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  				: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 			: { type: 'f', value: 0.0 },
				'cameraPosY' 			: { type: 'f', value: 0.0 },
				'cameraPosZ' 			: { type: 'f', value: 0.0 }
				//'lightDir' : { type: 'v3', value:  new THREE.Vector3(50, -50, -10) }
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
	var values = attributes.displacement.value;

	for (var v = 0; v < vertices.length; v++) {
		values.push( Math.random() * 30 );
	}

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
			// valueToDistribute = Audience

	if(totalDataLength > totalVerticesLength) {
		console.log('Error => Data exceed available space');
		return;
	}

	for (var ii = 0; ii < totalDataLength; ii++) {
		totalData += parseInt(tweetsData[ii][valueToDistribute]); 
	}

	dataToVerticesRatio = totalVerticesLength/totalData;

	for (var jj = 0; jj < totalDataLength; jj++) {
		var distirbutedVal = (Math.floor(tweetsData[jj][valueToDistribute] * dataToVerticesRatio) == 0) ? 1 : Math.floor(tweetsData[jj][valueToDistribute] * dataToVerticesRatio);
		distibutedData.push(distirbutedVal);
	}

	for (var kk = 0; kk < distibutedData.length; kk++) {
		distibutedDataTotal += distibutedData[kk];
	}


	// THINK ABOUT CASE LIMITS!!!!! (ie what is one loop is not enough?)
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
				
				if(currentDataTot < totalVerticesLength) {
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
					dd2 = distibutedData.length;
				}
			}
		}
	}

	verticesReminder = totalVerticesLength % distibutedDataTotal;

	console.log('total networkPoly vertices =>' + totalVerticesLength + ' distributed data total=> ' + distibutedDataTotal);
	console.log('Total data length =>' + totalData);
	console.log('dataToVerticesRatio =>' + dataToVerticesRatio);
	console.log('distibutedData =>' + distibutedData);
	console.log('verticesReminder =>' + verticesReminder);

	// add inbetweeners (=modulo) to distributeData array
	for(var aa = 0; aa < totalVerticesLength; aa++) {
		if(aa % 2 !== 0 && verticesReminder > 0) {
			distibutedData.splice(aa, 0, 'pass');
			verticesReminder--;
		}
	}

	for(var yy = 0, dataLoopCounter = 0, tweetCounter = 0; yy < totalVerticesLength; yy++) {
		
		if(distibutedData[yy] !== 'pass') {
			for(var xx = 0; xx < distibutedData[dataLoopCounter]; xx++) {

				networkPolygonVerticesArray[yy].x = networkPolygonVerticesArray[yy].x + tweetsData[tweetCounter]['sentiment'];
				networkPolygonVerticesArray[yy].y = networkPolygonVerticesArray[yy].y + tweetsData[tweetCounter]['audience'];
				networkPolygonVerticesArray[yy].z = networkPolygonVerticesArray[yy].z + tweetsData[tweetCounter]['age'];
				if(distibutedData[dataLoopCounter] > 1 && xx < distibutedData[dataLoopCounter] - 1 && yy < totalVerticesLength - 1) {
					yy++;
				}		
				displacementVal.push( Math.random() * 2 );		
			}
			if(dataLoopCounter < distibutedData.length - 1) {
				dataLoopCounter++;
				tweetCounter++;
			}
		} else {
			networkPolygonVerticesArray[yy].x = networkPolygonVerticesArray[yy].x + ((tweetsData[tweetCounter-1]['sentiment'] + tweetsData[tweetCounter + 1]['sentiment'])/2);
			networkPolygonVerticesArray[yy].y = networkPolygonVerticesArray[yy].y + ((tweetsData[tweetCounter-1]['audience'] + tweetsData[tweetCounter + 1]['audience'])/2);
			networkPolygonVerticesArray[yy].z = networkPolygonVerticesArray[yy].z + ((tweetsData[tweetCounter-1]['age'] + tweetsData[tweetCounter + 1]['age'])/2);
			dataLoopCounter++;
		}
		displacementVal.push( Math.random() * 2 );
	}
	return displacementVal;
}

init();

animate();

/*
* INIT NETWORK GRAPH
*/
SOCKET.on('query-init-response', function(response) {

	scene.remove(sphere);

	// generate new geometry
	var geo = new THREE.Geometry();
	var resolution = 0;
	var radius = 30;
	networkPoly = augmentIcosaResolution(networkPoly, response.length, radius, resolution);
	
	// displace vertices
	var attributes = {
		displacement: { type : 'f', value : [] }
	}
	
	// displacement array 
	var displacementValues = attributes.displacement.value;
	
	distributeVertices(networkPoly.vertices, response, 'audience', displacementValues);

	var uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  				: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 			: { type: 'f', value: 0.2 },
				'cameraPosY' 			: { type: 'f', value: 0.2 },
				'cameraPosZ' 			: { type: 'f', value: 0.2 },
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true,
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
	var sphere2 = new THREE.Mesh( networkPoly, shaderMaterial );
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
	console.log('response from server =>' + response);
	console.log(networkPoly);
});