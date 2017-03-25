var propDist = 125;
var propHeight = 183.15;
var droneMaterial = new THREE.MeshPhongMaterial({color: 0x303030, specular: 0x111111, shininess: 200});
var buildingMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, specular: 0x111111, shininess: 200});
var buildingSize = 10;

var container, stats;

var camera, controls, scene, renderer;
var droneBodyGeom, dronePropRGeom, dronePropLGeom;
var drones = [];
// var webSocket = new WebSocket("ws://35.2.178.81:4567/map");
var terrain = [];

function Drone(p, scale, scene) {
    this.name = "";

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
    } );

    loader.load( 'models/DronePropL.stl', function ( geometry ) {
        dronePropLGeom = geometry;
    } );

    loader.load( 'models/DronePropR.stl', function ( geometry ) {
        dronePropRGeom = geometry;
    } );

    $.get('http://simonguo.tech/map.txt', function(data) {
        var lines = data.split('\n');
        for (var i = 0; i < lines.length; i++)
        {
            terrain.push([]);
            var tiles = lines[i].split(' ');
            for (var j = 0; j < tiles.length - 1; j++)
            {
                var tileData = tiles[j].split(',');
                terrain[i].push([parseInt(tileData[0]), parseInt(tileData[1])]);
            }
        }
        generateBuildings();
    });

    // webSocket.send("init");

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 600000 );
    camera.position.set( 0, 50, -50 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6699ff);
    // scene.fog = new THREE.Fog( 0xffffff, 1, 4000 );


    // Ground

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 5000, 5000 ),
        new THREE.MeshPhongMaterial( { color: 0x559955, specular: 0x101010 } )
    );
    plane.rotation.x = -Math.PI/2;
    plane.position.y = 0;
    scene.add(plane);

    plane.receiveShadow = true;

    // LIGHTS

    var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.4 );
    hemiLight.color.setHSL( 0.6, 0, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 0, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    //

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 500 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    var d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 5000;
    dirLight.shadow.bias = -0.0001;

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    // renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render );
    controls.enableZoom = true;

    container.appendChild( renderer.domElement );

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );

    // webSocket.onmessage = function(message) {
    //     var droneMessages = JSON.parse(message.data);
    //     if (drones.length == 0) {
    //         for (var i = 0; i < droneMessages.length; i++) {
    //             drones.push(new Drone(new THREE.Vector3(droneMessages[i].x, droneMessages[i].y, droneMessages[i].z), 0.1, scene));
    //         }
    //     } else {
    //         for (i = 0; i < droneMessages.length; i++) {
    //             drones[droneMessages[i].id].droneGroup.position.set(droneMessages[i].x, droneMessages[i].y, droneMessages[i].z);
    //         }
    //     }
    // }
}

function generateBuildings() {
    for (var i = 0; i < terrain.length; i++) {
        for (var j = 0; j < terrain.length; j++) {
            var x = i * buildingSize - terrain.length / 2 * buildingSize;
            var z = j * buildingSize - terrain.length / 2 * buildingSize;
            var geometry = new THREE.BoxGeometry(buildingSize, terrain[i][j][1] * buildingSize, buildingSize);
            var building = new THREE.Mesh(geometry, buildingMaterial);
            building.position.set(x, 0, z);
            scene.add(building);
        }
    }
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
        drones[i].dronePropR1.rotateY(-0.4);
        drones[i].dronePropR2.rotateY(-0.4);
        drones[i].dronePropL1.rotateY(0.4);
        drones[i].dronePropL2.rotateY(0.4);
    }

    render();
    stats.update();

}

function render() {

    renderer.render( scene, camera );

}