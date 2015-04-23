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
		sphere,
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
	controls = new THREE.TrackballControls(camera, container);
	controls.addEventListener( 'change', render );

	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	// shader
	var attributes = {
		displacement : { type : 'f', value : [] },
		attribColors : { type : 'v4', value : [] }
	}
	uniforms 			 =  THREE.UniformsUtils.merge([
			THREE.UniformsLib[ 'lights' ],
			{
				'ambient'  		: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'emissive' 		: { type: 'c', value: new THREE.Color( 0xffffff ) },
				'wrapRGB'  		: { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) },
				'cameraPosX' 	: { type: 'f', value: 0.0 },
				'cameraPosY' 	: { type: 'f', value: 0.0 },
				'cameraPosZ' 	: { type: 'f', value: 0.0 },
			}
	]);

	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true,
	});

	// sphere 1
	sphere = new THREE.Mesh( new THREE.IcosahedronGeometry(20, 0), shaderMaterial );
	sphere.geometry.dynamic = true;
	
	// populate array of attributes
	var vertices 	= sphere.geometry.vertices;
	var faces 		= sphere.geometry.faces;

	vMeshParent = new THREE.Object3D();

	// vertices color
	for (var v = 0; v < vertices.length; v++) {

		var vSphere 		 = new THREE.SphereGeometry(5, 32, 32);
		var vMaterial 	 = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		var vMesh 			 = new THREE.Mesh( vSphere, vMaterial );
		vMesh.position.x = vertices[v].x;
		vMesh.position.y = vertices[v].y;
		vMesh.position.z = vertices[v].z;
		vMesh.name 		 	 = 'vMesh' + v;
		vMeshParent.add(vMesh);

		attributes.displacement.value.push( Math.random() * 30 );
		var red 	= Math.random();
	  var green = Math.random();
	  var blue 	= Math.random();
	  var alpha = 1;
	  attributes.attribColors.value.push( new THREE.Vector4( red, green, blue, alpha ));
	}

	scene.add(vMeshParent);

	// update verices array
	shaderMaterial.needsUpdate = true;

	scene.add(sphere);

	// add axis
	var debugaxis = function(axisLength){
    // Shorten the vertex function
    function v(x,y,z){ 
      return new THREE.Vector3(x,y,z); 
    }
    
    // Create axis (point1, point2, colour)
    function createAxis(p1, p2, color){
      var line, lineGeometry = new THREE.Geometry(),
      lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
      lineGeometry.vertices.push(p1, p2);
      line = new THREE.Line(lineGeometry, lineMat);
      axisScene.add(line);
    }
    
    createAxis(v(-60, 0, 0), v(60, 0, 0), 0xFF0000); // R
    createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00); // G
    createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF); // B
	};
	// To use enter the axis length
	debugaxis(50);

	// sentiment label
	var label1Canvas 				= document.createElement('canvas');
	var label1Context 			= label1Canvas.getContext('2d');
	label1Context.font 			= '13px Helvetica';
	label1Context.fillStyle = 'rgba(255, 0, 0, 1)';
	label1Context.fillText('sentiment', 170, 69);
	var label1Texture 			= new THREE.Texture(label1Canvas);
	label1Texture.needsUpdate = true;
	var label1Material 			= new THREE.MeshBasicMaterial({ map: label1Texture, side: THREE.DoubleSide });
	label1Material.transparent = true;
	var mesh1 							= new THREE.Mesh( new THREE.PlaneGeometry(label1Canvas.width, label1Canvas.height), label1Material);
	mesh1.position.set(0, 0, 0);
	axisScene.add(mesh1);

	// influence label
	var label2Canvas 				= document.createElement('canvas');
	var label2Context 			= label1Canvas.getContext('2d');
	label2Context.font 			= '13px Helvetica';
	label2Context.fillStyle = 'rgba(0, 255, 0, 1)';
	label2Context.fillText('influence', 120, 23);
	var label2Texture 			= new THREE.Texture(label2Canvas);
	label2Texture.needsUpdate = true;
	var label2Material 			= new THREE.MeshBasicMaterial({ map: label2Texture, side: THREE.DoubleSide });
	label2Material.transparent = true;
	var mesh2 							= new THREE.Mesh( new THREE.PlaneGeometry(label2Canvas.width, label2Canvas.height), label2Material);
	mesh2.position.set(0, 0, 0);
	axisScene.add(mesh2);

	// age label
	var label3Canvas 				= document.createElement('canvas');
	var label3Context 			= label3Canvas.getContext('2d');
	label3Context.font 			= '13px Helvetica';
	label3Context.fillStyle = 'rgba(0, 0, 255, 1)';
	label3Context.fillText('age', 100, 69);
	var label3Texture 			= new THREE.Texture(label3Canvas);
	label3Texture.needsUpdate = true;
	var label3Material 			= new THREE.MeshBasicMaterial({ map: label3Texture, side: THREE.DoubleSide });
	label3Material.transparent = true;
	var mesh3 							= new THREE.Mesh( new THREE.PlaneGeometry(label3Canvas.width, label3Canvas.height), label3Material);
	mesh3.position.set(0, 0, 0);

	var parent 							= new THREE.Object3D();
	mesh3.applyMatrix( new THREE.Matrix4().makeRotationY( Math.PI ));
	parent.add(mesh3);
	parent.rotation.y 			= Math.PI/2;
	parent.position.set(0, 0, 0);
	axisScene.add(parent)

	// track mouse position
	projector = new THREE.Projector();
	window.onload = document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	// renderer 1
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	//renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( container.offsetWidth, container.offsetHeight );
	renderer.setClearColor(0x00000a, 1); 
	container.appendChild( renderer.domElement ); 

	// axis renderer
	axisRenderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	axisRenderer.setSize( 100, 100 );
	axisRenderer.setClearColor( 0xffffff, 1); 
	axisContainer.appendChild( axisRenderer.domElement ); 
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
	axisRenderer.render( axisScene, camera );
}

function animate() {
	if(typeof uniforms.age_amplitude !== 'undefined') {
		if(uniforms.age_amplitude.value > -1) {
			uniforms.age_amplitude.value = uniforms.age_amplitude.value - frame;
		}
		frame += 0.0005;
	}

	animation = requestAnimationFrame( animate );
	controls.update();
	render();

	if(mouseInteraction == true) {
		update();
	}
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