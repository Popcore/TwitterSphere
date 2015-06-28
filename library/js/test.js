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
		parentMesh2,
		sphere,
		controls,
		projector,
		directionalLight,
		mouse = new THREE.Vector2(),
		raycaster = new THREE.Raycaster(),
		INTERSECTED,
		start = Date.now(),
		networkPoly = {},
		fov 	= 0,
		cameraNear = 1,
		cameraFar = 100000,
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
	parentMesh2 = new THREE.Object3D();
	scene.add( parentMesh );
	scene.add( parentMesh2 );

	// subdivide container in bands 
	// for tweetObj positioning based on sentiment
	var bandWidth 	 = container.offsetWidth/3;
	var halfWidth    = container.offsetWidth/2;
	neutralPosXBand  = bandWidth - halfWidth;
	positivePosXBand = ( bandWidth * 2 )- halfWidth;
	negativePosXBand = halfWidth * -1;

	// line
	var material = new THREE.LineBasicMaterial({ color: 0xffffff }),
	lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push(new THREE.Vector3(-10, 0, 0));
	lineGeometry.vertices.push(new THREE.Vector3(0, 10, 0));
	//lineGeometry.vertices.push(new THREE.Vector3(10, 0, 0));

	var line = new THREE.Line(lineGeometry, material);
	scene.add(line);

	var geometry = new THREE.IcosahedronGeometry(20, 0);
	var materal  = new THREE.MeshLambertMaterial(
		{ color: 0x0000ff, 
			shading: THREE.FlatShading 
		} 
	);


	var g = new THREE.IcosahedronGeometry(5, 0);
	var sphere0   = new THREE.Mesh( geometry, materal );
	sphere0.position.x = -480;
	sphere0.position.y = 0;
	scene.add(sphere0);

	var sphere1   = new THREE.Mesh( geometry, materal );
	sphere1.position.x =  bandWidth - halfWidth;
	sphere1.position.y = 0;
	scene.add(sphere1);

	function makeMash(posX, posY, geometry, materal, index) {
		var sss = new THREE.Mesh( geometry, materal );
		sss.position.x = posX;
		sss.position.y = posY;
		sss.name = "objectName" + index;
		sss.lookAt( new THREE.Vector3(0, 0, 0) );


		// circle
		var circleMaterial = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});
		var circleRadius = 200;
		var circleSegments = 64;
		var circleGeometry = new THREE.CircleGeometry( circleRadius, circleSegments );				
		var circle = new THREE.Line( circleGeometry, circleMaterial );
		// Remove center vertex
		circleGeometry.vertices.shift();
		circle.position.x = 0;
		circle.position.y = 0;
		circle.lookAt( new THREE.Vector3(0, 0, 0) );
		circle.name = "circleName" + index;
		parentMesh2.add( circle );

		parentMesh2.add(sss);
	}

	for(var i = 0; i <= 10; i++) {
		
		var step = 360/10;
		var radius = 200;
		var materal  = new THREE.MeshLambertMaterial(
			{ color: 0x00ffff, 
				shading: THREE.FlatShading 
			} 
		);
		posX = Math.cos(step * i) * radius;
		posY = Math.sin(step * i) * radius;

		makeMash(posX, posY, geometry, materal, i);
		
	}

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
var j = 0;
function animate() {
	animation = requestAnimationFrame(function() {
		animate();
	});
	controls.update();

	for(var i = 0; i <= 10; i++) {
		var object = parentMesh2.getObjectByName( "objectName" + i);
		var orbit  = parentMesh2.getObjectByName( "circleName" + i);
		//object.translateX( 0.1 );
		object.translateZ( -0.2 );

		orbit.scale.x = orbit.scale.x + 0.001;
		orbit.scale.y = orbit.scale.y + 0.001;
		orbit.scale.z = orbit.scale.z + 0.001;
	}

	render();

	// update light position
	directionalLight.position.x = camera.position.x;
	directionalLight.position.y = camera.position.y;
	directionalLight.position.z = camera.position.z;
	directionalLight.updateMatrix();
  directionalLight.updateMatrixWorld();  
}


init();

window.onload = animate();
