var container, 
		renderer,
		scene,
		camera,
		mesh,
		controls,
		start = Date.now(),
		dirLight,
		ambientLight,
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

	// add light
	/* ?????? ARE THESE LIGHTS DOING ANYTHING? ?????? */
	dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( camera.position.x, camera.position.y, camera.position.z ).normalize();
  scene.add( dirLight );

  dirLight2 = new THREE.DirectionalLight( 0xffffff );
  dirLight2.position.set( 10, 0, -10 ).normalize();
  scene.add( dirLight2 );

  dirLight3 = new THREE.AmbientLight( 0x404040 );;
  dirLight3.position.set( -50, -20, 0 ).normalize();
  scene.add( dirLight3 );

	// displacement attributes
	// the array is expected to have a one to one 
	// relationship with the mesh vertices
	var attributes = {
		displacement: { type : 'f', value : [] }
	}
	var lambertShader = THREE.ShaderLib['lambert'];
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

	// material
	// openGL vertex and fragment shader
	var shaderMaterial = new THREE.ShaderMaterial({
		attributes 			: attributes,
		uniforms 				: uniforms,
		vertexShader		: document.getElementById('vertexShader').textContent,
		fragmentShader	: document.getElementById('fragmentShader').textContent,
		lights					: true,
	});

	// add sphere
	var sphere = new THREE.Mesh( new THREE.IcosahedronGeometry(20, 0), shaderMaterial );

	// populate array of attributes
	var vertices = sphere.geometry.vertices;
	var faces = sphere.geometry.faces;

	// push new vertices and faces here
	sphere.geometry.vertices.push(
		// 1		
		new THREE.Vector3( -10,  10, 0 ),
		new THREE.Vector3( -10, -10, 0 ),
		new THREE.Vector3(  10, -10, 0 ),
		// 2
		new THREE.Vector3( -10,  10, 0 ),
		new THREE.Vector3( -10, -10, 0 ),
		new THREE.Vector3(  10, -10, 0 )
	);
	// 1
	sphere.geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
	// 2
	sphere.geometry.faces.push( new THREE.Face3( 3, 4, 5 ) );

	var values = attributes.displacement.value;

	console.log("faces.length = " + faces.length);
	console.log("vertices.length = " + vertices.length);

	for (var v = 0; v < vertices.length; v++) {
		values.push( Math.random() * 30 );
	}
	// upadte verices array
	sphere.geometry.verticesNeedUpdate;

	shaderMaterial.needsUpdate = true;

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

	scene.add(sphere);

	container.appendChild( renderer.domElement ); 

	render();

};

function animate() {
	requestAnimationFrame( animate );
	controls.update();
}

function render() {
	renderer.render( scene, camera);
}

init();
animate();