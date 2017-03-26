var propDist = 125;
var propHeight = 183.15;
var droneMaterial = new THREE.MeshPhongMaterial({color: 0x303030, specular: 0x111111, shininess: 200});
var buildingMaterial = new THREE.MeshToonMaterial({color: 0x808080, specular: 0x111111, shininess: 100, opacity: 0.3});
var buildingSize = 10;

var container, stats;

var camera, controls, scene, renderer, effect;
var droneBodyGeom, dronePropRGeom, dronePropLGeom;
var clock = new THREE.Clock();
var drones = [];
var webSocket;
var droneSpeed = 0.5;
var droneMode = false;
var curDrone = 0;

var initSteps = 0;

function Drone(p, scale, scene) {
    this.name = "";
    this.target = p;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.set(0, 25 * scale, -48.17 * scale);

    this.droneGroup = new THREE.Group();

    this.droneBody = new THREE.Mesh( droneBodyGeom, droneMaterial );
    this.droneBody.scale.set(scale, scale, scale);

    this.dronePropR1 = new THREE.Mesh( dronePropRGeom, droneMaterial );
    this.dronePropR1.position.set(-propDist * scale, propHeight * scale, -propDist * scale);
    this.dronePropR1.scale.set(scale, scale, scale);

    this.dronePropR2 = new THREE.Mesh( dronePropRGeom, droneMaterial );
    this.dronePropR2.position.set(propDist * scale, propHeight * scale, propDist * scale);
    this.dronePropR2.scale.set(scale, scale, scale);

    this.dronePropL1 = new THREE.Mesh( dronePropLGeom, droneMaterial );
    this.dronePropL1.position.set(-propDist * scale, propHeight * scale, propDist * scale);
    this.dronePropL1.rotateY(Math.PI / 2);
    this.dronePropL1.scale.set(scale, scale, scale);

    this.dronePropL2 = new THREE.Mesh( dronePropLGeom, droneMaterial );
    this.dronePropL2.position.set(propDist * scale, propHeight * scale, -propDist * scale);
    this.dronePropL2.rotateY(Math.PI / 2);
    this.dronePropL2.scale.set(scale, scale, scale);

    this.redIndicator = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.4}));

    this.droneGroup.add(this.droneBody, this.dronePropR1, this.dronePropR2, this.dronePropL1, this.dronePropL2, this.camera, this.redIndicator);
    this.droneGroup.position.set(p.x, p.y, p.z);

    scene.add(this.droneGroup);
}

init();
animate();

function init() {
    // ASCII file

    var loader = new THREE.STLLoader();
    loader.load( 'models/DroneBody.stl', function ( geometry ) {
        droneBodyGeom = geometry;
        initSteps++;

        if (initSteps == 4) {
            webSocket.send("init");
        }
    } );

    loader.load( 'models/DronePropL.stl', function ( geometry ) {
        dronePropLGeom = geometry;
        initSteps++;

        if (initSteps == 4) {
            webSocket.send("init");
        }
    } );

    loader.load( 'models/DronePropR.stl', function ( geometry ) {
        dronePropRGeom = geometry;
        initSteps++;

        if (initSteps == 4) {
            webSocket.send("init");
        }
    } );

    webSocket = new WebSocket("ws://35.2.178.81:4567/map");
    webSocket.onopen = function() {
        initSteps++;

        if (initSteps == 4) {
            webSocket.send("init");
        }
    };

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.CombinedCamera( window.innerWidth / 2, window.innerHeight / 2, 70, 1, 1000, -5000, 5000 );
    camera.position.set( 0, 200, -1000000);
    camera.toOrthographic();

    container.addEventListener( 'click', function () {
        if (droneMode) {
            document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock;
            document.body.requestPointerLock();
        }

    }, false );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5080c0);


    // Ground

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 5000, 5000 ),
        new THREE.MeshPhongMaterial( { color: 0x207020, specular: 0x101010 } )
    );
    plane.rotation.x = -Math.PI/2;
    plane.position.y = 0;
    scene.add(plane);

    // LIGHTS

    var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.4 );
    hemiLight.color.setHSL( 0.6, 0, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 0, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 500 );
    scene.add( dirLight );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild( renderer.domElement );

    effect = new THREE.OutlineEffect(renderer);

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );

    webSocket.onmessage = function(message) {
        var droneMessage = JSON.parse(message.data);
        if (droneMessage.init === 1) {
            generateBuildings(JSON.parse(droneMessage.map));
            var droneMessages = JSON.parse(droneMessage.drones);
            for (var i = 0; i < droneMessages.length; i++) {
                drones.push(new Drone(new THREE.Vector3(droneMessages[i].x * buildingSize, droneMessages[i].y * buildingSize, droneMessages[i].z * buildingSize), 0.01, scene));
                webSocket.send('' + i);
            }
        } else {
            drones[droneMessage.id].target.set(droneMessage.x * buildingSize - buildingSize / 2, droneMessage.y * buildingSize, droneMessage.z * buildingSize - buildingSize / 2);
        }
    }
}

function generateBuildings(sections) {
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].height > 1) {
            var geom = new THREE.BoxGeometry(Math.abs(sections[i].x2 - sections[i].x1 + 1) * buildingSize, sections[i].height * buildingSize, Math.abs(sections[i].z2 - sections[i].z1 + 1) * buildingSize);
            var mesh = new THREE.Mesh(geom, buildingMaterial);
            mesh.position.set(sections[i].x1 * buildingSize, 0, sections[i].z1 * buildingSize);
            scene.add(mesh);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (droneMode) {
        drones[curDrone].camera.aspect = window.innerWidth / window.innerHeight;
        drones[curDrone].camera.updateProjectionMatrix();
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    var timer = Date.now() * 0.0001;

    camera.position.x = Math.cos( timer ) * 200;
    camera.position.z = Math.sin( timer ) * 200;
    camera.lookAt( scene.position.clone().add(new THREE.Vector3(0, 100, 0)) );

    for (var i = 0; i < drones.length; i++) {
        drones[i].dronePropR1.rotateY(-0.4);
        drones[i].dronePropR2.rotateY(-0.4);
        drones[i].dronePropL1.rotateY(0.4);
        drones[i].dronePropL2.rotateY(0.4);

        if (drones[i].droneGroup.position.clone().sub(drones[i].target).length() >= droneSpeed) {
            drones[i].droneGroup.translateOnAxis(drones[i].target.clone().sub(drones[i].droneGroup.position).setLength(1), droneSpeed);
        } else {
            webSocket.send('' + i);
        }
    }

    render();
    stats.update();

}

function render() {
    if (!droneMode) {
        effect.render(scene, camera);
    } else {
        // controls.getObject().position.set(drones[curDrone].camera.position.x, drones[curDrone].camera.position.y, drones[curDrone].camera.position.z);
        effect.render(scene, drones[curDrone].camera);
    }
}

function enterDroneMode(drone) {
    curDrone = drone;
    droneMode = true;
    controls = new THREE.PointerLockControls( drones[curDrone].camera );
    controls.getObject().position.set(drones[curDrone].camera.position.x, drones[curDrone].camera.position.y, drones[curDrone].camera.position.z);
    controls.enabled = true;
    drones[curDrone].camera.aspect = window.innerWidth / window.innerHeight;
    drones[curDrone].camera.updateProjectionMatrix();
    drones[curDrone].droneGroup.add(controls.getObject());
}

function exitDroneMode() {
    droneMode = false;
    controls.enabled = false;
    drones[curDrone].droneGroup.remove(controls.getObject());
    document.exitPointerLock = document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
    document.exitPointerLock();
}

function transparentBuildings() {
    buildingMaterial.transparent = true;
}

function exitTransparent() {
    buildingMaterial.transparent = false;
}

window.addEventListener( 'keydown', function() {
    if (droneMode) {
        exitDroneMode();
    } else {
        enterDroneMode(0);
    }
}, false );