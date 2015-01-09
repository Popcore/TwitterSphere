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
	
	console.log('inside=> ' + self.vertices.length);

	if(self.vertices.length > dataLength) {
		console.log('done');
		return self;
	} else {
		++currentRes;
		return augmentIcosaResolution(self, dataLength, radius, currentRes);
	}
}

function distributeVertices(icosaVerticesArray, dataDistribution) {
	// pass
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

	for (var v = 0; v < poly.vertices.length; v++) {
		if(v < response.length) {
			console.log(response[v]['audience']);
			poly.vertices[v]['x'] = poly.vertices[v]['x'] + response[v]['audience'];
			poly.vertices[v]['z'] = poly.vertices[v]['z'] + response[v]['age'];
		} else {
			poly.vertices[v]['x'] = 0;
		}
		values.push( Math.random() * 5);
	}

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


	

	//geo.computeCentroids();
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