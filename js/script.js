var propLeft = -169;
var propRight = 80;
var propBack = 196;
var propFront = -53;
var propHeight = 63;
var droneMaterial = new THREE.MeshPhongMaterial( { color: 0x555555, specular: 0x111111, shininess: 200 } );

var container, stats;

var camera, controls, scene, renderer;
var droneBodyGeom, dronePropRGeom, dronePropLGeom;
var drone;

function Drone(position, scale, scene) {
    this.droneBody = new THREE.Mesh( droneBodyGeom, droneMaterial );

    this.droneBody.position.set(position);
    this.droneBody.rotation.set( 0, - Math.PI / 2, 0 );
    this.droneBody.scale.set(scale, scale, scale);

    this.droneBody.castShadow = true;
    this.droneBody.receiveShadow = true;

    this.dronePropL1 = new THREE.Mesh( dronePropLGeom, droneMaterial );

    this.dronePropL1.position.set(position.add(new THREE.Vector3(propLeft * scale, propHeight, propBack * scale)));
    this.dronePropL1.rotation.set( 0, - Math.PI / 2, 0 );
    this.dronePropL1.scale.set(scale, scale, scale);

    this.dronePropL1.castShadow = true;
    this.dronePropL1.receiveShadow = true;


    this.dronePropL2 = new THREE.Mesh( dronePropLGeom, droneMaterial );

    this.dronePropL2.position.set(position.add(new THREE.Vector3(propRight * scale, propHeight, propFront * scale)));
    this.dronePropL2.rotation.set( 0, - Math.PI / 2, 0 );
    this.dronePropL2.scale.set(scale, scale, scale);

    this.dronePropL2.castShadow = true;
    this.dronePropL2.receiveShadow = true;


    this.dronePropR1 = new THREE.Mesh( dronePropRGeom, droneMaterial );

    this.dronePropR1.position.set(position.add(new THREE.Vector3(propLeft * scale, propHeight, propFront * scale)));
    this.dronePropR1.rotation.set( 0, - Math.PI / 2, 0 );
    this.dronePropR1.scale.set(scale, scale, scale);

    this.dronePropR1.castShadow = true;
    this.dronePropR1.receiveShadow = true;


    this.dronePropR2 = new THREE.Mesh( dronePropRGeom, droneMaterial );

    this.dronePropR2.position.set(position.add(new THREE.Vector3(propRight * scale, propHeight, propBack * scale)));
    this.dronePropR2.rotation.set( 0, - Math.PI / 2, 0 );
    this.dronePropR2.scale.set(scale, scale, scale);

    this.dronePropR2.castShadow = true;
    this.dronePropR2.receiveShadow = true;

    this.droneBody.add(this.dronePropR1, this.dronePropR2, this.dronePropL1, this.dronePropL2);

    scene.add(this.droneBody);
    scene.add(this.dronePropR1);
    scene.add(this.dronePropR2);
    scene.add(this.dronePropL1);
    scene.add(this.dronePropL2);
}

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100 );
    camera.position.set( 0, 2.5, 5 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6699ff);
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );


    // Ground

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 100, 100 ),
        new THREE.MeshPhongMaterial( { color: 0x559955, specular: 0x101010 } )
    );
    plane.rotation.x = -Math.PI/2;
    plane.position.y = 0;
    scene.add(plane);

    plane.receiveShadow = true;

    // ASCII file

    var loader = new THREE.STLLoader();
    loader.load( 'models/droneBody.stl', function ( geometry ) {
        droneBodyGeom = geometry;

        loader.load( 'models/dronePropL.stl', function ( geometry ) {
            dronePropLGeom = geometry;

            loader.load( 'models/dronePropR.stl', function ( geometry ) {
                dronePropRGeom = geometry;

                drone = new Drone(new THREE.Vector3(0, 1, 0), 0.01, scene);
            } );
        } );
    } );

    // Lights

    scene.add( new THREE.HemisphereLight( 0xffffff, 0x111122 ) );

    addShadowedLight( 10, 10, 10, 0x101010, 1.5 );
    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // remove when using animation loop
    // enable animation loop when using damping or autorotation
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    container.appendChild( renderer.domElement );

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );

    // while (dronePropRGeom === undefined) {}
}

function addShadowedLight( x, y, z, color, intensity ) {

    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    directionalLight.castShadow = true;

    var d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    directionalLight.shadow.bias = -0.005;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update();

    render();
    stats.update();

}

function render() {

    renderer.render( scene, camera );

}