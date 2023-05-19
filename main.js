import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import * as THREE from 'https://unpkg.com/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.125.2/examples/jsm/controls/OrbitControls.js';
import { CharacterControls } from './control.js';
//import { Color } from 'three';
import Stats from 'https://unpkg.com/three@0.152.2/examples/jsm/libs/stats.module.js'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

let numAnimations,mixer,model,currentAction,toggleRun = true,animationsMap;
let rigidBody4,rigidBody3,humanMesh,threeMesh2;

const scene = new THREE.Scene();
//scene.background = new THREE.Color( 0xa0a0a0 );
//scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 5000 );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
renderer.shadowMap.enabled = true;


window.addEventListener('resize',function(){
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width,height);
  camera.aspect = width/height;
  camera.updateProjectionMatrix;
})

  camera.position.z = 10;
  camera.position.x = 0;
  camera.position.y = 4;



  let hemilight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  hemilight.position.set( 0, 200, 0 );
  scene.add( hemilight );

  const shadowSize = 200;
  let dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( -60, 100, -10 );
  dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
  scene.add( dirLight );
  //sun = light;


const orbitControls = new OrbitControls(camera,renderer.domElement);
orbitControls.enableDamping = true
orbitControls.enablePan = true
orbitControls.enableDamping = true;
orbitControls.screenSpacePanning = false;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // prevent camera below ground
orbitControls.minPolarAngle = Math.PI / 4        // prevent top down view
orbitControls.update();


// ground
// var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 10000, 10000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
// mesh.rotation.x = - Math.PI / 2;
// mesh.receiveShadow = true;
// scene.add( mesh );

// var grid = new THREE.GridHelper( 1000, 200, 0x000000, 0x000000 );
// grid.material.opacity = 0.2;
// grid.material.transparent = true;
//scene.add( grid );

const geometry = new THREE.BoxGeometry( 2, 1, 2 );
const material = new THREE.MeshBasicMaterial( {color:0x222222, wireframe:true} );

// ANIMATE
document.body.appendChild(renderer.domElement);

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);


var characterControls
RAPIER.init().then(() => {
    // Use the RAPIER module here.

    let gravity = { x: 0.0, y: -9.81, z: 0.0 };
    let world = new RAPIER.World(gravity);
    const initialForce = new RAPIER.Vector3(1, 0, 0);

    const box = {hx: 0.5,hy: 0.5,hz: 0.5};


    let scale = new RAPIER.Vector3(70.0, 3.0, 70.0);
    let bodys = [];

    

    const rotation = { x: 0, y: 1, z: 0 }


    addBackground();

    

  //ball
    const newmesh = new THREE.Mesh(new THREE.SphereBufferGeometry(0.7, 32, 32), new THREE.MeshPhongMaterial({ color: 'orange' }));
    newmesh.castShadow =true;
    scene.add(newmesh);

    const bodyType1 = RAPIER.RigidBodyDesc.newDynamic().setTranslation(-0.5, 15, 0);
    const rigidBody1 = world.createRigidBody(bodyType1);
    
    const colliderType1 = RAPIER.ColliderDesc.ball(0.7);
    world.createCollider(colliderType1,rigidBody1);
    rigidBody1.applyImpulse(initialForce, true);
    bodys.push({rigid: rigidBody1, mesh: newmesh});

    //box
    const threeMesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(box.hx * 2,box.hy * 2,box.hz * 2),
        new THREE.MeshPhongMaterial({color: 'red'})
    );
    threeMesh.castShadow = true;
    scene.add(threeMesh);


    const bodyType2 = RAPIER.RigidBodyDesc.newDynamic().setTranslation(-1, 10, 0);
    const rigidBody2 = world.createRigidBody(bodyType2);
    const colliderType2 = RAPIER.ColliderDesc.cuboid(box.hx ,box.hy,box.hz);
    let col = world.createCollider(colliderType2,rigidBody2);
    col.setTranslation(threeMesh.position.x, threeMesh.position.y, threeMesh.position.z);
    col.setRotation(threeMesh.quaternion.x, threeMesh.quaternion.y, threeMesh.quaternion.z, threeMesh.quaternion.w);
    rigidBody2.applyImpulse(initialForce, true);
    bodys.push({rigid: rigidBody2, mesh: threeMesh});


//kinetic cube
    const threeMesh2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(box.hx * 2,box.hy * 2,box.hz * 2),
      new THREE.MeshPhongMaterial({color: 'blue'})
  );
  threeMesh2.castShadow = true;
  scene.add(threeMesh2);
  


  const bodyType4 = RAPIER.RigidBodyDesc.newDynamic().setTranslation(-3,5,0);
  const rigidBody4 = world.createRigidBody(bodyType4);
  const colliderType4 = RAPIER.ColliderDesc.cuboid(box.hx ,box.hy,box.hz);
  world.createCollider(colliderType4,rigidBody4);
  //col.setTranslation(threeMesh2.position.x, threeMesh2.position.y, threeMesh2.position.z);
  //col.setRotation(threeMesh2.quaternion.x, threeMesh2.quaternion.y, threeMesh2.quaternion.z, threeMesh2.quaternion.w);
  //rigidBody4.applyImpulse(initialForce, true);
  bodys.push({rigid: rigidBody4, mesh: threeMesh2});


    
//addKeysListener();
  
  




  

 //ground
const texture = new THREE.TextureLoader().load( "plane.png" );

  let geometry =  new THREE.BoxGeometry(50, 0, 50);
  let material = new THREE.MeshBasicMaterial({map: texture});
  let planeThree = new THREE.Mesh(geometry, material);
  planeThree.position.set(0, 0, 0);
  scene.add(planeThree);

 const groundBody = RAPIER.RigidBodyDesc.newStatic();
 const rigidground = world.createRigidBody(groundBody);
 const groundColliderDesc = RAPIER.ColliderDesc.cuboid(25.0, 0.001, 25.0);
 world.createCollider(groundColliderDesc,groundBody);


 //model
 let humanMesh;
 const loader = new GLTFLoader();
  loader.load( 'Soldier.glb', (gltf) => {

  model = gltf.scene;
  mixer = new THREE.AnimationMixer( model );
  model.traverse( function ( child ) {
    if ( child.isMesh ) {
      //humanMesh = child;
      child.castShadow = true;
      child.receiveShadow = false;
    }
  });
  //humanMesh.position.y =3;

  scene.add( model )
  const clips = gltf.animations;
  animationsMap = new Map();
  clips.filter(a => a.name !== 'TPose').forEach((a) => {
     animationsMap.set(a.name, mixer.clipAction(a));
   });

  const bodyDesc3 = RAPIER.RigidBodyDesc.kinematicPositionBased();//.setTranslation(-3, 0, 1);
   rigidBody3 = world.createRigidBody(bodyDesc3);
   const dynamicCollider3 = RAPIER.ColliderDesc.capsule(0.5,1);
   dynamicCollider3.setTranslation(0,0,0);
   world.createCollider(dynamicCollider3, rigidBody3.handle);
   //bodys.push({rigid: rigidBody3, mesh: model});
  


    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera,  'Idle', rigidBody3)

   } );

  function moveKinetic()
  {
    const translation = rigidBody3.translation();
    //console.log(translation);
     if(keyboard[87])
     {
      //rigidBody4.translation.z -= 0.1;
      rigidBody3.setNextKinematicTranslation( { 
        x: translation.x, 
        y: translation.y , 
        z: translation.z -0.1  
    });

     }

     if(keyboard[83])
     {
       
      rigidBody3.setNextKinematicTranslation( { 
        x: translation.x , 
        y: translation.y , 
        z: translation.z  + 0.1
    });
     }

     if(keyboard[65])
     {
       
      rigidBody3.setNextKinematicTranslation( { 
        x: translation.x - 0.1, 
        y: translation.y , 
        z: translation.z  
    });
     }

     if(keyboard[68])
     {
       
      rigidBody3.setNextKinematicTranslation( { 
        x: translation.x + 0.1, 
        y: translation.y , 
        z: translation.z  
    });
     }
  }


  function update1()
  {
    model.position.x = rigidBody4.translation.x;
  }


  function addBackground() {


  const loader = new GLTFLoader();

  loader.load( 'mountain.glb', (gltf) => {
    const mountainLoaded = gltf.scene;
    mountainLoaded.traverse((child) => {
      if (child.isMesh) {
        const mesh = child;
        mesh.quaternion.setFromAxisAngle(new RAPIER.Vector3(0, 1, 0), -Math.PI / 180 *90);
	      mesh.position.set(0, 60, -90);
	      mesh.scale.set(0.008,0.008,0.008);
        
      }
    });
    scene.add(mountainLoaded);
  });

  loader.load( 'skydome.glb', (gltf) => {
    const domeLoaded = gltf.scene;
    domeLoaded.traverse((child) => {
      if (child.isMesh) {
        const domeMesh = child;
        domeMesh.quaternion.setFromAxisAngle(new RAPIER.Vector3(0, 1, 0), -Math.PI / 180 *90);
	      domeMesh.position.set(0, -40, 0);
	      domeMesh.scale.set(0.1, 0.1, 0.1);
        
      }
    });
    scene.add(domeLoaded);
  });
  }

    const clock = new THREE.Clock();
    function animate() {
      stats.begin()
      requestAnimationFrame(animate);
      let deltaTime = clock.getDelta();
     if (characterControls) {
       //console.log('update')
       characterControls.update(world,deltaTime,keysPressed);
     }
     
      // moveKinetic();
    
      // Step the Rapier simulation forward
      world.step();
      
     //update1();
      
      bodys.forEach(body => {
        let position = body.rigid.translation();
        let rotation = body.rigid.rotation();

        body.mesh.position.x = position.x
        body.mesh.position.y = position.y
        body.mesh.position.z = position.z

        body.mesh.setRotationFromQuaternion(
            new THREE.Quaternion(rotation.x,
                rotation.y,
                rotation.z,
                rotation.w));
    });
    
      //const translation = rigidBody3.collider().shape().translation();
      //humanMesh.position.set(translation.x, translation.y, translation.z);


     
      // let rotation = rigidBody.rotation();
      // threeMesh.setRotationFromQuaternion(new THREE.Quaternion(rotation.x,rotation.y,rotation.z,rotation.w));

      // Render the scene
      orbitControls.update()
      renderer.render(scene, camera);
      stats.end()
  }

  // Start the animation loop
  animate();
})

// const keyboard = {  }
// function addKeysListener(){
//   window.addEventListener('keydown', function(event){
//     keyboard[event.keyCode] = true;
//   } , false);
//   window.addEventListener('keyup', function(event){
//     keyboard[event.keyCode] = false;
//   } , false);
//}

const keysPressed = {  }
document.addEventListener('keydown', (event) => {
    if (event.shiftKey ) {
      characterControls.switchRunToggle()
    } else {
        (keysPressed )[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    (keysPressed)[event.key.toLowerCase()] = false
}, false);
