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

	// displacement attributes
	// the array is expected to have a one to one 
	// relationship with the mesh vertices
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
	sphere = new THREE.Mesh( new THREE.IcosahedronGeometry(20, 0), shaderMaterial );

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

	sphere.geometry.dynamic = true;
	
	// populate array of attributes
	var vertices = sphere.geometry.vertices;
	var faces = sphere.geometry.faces;
	var values = attributes.displacement.value;

	for (var v = 0; v < vertices.length; v++) {
		values.push( Math.random() * 30 );
	}

	console.log('original vertices array => ' + sphere.geometry.vertices.length);

	// upadte verices array
	
	shaderMaterial.needsUpdate = true;

	scene.add(sphere);

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

init();
animate();

SOCKET.on('query-init-response', function(response) {

	tweetData.push('data-goes-here-yo');

	scene.remove(sphere);

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
				'cameraPosZ' 			: { type: 'f', value: 0.0 },
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

	sphere = new THREE.Mesh( new THREE.IcosahedronGeometry(20, 0), shaderMaterial );
	sphere.geometry.dynamic = true;

	// foreach tweet push new vertices
	for(var ii = 0; ii < 200; ii++) {
		sphere.geometry.vertices.push(
			new THREE.Vector3( -10,  10, 0 ),
			new THREE.Vector3( -10, -10, 0 ),
			new THREE.Vector3(  10, -10, 0 )
		);

		sphere.geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
	}
	
	var values = attributes.displacement.value;

	for (var v = 0; v < sphere.geometry.vertices.length; v++) {
		values.push( Math.random() * 30 );
	}

	console.log('updated vertices array => ' + sphere.geometry.vertices.length);

	// add sphere
	sphere.geometry.verticesNeedUpdate = true;
	sphere.geometry.elementsNeedUpdate = true;
	shaderMaterial.needsUpdate = true;
	attributes.displacement.needsUpdate = true;
	scene.add(sphere);


	controls.addEventListener( 'change', function() {
		uniforms.cameraPosX.value = camera.position.x/50;
		uniforms.cameraPosY.value = camera.position.y/20;
		uniforms.cameraPosZ.value = camera.position.z/50;
	});

	render();
});