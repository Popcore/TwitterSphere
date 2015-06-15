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
		sphere,
		controls,
		mouseVector = new THREE.Vector3(),
		raycaster = new THREE.Raycaster(),
		directionalLight,
		INTERSECTED,
		start = Date.now(),
		networkPoly = {},
		fov 	= 0,
		cameraNear = 1,
		cameraFar = 10000,
		frame = 0,
		neutralPosXBand,
		positivePosXBand,
		negativePosXBand;

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

	// parent mash
	parentMesh = new THREE.Object3D();
	scene.add( parentMesh );

	// subdivide container in bands 
	// for tweetObj positioning based on sentiment
	var bandWidth 	 = container.offsetWidth/3;
	var halfWidth    = container.offsetWidth/2;
	neutralPosXBand  = bandWidth - halfWidth;
	positivePosXBand = ( bandWidth * 2 )- halfWidth;
	negativePosXBand = halfWidth * -1;

	// sphere 1
	var geometry = new THREE.IcosahedronGeometry(20, 0);
	var materal  = new THREE.MeshLambertMaterial(
		{ color: 0xffffff, 
			shading: THREE.FlatShading 
		} 
	);
	sphere   = new THREE.Mesh( geometry, materal );
	sphere.geometry.dynamic = true;
	sphere.rotation.x = (Math.random() * 360) * (Math.PI * 180);
	sphere.rotation.y = (Math.random() * 360) * (Math.PI * 180);

	var g = new THREE.IcosahedronGeometry(5, 0);
	var sphere0   = new THREE.Mesh( geometry, materal );
	sphere0.position.x = -480;
	sphere0.position.y = 0;
	scene.add(sphere0);

	var sphere1   = new THREE.Mesh( geometry, materal );
	sphere1.position.x =  bandWidth - halfWidth;
	sphere1.position.y = 0;
	scene.add(sphere1);

	var sphere2   = new THREE.Mesh( geometry, materal );
	sphere2.position.x = 480;
	sphere2.position.y = 0;
	scene.add(sphere2);

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

function initTweetObjPosition() {
	var radius = 200,
			step   = 360/(Math.random() * 360),
			initialPosition = {};

	initialPosition.posX = Math.cos(step) * radius;
	initialPosition.posY = Math.sin(step) * radius;

	return initialPosition;
}

function render() {
	renderer.render( scene, camera );
}

function animate() {
	animation = requestAnimationFrame(function() {
		animate();
	});
	controls.update();
	updateTweetsPosition(parentMesh.children);
	render();

	// update light position
	directionalLight.position.x = camera.position.x;
	directionalLight.position.y = camera.position.y;
	directionalLight.position.z = camera.position.z;
	directionalLight.updateMatrix();
  directionalLight.updateMatrixWorld();  
}

var vv = new THREE.Vector3(),
		intersectionObj = undefined,
		intersArr 			=	[],
	  currentColorR 	= 0,
		currentColorG 	= 0,
		currentColorB 	= 0,
		objHasOriginalColor = true;

// mouse movement and hover
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
			var intersection = intersects[i];

			intersectionObj = intersection.object;

			console.log(currentColorG);

			if( intersectionObj ) {
				if( objHasOriginalColor == true ) {
					currentColorR 	= intersectionObj.material.color.r,
					currentColorG 	= intersectionObj.material.color.g,
					currentColorB 	= intersectionObj.material.color.b;
				}

				console.log(currentColorR + '-' + currentColorG + '-' + currentColorB);
				intersectionObj.material.color.setRGB(1.0 - i / intersects.length, 1.0, 1.0);
				objHasOriginalColor = false; 
				SOCKET.emit('tweet-selected', intersectionObj);
			} else {
				console.log('no intersection');
			}
		}
	}

	if(intersectionObj && intersectsLength == 0) {
		intersectionObj.material.color.setRGB(currentColorR, currentColorG, currentColorB);
		objHasOriginalColor = true; 
	}
}

function updateTweetsPosition(tweetsObj) {
	var nowTimestamp = Date.now(),
			counter = tweetsObj.length,
			position = new THREE.Vector3();

	while(counter--) {
		if(tweetsObj[counter]) {
			// tweetsObj[counter].position.z -= 0.2;
			tweetsObj[counter].translateZ( -0.2 );
			
			if(tweetsObj[counter].position.z < -10000) {
				parentMesh.remove( tweetsObj[counter] );
				// delete tweetsObj[counter];
			}
		}
	}
}

function linkRetweets(tweetsObj, tweetsList) {
	var tweetsCounter = tweetsList.length,
			tweetsObjRetweetID = tweetsObj.userData.retweetted_id;

	if(tweetsObjRetweetID !== undefined) {
		while(tweetsCounter--) {
			console.log('retweet ID: ' + tweetsList[tweetsCounter].userData['tweet_id']);

			if(tweetsObjRetweetID === tweetsList[tweetsCounter].userData['tweet_id']) {

				// display line to connet tweets
				var material 						= new THREE.LineBasicMaterial({ color: 0xffffff }),
						lineGeometry 				= new THREE.Geometry();
						originalTweetRadius = tweetsList[tweetsCounter].userData['radius'];

				console.log(originalTweetRadius);

				lineGeometry.vertices.push(tweetsObj.position);
				lineGeometry.vertices.push(tweetsList[tweetsCounter].position);

				// enlarge original tweet mesh
				var line = new THREE.Line(lineGeometry, material);
				parentMesh.add(line);
				
				var retweetGeometry = new THREE.IcosahedronGeometry(originalTweetRadius + 20, 0);
				var	retweetMateral  = new THREE.MeshLambertMaterial(
					{ color 			: 0x0000ff, 
						shading 		: THREE.FlatShading,
						transparent : true,
						opacity 		: 0.5
					} 
				);
				var retweetOuterObj = new THREE.Mesh( retweetGeometry, retweetMateral );
				// tweetsList[tweetsCounter].add(retweetOuterObj);
				retweetOuterObj.position.set( tweetsList[tweetsCounter].position.x, tweetsList[tweetsCounter].position.y, tweetsList[tweetsCounter].position.z );
				parentMesh.add(retweetOuterObj);
				break;
			}
		}
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

/*
* AUGMENT NETWORK GRAPH WITH STREAMING DATA
*/
SOCKET.on('streaming-response', function(response) {

	var	posZ 		= 0,
	 		radius  = response.audience,
	 		sentiment = response['sentiment'],
	 		color   = new THREE.Color( 0xffffff ),
	 		bandLength = Math.abs(neutralPosXBand),
	 		tweetPosition = initTweetObjPosition();

	// set color and position bands
	switch( response['sentimentString'] ) {
		case 'neutral':
			color.setRGB(1, 0, 0);
			posX = neutralPosXBand + (Math.random() * bandLength);
		break;
		case 'positive':
			color.setRGB(1, 1, 0);
			posX = positivePosXBand + (Math.random() * bandLength);
		break;
		case 'negative':
			color.setRGB(0, 1, 1);
			posX = negativePosXBand + (Math.random() * bandLength);
		break;
		default:
			color.setRGB(1, 1, 1);
			posX = neutralPosXBand + (Math.random() * bandLength);
	}

	elemCounter++;

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
	tweetObj.position.set(tweetPosition.posX, tweetPosition.posY, posZ);
	tweetObj.rotation.x = (Math.random() * 360) * (Math.PI * 180);
	parentMesh.add(tweetObj);

	linkRetweets(tweetObj, parentMesh.children);

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