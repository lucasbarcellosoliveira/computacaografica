var container;
var camera, scene, renderer;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var myobject; //object shown
var animating=false; //true if animation is playing
var nframes=20; //maximum number of keyframes
var interpolationsteps=10; //number of positions between keyframes
var keyframePos={}; //object position in each keyframe
var keyframeQuat={}; //object quaternion in each keyframe
init();
function init() {
	//based on three.js example
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.position.z = 20;
	scene = new THREE.Scene(); //scene
	var ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );
	scene.add( ambientLight );
	var pointLight = new THREE.PointLight( 0xffffff, 2.0 );
	camera.add( pointLight );
	scene.add( camera );
	var textureLoader = new THREE.TextureLoader(); //texture
	var texture = textureLoader.load( 'stone.jpg' );
	var loader = new THREE.OBJLoader(); //model
	loader.load( 'lamp.obj', function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				child.material.map = texture;
			}
		} );
		object.position.x=0; //set objects initial position
		object.position.y=-2;
		object.position.z=0;
		scene.add( object );
		myobject=object; //keeps reference to it
	});
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth-20, window.innerHeight-50 );
	container.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
	// based on previous assignment
	mouseIsPressed = false;
	mouseX = 0;
	mouseY = 0;
	pmouseX = 0;
	pmouseY = 0;
	renderer.domElement.addEventListener ( 'mousedown', function () {
		mouseIsPressed = true; 
		mousePressed();
	});
	renderer.domElement.addEventListener ( 'mousemove', function () { 
		pmouseX = mouseX;
		pmouseY = mouseY;
		if (mouseIsPressed) {
			mouseDragged(); 
		}
		mouseMoved();
	});
	renderer.domElement.addEventListener ( 'mouseup', function () { 
		mouseIsPressed = false; 
		mouseReleased(); 
	});
	setup();
	render();
	for (var i=0; i<nframes; i++){ //adds buttons to page and initializes them
		var button = document.createElement("btn");
		button.setAttribute("id","keyframe"+i);
		button.setAttribute("class","button");
		button.addEventListener("click", keyframeClicked.bind(null,i));
		document.getElementById("keyframes").appendChild(button);
	}
}
function onWindowResize() {
	windowHalfX=window.innerWidth/2;
	windowHalfY=window.innerHeight/2;
	camera.aspect=window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth-20,window.innerHeight-50);
}
function onDocumentMouseMove(event) {
	mouseX = (event.clientX-windowHalfX)/2;
	mouseY = (event.clientY-windowHalfY)/2;
}
function render() {
	requestAnimationFrame(render);
	renderer.render(scene,camera);
}
function mouseMoved(){}
function mousePressed(){

}
function mouseDragged(){

}
function mouseReleased(){

}
function setup(){
	document.onkeypress=keyPressed;
	document.onwheel=wheelRolled;
}
function keyPressed(event){
	switch(event.keyCode){
		case 37: //left arrow pressed
			myobject.position.x-=0.5;
			break;
		case 38: //up arrow pressed
			myobject.position.y+=0.5;
			break;
		case 39: //right arrow pressed
			myobject.position.x+=0.5;
			break;
		case 40: //down arrow pressed
			myobject.position.y-=0.5;
			break;
		default: //toggle animation
			animating=!animating;
			animate();
	}
}
function wheelRolled(event){
	if (event.deltaY<0) //zoom in
		myobject.position.z+=0.5;
	else //zoom out
		myobject.position.z-=0.5;
}
function keyframeClicked(index){
	if (keyframePos[index]){ //if button is already selected
		keyframePos[index]=undefined;
		document.getElementById("keyframe"+index).setAttribute("class", "button");
	}
	else{ //if button is not selected yet
		keyframePos[index]=new THREE.Vector3(myobject.position.x,myobject.position.y,myobject.position.z); //stores current position
		keyframeQuat[index]=new THREE.Quaternion(myobject.quaternion.x,myobject.quaternion.y,myobject.quaternion.z,myobject.quaternion.w); //stores current quaternion
		document.getElementById("keyframe"+index).setAttribute("class", "button selected");
	}
}
async function animate(){ //interpolate and animate
	var next, start=0;
	while (keyframePos[start]==undefined){
		start++;
		if (start>=nframes) //no keyframe selected
			return;
	}
	while(animating){
		myobject.position=keyframePos[start];
		next=start+1;
		while (keyframePos[next]==undefined){ //finds next keyframe
			next++;
			if (next==nframes)
				next=0;
		}
		for (var j=1;j<=interpolationsteps;j++){
			myobject.position.lerp(keyframePos[next],j/interpolationsteps); //linear interpolation for translation
			myobject.quaternion.slerp(keyframeQuat[next],j/interpolationsteps); //spherical linear interpolation for rotation
			await sleep(10); //waits 10ms between frames
		}
		start=next;
	}
}
function sleep(ms) { //allows waiting between frames
  return new Promise(resolve => setTimeout(resolve, ms));
}
