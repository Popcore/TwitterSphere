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
		tweetData = [],
		fov = 30;

function init() {

	container = document.getElementById('container');

	scene = new THREE.Scene();

	// add camera
	camera = new THREE.PerspectiveCamera(
		fov,
		window.innerWidth / window.innerHeight,
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

	/*
	for(var ii = 0; ii < 200; ii++) {
		sphere.geometry.vertices.push(
			new THREE.Vector3( -10,  10, 0 ),
			new THREE.Vector3( -10, -10, 0 ),
			new THREE.Vector3(  10, -10, 0 )
		);

		sphere.geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );

		sphere.geometry.verticesNeedUpdate = true;
		sphere.geometry.elementsNeedUpdate = true;
	}
	*/

	sphere.geometry.dynamic = true;
	
	// populate array of attributes
	var vertices = sphere.geometry.vertices;
	var faces = sphere.geometry.faces;
	var values = attributes.displacement.value;

	for (var v = 0; v < vertices.length; v++) {
		values.push( Math.random() * 30 );
	}

	// upadte verices array
	
	shaderMaterial.needsUpdate = true;

	scene.add(sphere);


	/*
	var q_geometry = new THREE.IcosahedronGeometry( 30, 0);
	var q_material = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe : true} );
	var sphere2 = new THREE.Mesh( q_geometry, q_material );
	scene.add( sphere2 );

	console.log(q_geometry.vertices);
	//console.log(q_geometry.faces.length)
	*/


	//mouse control
	controls = new THREE.TrackballControls(camera);
	controls.addEventListener( 'change', render );

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor(0xbfbfbf, 1); 
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

function distributeVertices(polygonVerticesArray, tweetsData, valueToDistribute, displacementVal) {
	var totalVerticesLength = polygonVerticesArray.length,
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
					console.log(distibutedDataTotal);
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
					dd2 = distibutedData.length - 1;
				}
			}
		}
	}

	verticesReminder = totalVerticesLength % distibutedDataTotal;

	// add inbetweeners (=modulo) to distributeData array
	for(var aa = 0; aa < totalVerticesLength; aa++) {
		if(aa % 2 !== 0 && verticesReminder > 0) {
			distibutedData.splice(aa, 0, 'pass');
			verticesReminder--;
		}
	}
	console.log('vertices length => ' + totalVerticesLength);
	console.log('distibuted Data Total => ' +  distibutedDataTotal);
	console.log('verticesReminder => ' +  verticesReminder);
	console.log('distibutedData => ' +  distibutedData);

	for(var yy = 0, dataLoopCounter = 0, tweetCounter = 0; yy < totalVerticesLength; yy++) {
		
		if(distibutedData[yy] !== 'pass') {
			for(var xx = 0; xx < distibutedData[dataLoopCounter]; xx++) {

				polygonVerticesArray[yy].x = polygonVerticesArray[yy].x + tweetsData[tweetCounter]['sentiment'];
				polygonVerticesArray[yy].y = polygonVerticesArray[yy].y + tweetsData[tweetCounter]['audience'];
				polygonVerticesArray[yy].z = polygonVerticesArray[yy].z + tweetsData[tweetCounter]['age'];
				if(distibutedData[dataLoopCounter] > 1 && xx < distibutedData[dataLoopCounter] - 1) {
					yy++;
				}		
				displacementVal.push( Math.random() * 2 );		
			}
			if(dataLoopCounter < distibutedData.length - 1) {
				dataLoopCounter++;
				tweetCounter++;
			}
		} else {
			polygonVerticesArray[yy].x = polygonVerticesArray[yy].x + ((tweetsData[tweetCounter-1]['sentiment'] + tweetsData[tweetCounter + 1]['sentiment'])/2);
			polygonVerticesArray[yy].y = polygonVerticesArray[yy].y + ((tweetsData[tweetCounter-1]['audience'] + tweetsData[tweetCounter + 1]['audience'])/2);
			polygonVerticesArray[yy].z = polygonVerticesArray[yy].z + ((tweetsData[tweetCounter-1]['age'] + tweetsData[tweetCounter + 1]['age'])/2);
			dataLoopCounter++;
		}
		displacementVal.push( Math.random() * 2 );
	}
	return displacementVal;
}

init();
animate();

SOCKET.on('query-init-response', function(response) {

	console.log(response);
	scene.remove(sphere);

	// generate new geometry
	var geo = new THREE.Geometry();
	var resolution = 0;
	var radius = 30;
	var poly = {};
	poly = augmentIcosaResolution(poly, response.length, radius, resolution);
	var polyMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe : true} );
	
	// displace vertices
	var attributes = {
		displacement: { type : 'f', value : [] }
	}
	var values = attributes.displacement.value;

	/*
	for (var v = 0; v < poly.vertices.length; v++) {
		if(v < response.length) {
			console.log(response[v]['audience']);
			poly.vertices[v]['x'] = poly.vertices[v]['x'] + response[v]['sentiment'];
			poly.vertices[v]['y'] = poly.vertices[v]['y'] + response[v]['audience'];
			poly.vertices[v]['z'] = poly.vertices[v]['z'] + response[v]['age'];
		} else {
			poly.vertices[v]['x'] = 0;
		}
		values.push(1);
	}
	*/	
	distributeVertices(poly.vertices, response, 'audience', values);

	console.log(poly.vertices);

	var uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 				: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  				: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 			: { type: 'f', value: 0.2 },
				'cameraPosY' 			: { type: 'f', value: 0.2 },
				'cameraPosZ' 			: { type: 'f', value: 0.2 },
				//'lightDir' : { type: 'v3', value:  new THREE.Vector3(50, -50, -10) }
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true,
		wireframe				: true,
		wireframeLinewidth : 5
	});

	poly.computeFaceNormals();
	poly.computeVertexNormals();
	poly.verticesNeedUpdate = true;
	poly.elementsNeedUpdate = true;
	shaderMaterial.side = THREE.DoubleSide;
	shaderMaterial.needsUpdate = true;
	attributes.displacement.needsUpdate = true;

	// add geometry to scene
	var sphere2 = new THREE.Mesh( poly, shaderMaterial );
	scene.add(sphere2);

	
	for(var ii = 0; ii < 1; ii++) {
		geo.vertices.push(
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, 30, 0),
			new THREE.Vector3(30, 0, 0),
			new THREE.Vector3(0, 0, 30),
			new THREE.Vector3(15, -30, 15)
		);
	}
	geo.faces.push( new THREE.Face3(0, 1, 2) );
	geo.faces.push( new THREE.Face3(0, 1, 3) );
	geo.faces.push( new THREE.Face3(1, 2, 3) );
	geo.faces.push( new THREE.Face3(0, 2, 3) );
	geo.faces.push( new THREE.Face3(0, 2, 4) );
	geo.faces.push( new THREE.Face3(0, 3, 4) );
	geo.faces.push( new THREE.Face3(2, 3, 4) );

	geo.computeFaceNormals();
	geo.computeVertexNormals();
	geo.verticesNeedUpdate = true;
	geo.elementsNeedUpdate = true;
	shaderMaterial.side = THREE.DoubleSide;
	shaderMaterial.needsUpdate = true;
	attributes.displacement.needsUpdate = true;
	var t_material = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe : true} );
	sphere = new THREE.Mesh( geo, t_material );
	

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	render();
});