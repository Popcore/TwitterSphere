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
		// set true to enable raycaster for mouse over objs
		mouseInteraction = false,
		sphere,
		controls,
		projector,
		directionalLight,
		mouse = new THREE.Vector2(),
		raycaster = new THREE.Raycaster(),
		INTERSECTED,
		start = Date.now(),
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

	// mouse control
	controls 		 = new THREE.TrackballControls(camera, container);
	controls.addEventListener( 'change', render );

	// parent mash
	parentMesh = new THREE.Object3D();
	scene.add( parentMesh );

	// sphere 1
	var geometry = new THREE.IcosahedronGeometry(20, 0);
	var materal  = new THREE.MeshLambertMaterial(
		{ color: 0xffffff, 
			shading: THREE.FlatShading 
		} 
	);
	sphere   = new THREE.Mesh( geometry, materal );
	sphere.geometry.dynamic = true;
	scene.add(sphere);

	// light 
	var light    = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );

	directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, -1, 1).normalize();
  scene.add( directionalLight );
 
	// renderer 
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

	// update light position
	directionalLight.position.x = camera.position.x;
	directionalLight.position.y = camera.position.y;
	directionalLight.position.z = camera.position.z;
	directionalLight.updateMatrix();
  directionalLight.updateMatrixWorld();  
}

function updateTweetsPosisiton(tweetsObj) {
	var nowTimestamp = Date.now(),
			counter = tweetsObj.length;

	while(counter--) {
		tweetsObj[counter].posZ = (nowTimestamp - tweetsObj[counter][age]) / 1000;
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
	

	var posX 		 = response.audience + Math.random() * 100,
			// posX 		 = response[sentiment] + Math.random() * 10,
	 		posY 		 = Math.random() * 100,
	 		posZ 		 = Math.random() * 100,
	 		radius   = response.audience,
	 		red 		 = Math.random() * 255,
	 		green 	 = Math.random() * 255,
	 		blue 		 = Math.random() * 255,
	 		color    = new THREE.Color('rgb(' + red + ',' + green + ',' +  blue + ')');

	elemCounter++;

	console.log(radius);

	var geometry = new THREE.IcosahedronGeometry(radius, 0);
	var	materal  = new THREE.MeshLambertMaterial(
				{ color: color, 
					shading: THREE.FlatShading 
				} 
			);

	var tweetObj 			  = new THREE.Mesh( geometry, materal );
	tweetObj.name 		  = 'TweetObj_' + elemCounter;
	tweetObj.parent     = parentMesh;
	tweetObj.position.set(posX, posY, posZ);
	tweetObj.rotation.x = (Math.random() * 360) * (Math.PI * 180);
	parentMesh.add(tweetObj);

});

/*
* STOP QUERY AND RESET DATA
*/
SOCKET.on('query-stopped', function() {

	console.log('stop query');
	console.log( scene );
	scene.remove( parentMesh );
	// reset camera + axis
});