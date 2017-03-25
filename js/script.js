var propDist = 125;
var propHeight = 183.15;
var droneMaterial = new THREE.MeshPhongMaterial( { color: 0x303030, specular: 0x111111, shininess: 200 } );

var container, stats;

var camera, controls, scene, renderer;
var droneBodyGeom, dronePropRGeom, dronePropLGeom;
var drones = [];

function Drone(p, scale, scene) {
    this.flying = true;
    this.droneGroup = new THREE.Group();

    this.droneBody = new THREE.Mesh( droneBodyGeom, droneMaterial );
    this.droneBody.position.set(p.x, p.y, p.z);
    this.droneBody.scale.set(scale, scale, scale);
    this.droneBody.castShadow = true;
    this.droneBody.receiveShadow = true;

    this.dronePropR1 = new THREE.Mesh( dronePropRGeom, droneMaterial );
    this.dronePropR1.position.set(p.x - propDist * scale, p.y + propHeight * scale, p.z - propDist * scale);
    this.dronePropR1.scale.set(scale, scale, scale);
    this.dronePropR1.castShadow = true;
    this.dronePropR1.receiveShadow = true;

    this.dronePropR2 = new THREE.Mesh( dronePropRGeom, droneMaterial );
    this.dronePropR2.position.set(p.x + propDist * scale, p.y + propHeight * scale, p.z + propDist * scale);
    this.dronePropR2.scale.set(scale, scale, scale);
    this.dronePropR2.castShadow = true;
    this.dronePropR2.receiveShadow = true;

    this.dronePropL1 = new THREE.Mesh( dronePropLGeom, droneMaterial );
    this.dronePropL1.position.set(p.x - propDist * scale, p.y + propHeight * scale, p.z + propDist * scale);
    this.dronePropL1.rotateY(Math.PI / 2);
    this.dronePropL1.scale.set(scale, scale, scale);
    this.dronePropL1.castShadow = true;
    this.dronePropL1.receiveShadow = true;

    this.dronePropL2 = new THREE.Mesh( dronePropLGeom, droneMaterial );
    this.dronePropL2.position.set(p.x + propDist * scale, p.y + propHeight * scale, p.z - propDist * scale);
    this.dronePropL2.rotateY(Math.PI / 2);
    this.dronePropL2.scale.set(scale, scale, scale);
    this.dronePropL2.castShadow = true;
    this.dronePropL2.receiveShadow = true;

    this.droneGroup.add(this.droneBody, this.dronePropR1, this.dronePropR2, this.dronePropL1, this.dronePropL2);

    scene.add(this.droneGroup);
}

init();
animate();

function init() {
    // ASCII file

    var loader = new THREE.STLLoader();
    loader.load( 'models/DroneBody.stl', function ( geometry ) {
        droneBodyGeom = geometry;

        loader.load( 'models/DronePropL.stl', function ( geometry ) {
            dronePropLGeom = geometry;

            loader.load( 'models/DronePropR.stl', function ( geometry ) {
                dronePropRGeom = geometry;
                drones.push(new Drone(new THREE.Vector3(0, 0, 0), 0.01, scene));
            } );
        } );
    } );

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1000 );
    camera.position.set( 0, 5, -5 );

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

    // LIGHTS

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    //

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    var d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

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
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update();

    for (var i = 0; i < drones.length; i++) {
        if (drones[i].flying)
        {
            drones[i].dronePropR1.rotateY(-0.4);
            drones[i].dronePropR2.rotateY(-0.4);
            drones[i].dronePropL1.rotateY(0.4);
            drones[i].dronePropL2.rotateY(0.4);
        }
    }

    render();
    stats.update();

}

function render() {

    renderer.render( scene, camera );

}