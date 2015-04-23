var animation = null,
		container, 
		sidebar,
		headerElem,
		renderer,
		axisRenderer,
		scene,
		axisScene,
		camera,
		mesh,
		vMeshParent,
		// set true to enable raycaster for mouse over objs
		mouseInteraction = false,
		sphere2,
		controls,
		projector,
		mouse = new THREE.Vector2(),
		raycaster = new THREE.Raycaster(),
		INTERSECTED,
		uniforms,
		start = Date.now(),
		dirLight,
		ambientLight,
		networkPoly = {},
		fov = 30,
		frame = 0;

function init() {

	container 		= document.getElementById('container');
	axisContainer = document.getElementById('axis-container');
	sidebar       = document.getElementById('sidebar');
	headerElem	  = document.getElementById('top-header');
	scene 				= new THREE.Scene();
	axisScene 		= new THREE.Scene();
	camera 				= new THREE.PerspectiveCamera(
		fov,
		container.offsetWidth / container.offsetHeight,
		1,
		10000 );
	camera.position.z = 300;
	camera.target = new THREE.Vector3(0, 0, 0);
	scene.add(camera);

	//mouse control
	controls 		 = new THREE.TrackballControls(camera, container);
	controls.addEventListener( 'change', render );

	// sphere 1
	var geometry = new THREE.IcosahedronGeometry(20, 0);
	var materal  = new THREE.MeshLambertMaterial(
		{ color: 0xffffff, 
			shading: THREE.FlatShading 
		} 
	);
	var sphere   = new THREE.Mesh( geometry, materal );
	//sphere.geometry.dynamic = true;
	scene.add(sphere);

	// light 
	var light    = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );

	var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(1, -1, 1).normalize();
      scene.add(directionalLight);
 

	// renderer 1
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	//renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( container.offsetWidth, container.offsetHeight );
	renderer.setClearColor(0x00000a, 1); 
	container.appendChild( renderer.domElement ); 

};

function onDocumentMouseMove(event) {
	var sidebarWidth  = sidebar.offsetWidth;
	var headerHeight  = headerElem.offsetHeight;
	mouse.x = ( (event.clientX - sidebarWidth) / container.offsetWidth) * 2 - 1;
	mouse.y = - ( (event.clientY - headerHeight) / container.offsetHeight ) * 2 + 1;
	mouse.realX = event.clientX;
	mouse.realY = event.clientY;
} 

function render() {
	renderer.render( scene, camera );
}

function animate() {
	animation = requestAnimationFrame( function() {
		animate();
	});
	controls.update();
	render();
}

function update() {
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1);
	projector.unprojectVector( vector, camera );
	raycaster.set( camera.position, vector.sub(camera.position).normalize() );

	// create array of objects with which the ray intersects
	var intersects = raycaster.intersectObjects( scene.children, true ); 

	// INTERSECTED = the object closest to the camera and intersected by 
	// the ray projected from the mouse position
	if(intersects.length > 0) {
		
		if(intersects[0].object != INTERSECTED) {
			if(INTERSECTED) {
				console.log(INTERSECTED.material.color);
				INTERSECTED.material.color.setHex(0xff0000);
			}
			INTERSECTED = intersects[0].object;
			//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
			console.log(INTERSECTED.material);
			INTERSECTED.material.color.setHex(0xff0000);
		}
	} else {
		if(INTERSECTED) {
			INTERSECTED.material.color.setHex(0xff0000);
		}
		INTERSECTED = null;
	}
}

/**
* replace icosaedron obj with and icosaedron with hier resolution and more vertices
* it is called when tweet data > geometry resolution
*
*	@param self       : THREEObj = the variable holding the icosaedron
*	@param dataLength : Int = the data array length to compare the icosaedron vertices array against
*	@param radius		  : Int = min icosaedron radius
*	@param currentRes : Int = icosaedron current resolution
**/
function augmentIcosaResolution(self, dataLength, radius, currentRes) {

	self = new THREE.IcosahedronGeometry(radius, currentRes);
	
	if(self.vertices.length > dataLength) {
		return self;
	} else {
		++currentRes;
		return augmentIcosaResolution(self, dataLength, radius, currentRes);
	}
}

function distributeVertices(networkPolygonVerticesArray, tweetsData, valueToDistribute, displacementVal, colorsVal) {
	var totalVerticesLength = networkPolygonVerticesArray.length,
			totalDataLength = tweetsData.length,
			totalData = 0,
			dataToVerticesRatio = 0,
			verticesReminder = 0,
			distibutedData = [],
			distibutedDataTotal = 0,
			changeArr = false,
			vertexColor;

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

	var twitterDataCount = distibutedData.length;

	// add inbetweeners (= modulo) to distributeData array
	for(var aa = 0; aa < totalVerticesLength; aa++) {
		if(aa % 2 !== 0 && verticesReminder > 0) {
			distibutedData.splice(aa, 0, 'pass');
			verticesReminder--;
		}
	}

	for(var yy = 0, dataLoopCounter = 0, tweetCounter = 0; yy < totalVerticesLength; yy++) {
		
		if(distibutedData[yy] !== 'pass') {
			if(networkPolygonVerticesArray[yy] !== 'undefined' ) {
				for(var xx = 0; xx < distibutedData[dataLoopCounter]; xx++) {
				networkPolygonVerticesArray[yy].x 			 = networkPolygonVerticesArray[yy].x + tweetsData[tweetCounter]['sentiment'];
				networkPolygonVerticesArray[yy].y 			 = networkPolygonVerticesArray[yy].y + tweetsData[tweetCounter]['influence'];
				networkPolygonVerticesArray[yy].z 			 = networkPolygonVerticesArray[yy].z + tweetsData[tweetCounter]['age'];
				networkPolygonVerticesArray[yy].status 	 = 'in use';
				networkPolygonVerticesArray[yy].parentID = tweetCounter;


					// get vertext color based on sentiment value
					switch(true) {
						case tweetsData[tweetCounter]['sentimentString'] == 'positive': 
							vertexColor = new THREE.Vector4( 1.0, 0.0, 0.0, 1.0 ); // RGBA red
							//vertexColor = new THREE.Vector4( Math.random(), Math.random(), Math.random(), 1.0 );
							break;
						case tweetsData[tweetCounter]['sentimentString'] == 'neutral': 
							vertexColor = new THREE.Vector4( 1.0, 1.0, 1.0, 1.0 ); // RGBA white
							//vertexColor = new THREE.Vector4( Math.random(), Math.random(), Math.random(), 1.0 );
							break;
							break;
						case tweetsData[tweetCounter]['sentimentString'] == 'negative': 
							vertexColor = new THREE.Vector4( 0.0, 0.0, 1.0, 1.0 ); // RGBA blue
							//vertexColor = new THREE.Vector4( Math.random(), Math.random(), Math.random(), 1.0 );
							break;
							break;
						default:
							vertexColor = new THREE.Vector4( 0.7, 1.0, 1.0, 1.0 ); // RGBA white
							//vertexColor = new THREE.Vector4( Math.random(), Math.random(), Math.random(), 1.0 );
							break;
					}
						
					if(distibutedData[dataLoopCounter] > 1 && xx < distibutedData[dataLoopCounter] - 1 && yy < totalVerticesLength - 1) {
						yy++;
					}		

					// populate attributes obj
					displacementVal.push( 1 );
					colorsVal.push(vertexColor);	
				}
			}

			if(dataLoopCounter < distibutedData.length - 1 && dataLoopCounter < totalVerticesLength - 1) {
				dataLoopCounter++;
			}

			if(tweetCounter < twitterDataCount) {
				tweetCounter++;
			}

		} else {
			networkPolygonVerticesArray[yy].x = networkPolygonVerticesArray[yy].x + ((tweetsData[tweetCounter-1]['sentiment'] + tweetsData[tweetCounter + 1]['sentiment'])/2);
			networkPolygonVerticesArray[yy].y = networkPolygonVerticesArray[yy].y + ((tweetsData[tweetCounter-1]['influence'] + tweetsData[tweetCounter + 1]['influence'])/2);
			networkPolygonVerticesArray[yy].z = networkPolygonVerticesArray[yy].z + ((tweetsData[tweetCounter-1]['age'] + tweetsData[tweetCounter + 1]['age'])/2);
			networkPolygonVerticesArray[yy].status = 'empty';
			if(dataLoopCounter < distibutedData.length - 1) {
				dataLoopCounter++;
			}
			displacementVal.push( 1 );
			colorsVal.push(new THREE.Vector4( 1.0, Math.random(), 1.0, 1.0 ));
		}
	}

	return networkPolygonVerticesArray, displacementVal, colorsVal;
}

/**
* places spheres on vertices with radius based on data array passed as args
*
*	@param verticesArray  : Array = the 3D Object vertices array
*	@param radiusDataArray: Array = the data array that will determine the spehere radius
*	@param minValue				: Int = min sphere radius
*	@param maxValue 			: Int = max sphere radius
**/
function addSphereOnVertex(verticesArray, radiusDataArray, minValue, maxValue) {

	var minRadius = minValue || 0.2,
			maxRadius = maxValue || 5;

	scene.remove(vMeshParent);

	vMeshParent = new THREE.Object3D();
	vMeshParent.name = 'Alfio';

	for(var ii = 0; ii < verticesArray.length; ii++) {
		
		if(verticesArray[ii].parentID !== 'undefined') {
			var parentId = verticesArray[ii].parentID;
			var vSphereRadius = radiusDataArray[parentId]['audience'] / 1000;

			if(vSphereRadius < minRadius) {
				vSphereRadius = minRadius;
			} else if(vSphereRadius > maxRadius) {
				vSphereRadius = maxRadius;
			}
		} else {
			var vSphereRadius = 2;
		}

		var vSphere 		  = new THREE.SphereGeometry( vSphereRadius, 32, 32 );
		var vMaterial 	  = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
		vMesh 			 		  = new THREE.Mesh( vSphere, vMaterial );
		vMesh.position.x  = verticesArray[ii].x;
		vMesh.position.y  = verticesArray[ii].y;
		vMesh.position.z  = verticesArray[ii].z;
		vMesh.name 		 	  = 'vMesh' + ii;
		vMesh.text 				= '';
		vMesh.sentiment 	= '';
		vMesh.audience 		= radiusDataArray[parentId]['audience'];
		vMesh.age 				= '';
		vMesh.user 				= '';
		vMeshParent.add(vMesh);
	}
	scene.add(vMeshParent);
}

init();

window.onload = animate();

/*
* INIT NETWORK GRAPH
*/
SOCKET.on('query-init-response', function(response) {

	scene.remove(sphere);

	var updateG 		  	= new THREE.SphereGeometry(0.001, 5, 5);
	var updateGMaterial = new THREE.MeshBasicMaterial( {color: 0xff5500} );
	var updateG 			  = new THREE.Mesh( updateG, updateGMaterial );
	scene.add(updateG);

	// generate new geometry
	var resolution = 0;
	var radius = 30;
	networkPoly = augmentIcosaResolution(networkPoly, response.length, radius, resolution);
	
	// displace vertices
	var attributes = {
		displacement 	: { type : 'f', value : [] },
		attribColors 	: { type : 'v4', value : [] }
	}
	
	// displacement array 
	var displacementValues 	= attributes.displacement.value;
	var colorValues 				= attributes.attribColors.value;
	
	distributeVertices(networkPoly.vertices, response, 'influence', displacementValues, colorValues);
	addSphereOnVertex(networkPoly.vertices, response);

	uniforms =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  				: { type: 'c',  value: new THREE.Color( 0xffffff ) },
				'emissive' 				: { type: 'c',  value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  				: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 			: { type: 'f',  value: 0.2 },
				'cameraPosY' 			: { type: 'f',  value: 0.2 },
				'cameraPosZ' 			: { type: 'f',  value: 0.2 },
				'age_amplitude'		: { type: 'f',  value: 0 }
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true
	});

	var wireframeMateial = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, wireframeLinewidth: 1.5 } );

	networkPoly.computeFaceNormals();
	networkPoly.computeVertexNormals();
	networkPoly.verticesNeedUpdate 			= true;
	networkPoly.elementsNeedUpdate 			= true;
	shaderMaterial.side 								= THREE.DoubleSide;
	shaderMaterial.needsUpdate 					= true;
	attributes.displacement.needsUpdate = true;

	// add geometry to scene
	sphere2 = THREE.SceneUtils.createMultiMaterialObject( networkPoly, [ shaderMaterial, wireframeMateial] );
	scene.add(sphere2);

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	animate();
	
	SOCKET.emit('query-init-completed');
});

/*
* AUGMENT NETWORK GRAPH WITH STREAMING DATA
*/
SOCKET.on('streaming-response', function(response) {

	var radius 			= 30,
			resolution 	= 0;

	// case 1: response.length <= networkPoly.vertices.length
	if(response.length <= networkPoly.vertices.length) {

		// distribute vertices of updated data objects array
		var attributes = {
			displacement : { type : 'f',  value : [] },
			attribColors : { type : 'v4', value : [] }
		}

		// updated uniforms here
		// age animation has to continue when streaming
		var displacementValues 	= attributes.displacement.value;
		var colorValues 				= attributes.attribColors.value;
		distributeVertices(networkPoly.vertices, response, 'influence', displacementValues, colorValues);
		addSphereOnVertex(networkPoly.vertices, response);

		// update geometry
		networkPoly.computeFaceNormals();
		networkPoly.computeVertexNormals();
		networkPoly.verticesNeedUpdate 			= true;
		networkPoly.elementsNeedUpdate 			= true;
		attributes.displacement.needsUpdate = true;

	} else {
		console.log('We need to updated the geometry resolution');
		
		/*
		// remove old geometry


		// generate new geometry
		var attributes = {
			displacement : { type : 'f',  value : [] },
			attribColors : { type : 'v4', value : [] }
		}

		// updated uniforms here
		// age animation has to continue when streaming

		var displacementValues 	= attributes.displacement.value;
		var colorValues 				= attributes.attribColors.value;
		networkPoly = augmentIcosaResolution(networkPoly, response.length, radius, resolution);
		distributeVertices(networkPoly.vertices, response, 'influence', displacementValues, colorValues);
		addSphereOnVertex(networkPoly.vertices, response);

		// update geometry
		networkPoly.computeFaceNormals();
		networkPoly.computeVertexNormals();
		networkPoly.verticesNeedUpdate 			= true;
		networkPoly.elementsNeedUpdate 			= true;
		attributes.displacement.needsUpdate = true;	
		*/
	}

	SOCKET.on('query-stopped', function() {
		console.log('stop query');
		scene.remove(sphere2);
		scene.remove(vMeshParent);
		// reset camera + axis
	});
});