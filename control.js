


import * as THREE from 'https://unpkg.com/three@0.125.2/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.125.2/examples/jsm/controls/OrbitControls.js'
//import { A, D, DIRECTIONS, S, W } from './utils.js'

const W = 'w';
const A = 'a';
const S = 's';
const D = 'd';
const DIRECTIONS = [W, A, S, D];
let keysPressed,delta;
let model,mixer,animationsMap,orbitControl,camera;
let toggleRun,currentAction;
let  fadeDuration= 0.2,runVelocity = 5, walkVelocity = 2;
export class CharacterControls {

    
    mixer = new THREE.AnimationMixer;
    animationsMap  = new Map(); // Walk, Run, Idle
    //orbitControl = new OrbitControls
    camera = new THREE.Camera;

    // state
    //const toggleRun  = true;
    //const currentAction;

    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    
    // constants
    //const fadeDuration= 0.2
    //const runVelocity = 5
    //const walkVelocity = 2

    constructor(model,mixer, animationsMap,orbitControl, camera,currentAction,rigidBody) 
    {
        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = currentAction
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play();
            }
        })
        this.rigidBody = rigidBody
        this.orbitControl = orbitControl
        this.camera = camera
        this.updateCameraTarget(0,0)
    }


    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    update(world,delta, keysPressed) {

        this.mixer.update(delta)
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)

        var play = '';
        if (directionPressed && this.toggleRun) {
            play = 'Run'
        } else if (directionPressed) {
            //console.log('run');
            play = 'Walk'
        } else {
            play = 'Idle'
        }

        if (this.currentAction != play) {
            const toPlay = this.animationsMap.get(play)
            const current = this.animationsMap.get(this.currentAction)

            //current.fadeOut(this.fadeDuration)
            //toPlay.reset().fadeIn(this.fadeDuration).play();
            current.enabled = true
            toPlay.enabled = true
            current.crossFadeTo(toPlay, this.fadeDuration, true)

            toPlay.play();
            this.currentAction = play
        }
        //console.log("w entered");
        //this.walkDirection.x = this.walkDirection.y = this.walkDirection.z = 0
        this.mixer.update(delta)
        

        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
            // calculate towards camera direction
            //console.log("loop");
            var angleYCameraDirection = Math.atan2(
                    (this.camera.position.x - this.model.position.x), 
                    (this.camera.position.z - this.model.position.z))
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // // run/walk velocity
            const velocity = this.currentAction == 'Run' ? 4 : 1.5

            // // move model & camera
            const translation = this.rigidBody.translation();
            //console.log(translation)
            this.model.position.x = translation.x;
            this.model.position.z = translation.z;
            //console.log(this.model.position);
            


            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
        
            this.rigidBody.setNextKinematicTranslation( { 
                x: translation.x + moveX, 
                y: translation.y, 
                z: translation.z + moveZ 
            });
            
            const tran = this.rigidBody.translation();
            console.log(tran);
            this.updateCameraTarget(moveX, moveZ)
        }
    }

    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        // update camera target
        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 1
        this.cameraTarget.z = this.model.position.z
        this.orbitControl.target = this.cameraTarget
    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
}