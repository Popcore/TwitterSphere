var animation = null,
		container,
		elemCounter = 0,
		sidebar,
		headerElem,
		renderer,
		axisRenderer,
		scene,
		axisScene,
		camera,
		mesh,
		parentMesh,
		parentOrbitMesh,
		parentRetweetConnections,
		sphere,
		controls,
		mouseVector = new THREE.Vector3(),
		raycaster = new THREE.Raycaster(),
		directionalLight,
		intersected = {},
		networkPoly = {},
		fov 	= 0,
		cameraNear = 1,
		cameraFar = 10000,
		frame = 0,
		vv = new THREE.Vector3(), // use for mouse projection
		intersectionObj = undefined, // mouse intersection object
	  currentColorR 	= 0,
		currentColorG 	= 0,
		currentColorB 	= 0,
		objHasOriginalColor = true;

function init() {
	container 		= document.getElementById('container');
	axisContainer = document.getElementById('axis-container');
	sidebar       = document.getElementById('sidebar');
	headerElem	  = document.getElementById('top-header');
	scene 				= new THREE.Scene();
	axisScene 		= new THREE.Scene();
	aspectRatio   = container.offsetWidth / container.offsetHeight;
	fov 					= 2 * Math.atan( ( container.offsetWidth/aspectRatio ) / ( 2 * 500 ) ) * ( 180 / Math.PI );
	camera 				= new THREE.PerspectiveCamera(
		fov,
		aspectRatio,
		cameraNear,
		cameraFar );
	camera.position.z = 500;
	camera.target = new THREE.Vector3( 0, 0, 0 );
	scene.add( camera );

	// mouse control
	controls 		 = new THREE.TrackballControls( camera, container );
	controls.addEventListener( 'change', render );

	// center
	var geometry = new THREE.IcosahedronGeometry(20, 0);
	var materal  = new THREE.MeshLambertMaterial(
		{ color: 0x0000ff, 
			shading: THREE.FlatShading 
		} 
	);
	var sphere1   		 = new THREE.Mesh( geometry, materal );
	sphere1.position.x =  0;
	sphere1.position.y = 0;
	scene.add(sphere1);

	// tweets parent mash
	parentMesh = new THREE.Object3D();
	scene.add( parentMesh );

	// orbits parent mesh
	parentOrbitMesh = new THREE.Object3D();
	scene.add( parentOrbitMesh );

	// retweet connection
	parentRetweetConnections = new THREE.Object3D();
	scene.add( parentRetweetConnections );

	// light 
	var light    = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );

	directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, -1, 1).normalize();
  scene.add( directionalLight );  

  scene.updateMatrixWorld(true);
 
	// renderer 
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize( container.offsetWidth, container.offsetHeight );
	renderer.setClearColor(0x00000a, 1); 
	container.appendChild( renderer.domElement ); 

};

function render() {
	renderer.render( scene, camera );
}

function animate() {
	animation = requestAnimationFrame(function() {
		animate();
	});
	controls.update();
	updateTweetsAndOrbitPosition( parentMesh.children, parentOrbitMesh.children );
	render();

	// update light position
	directionalLight.position.x = camera.position.x;
	directionalLight.position.y = camera.position.y;
	directionalLight.position.z = camera.position.z;
	directionalLight.updateMatrix();
  directionalLight.updateMatrixWorld();  
}

// track mouse movement
// change color on hover
window.addEventListener('mousemove', onMouseMove, false);
function onMouseMove(ev) {
	var sidebarWidth  	= sidebar.offsetWidth,
			headerHeight  	= headerElem.offsetHeight;
			

	mouseVector.x = (2 * ( (ev.clientX - sidebarWidth) / container.offsetWidth) - 1); // sidebar
	mouseVector.y = (1 - 2 * ( (ev.clientY - headerHeight)/ container.offsetHeight )); // headerElem

	vv.set( mouseVector.x , mouseVector.y, 0.5 ); // z = 0.5 important!
	vv.unproject( camera );
	raycaster.set( camera.position, vv.sub( camera.position ).normalize() );
	var intersects = raycaster.intersectObjects( parentMesh.children, true );
	var intersectsLength = intersects.length;

	if(intersectsLength > 0) {
		for( var i = 0; i < intersectsLength; i++) {
			var intersection = intersects[0];

			intersectionObj 	= intersection.object;
			intersectionObjId = intersectionObj.id;

			if( intersectionObj ) {
				if( objHasOriginalColor == true ) {
					currentColorR 	= intersectionObj.material.color.r,
					currentColorG 	= intersectionObj.material.color.g,
					currentColorB 	= intersectionObj.material.color.b;

					intersected = { objID :intersectionObjId, R: currentColorR, G: currentColorG, B: currentColorB }
					
					intersectionObj.material.color.setRGB(1.0 - i / intersects.length, 1.0, 1.0);
					objHasOriginalColor = false; 
					SOCKET.emit('tweet-selected', intersectionObj);
				} else {
					// RESET?
					//scene.getObjectById(intersected.objID).material.color.setRGB(intersected.R, intersected.G, intersected.B);
					//objHasOriginalColor = true; 
				}
			} 
		}
	}

	if(intersectionObj && intersectsLength == 0) {
		if(intersected.objID !== 'undefined') {
			scene.getObjectById(intersected.objID).material.color.setRGB(intersected.R, intersected.G, intersected.B);
			objHasOriginalColor = true; 
		}
	}
}

// Set initial tweet object position in space
function initTweetObjPosition() {
	var radius = 200,
			step   = 360/(Math.random() * 360),
			initialPosition = {};

	initialPosition.posX = Math.cos(step) * radius;
	initialPosition.posY = Math.sin(step) * radius;

	return initialPosition;
}

// Update tweet position and expand its orbit
function updateTweetsAndOrbitPosition(tweetsObj, orbitsObj) {
	var tweetsCounter = tweetsObj.length,
			orbitsCounter = orbitsObj.length,
			position 			= new THREE.Vector3();

	while(tweetsCounter--) {
		if( tweetsObj[tweetsCounter] ) {
			var currentTweet = tweetsObj[tweetsCounter],
					currentOrbit = orbitsObj[tweetsCounter];

			currentTweet.translateZ( -0.2 );

			if( currentOrbit !== undefined ) {
				currentOrbit.scale.x = currentOrbit.scale.x + 0.001;
				currentOrbit.scale.y = currentOrbit.scale.y + 0.001;
				currentOrbit.scale.z = currentOrbit.scale.z + 0.001;
			}
			
			if(Math.abs(currentTweet.position.x) > 1000) {
				console.log('remove');
				parentMesh.remove( currentTweet );
				parentOrbitMesh.remove( currentOrbit );
			}
		}
	}

	// update retweet connections
	var retweetLinesCounter = parentRetweetConnections.children.length
	while( retweetLinesCounter-- ) {
		parentRetweetConnections.children[retweetLinesCounter].geometry.verticesNeedUpdate = true;
	}
}

function linkRetweets(tweetsObj, tweetsList) {
	var tweetsCounter = tweetsList.length,
			tweetsObjRetweetID = tweetsObj.userData.retweetted_id;

	if(tweetsObjRetweetID !== undefined) {
		while(tweetsCounter--) {

			if(tweetsObjRetweetID === tweetsList[tweetsCounter].userData['tweet_id']) {

				// display line to connet tweets
				var material 						= new THREE.LineBasicMaterial({ color: 0xffffff }),
						lineGeometry 				= new THREE.Geometry();
						originalTweetRadius = tweetsList[tweetsCounter].userData['radius'];

				console.log(originalTweetRadius);

				lineGeometry.vertices.push(tweetsObj.position);
				lineGeometry.vertices.push(tweetsList[tweetsCounter].position);

				var line = new THREE.Line(lineGeometry, material);
				parentRetweetConnections.add(line);
				
				break;
			}
		}
	}
}

// set tweet color based on sentiment
function setTweetObjColor(sentiment, THREEColor) {
	switch( sentiment ) {
		case 'neutral':
			THREEColor.setRGB(1, 0, 0);
		break;
		case 'positive':
			THREEColor.setRGB(1, 1, 0);
		break;
		case 'negative':
			THREEColor.setRGB(0, 1, 1);
		break;
		default:
			THREEColor.setRGB(1, 1, 1);
	}
}

init();

window.onload = animate();

/*
* INIT NETWORK GRAPH
*/
SOCKET.on('query-init-response', function(response) {
	scene.remove(sphere);
	animate();
	SOCKET.emit('query-init-completed');
});

SOCKET.on('query-init-response2', function(response) {
	scene.remove(sphere);
	animate();
	SOCKET.emit('query-location-init-completed');
});

/*
* AUGMENT NETWORK GRAPH WITH STREAMING DATA
*/
SOCKET.on('streaming-response', function(response) {

	var	posZ 							 = 0,
	 		radius  					 = response.audience,
	 		sentiment  				 = response['sentiment'],
	 		color   					 = new THREE.Color( 0xffffff ),
	 		tweetPosition 		 = initTweetObjPosition(),
	 		tweetObjPos 			 = new THREE.Vector3(),
			tweetObjQuaternion = new THREE.Quaternion(),
			tweetObjScale 		 = new THREE.Vector3();

	// increase element counter
	elemCounter++;

	// set tweet color
	setTweetObjColor(response['sentimentString'], color);	

	var geometry = new THREE.IcosahedronGeometry(radius, 0);
	var	materal  = new THREE.MeshLambertMaterial(
				{ color: color, 
					shading: THREE.FlatShading 
				} 
			);

	var tweetObj 			  = new THREE.Mesh( geometry, materal );
	tweetObj.name 		  = 'TweetObj_' + elemCounter;
	tweetObj.parent     = parentMesh;
	tweetObj.originalColor 				 = color; 
	tweetObj.userData['tweet_id']  = response.tweetID;
	tweetObj.userData['radius']  	 = response.audience;
	tweetObj.userData['text'] 		 = response['text'];
	tweetObj.userData['followers'] = response['followers'];
	tweetObj.userData['hashtags']  = response['hashtags'];
	tweetObj.userData['retweetted_id'] = response.retweetted_ID.id || undefined;
	tweetObj.position.set( tweetPosition.posX, tweetPosition.posY, posZ);
	tweetObj.lookAt( new THREE.Vector3(0, 0, 0) );
	//tweetObj.rotation.x = (Math.random() * 360) * (Math.PI * 180);
	parentMesh.add(tweetObj);

	linkRetweets(tweetObj, parentMesh.children);

	// orbit
	var circleMaterial = new THREE.LineBasicMaterial({
		color 			: 0xffffff,
		transparent : true,
		linewidth   : 0.5,
		opacity 		: 0.5
	});
	var circleRadius 	 = 200;
	var circleSegments = 72;
	var circleGeometry = new THREE.CircleGeometry( circleRadius, circleSegments );		
	// Remove center vertex
	circleGeometry.vertices.shift();		

	var circle = new THREE.Line( circleGeometry, circleMaterial );
	circle.lookAt(0, 0, 0);
	
	// set circle position and rotation accordint to tweet obj
	tweetObj.matrixWorld.decompose( tweetObjPos, tweetObjQuaternion, tweetObjScale);
	//circlePos.setFromMatrixPosition( tweetObj.matrixWorld );
	tweetObj.updateMatrixWorld( true );

	circle.quaternion.copy( tweetObjQuaternion );
	circle.position.copy( tweetObjPos );
	//circle.position.x = circlePos.x;
	//circle.position.y = circlePos.y;
	//circle.position.z = circlePos.z;
	parentOrbitMesh.add( circle );

});


/*
* STOP QUERY AND RESET DATA
*/
SOCKET.on('query-stopped', function() {

	console.log('stop query');
	console.log( parentMesh );
	scene.remove( parentMesh );
	// reset camera + axis
});