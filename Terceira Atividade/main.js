var container;
var camera, scene, renderer;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var lamp; //object shown
var animating=false; //true if animation is playing
var nframes=20; //maximum number of keyframes
var keyframePos=[]; //object position in each keyframe
init();
function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.position.z = 20;
	// scene
	scene = new THREE.Scene();
	var ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );
	scene.add( ambientLight );
	var pointLight = new THREE.PointLight( 0xffffff, 2.0 );
	camera.add( pointLight );
	scene.add( camera );
	// texture
	var textureLoader = new THREE.TextureLoader();
	var texture = textureLoader.load( 'stone.jpg' );
	// model
	var loader = new THREE.OBJLoader();
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
		lamp=object; //keeps reference to it
	});
	//
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth-20, window.innerHeight-50 );
	container.appendChild( renderer.domElement );
	//
	window.addEventListener( 'resize', onWindowResize, false );
	// Set up mouse callbacks. 
	// Call mousePressed, mouseDragged and mouseReleased functions if defined.
	// Arrange for global mouse variables to be set before calling user callbacks.
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
	// First render
	render();
	for (var i=0; i<nframes; i++){
		var button = document.createElement("btn");
		button.setAttribute("id", "keyframe"+i);
		button.setAttribute("class", "button");
		button.addEventListener("click", keyframeClicked.bind(null, i));
		document.getElementById("keyframes").appendChild(button);
	}
}
function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth-20, window.innerHeight-50 );
}
function onDocumentMouseMove( event ) {
	mouseX = ( event.clientX - windowHalfX ) / 2;
	mouseY = ( event.clientY - windowHalfY ) / 2;
}
//
function render() {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
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
			lamp.position.x-=0.5;
			break;
		case 38: //up arrow pressed
			lamp.position.y+=0.5;
			break;
		case 39: //right arrow pressed
			lamp.position.x+=0.5;
			break;
		case 40: //down arrow pressed
			lamp.position.y-=0.5;
		case 32: //space bar pressed
			animating=!animating;
	}
}
function wheelRolled(event){
	if (event.deltaY<0) //zoom in
		lamp.position.z+=0.5;
	else //zoom out
		lamp.position.z-=0.5;
}
function keyframeClicked(index){
	if (keyframePos[index]){
		keyframePos[index]=null;
		document.getElementById("keyframe"+index).setAttribute("class", "button");
	}
	else{
		keyframePos[index]=new THREE.Vector3(lamp.position.x,lamp.position.y,lamp.position.z);
		document.getElementById("keyframe"+index).setAttribute("class", "button selected");
	}
}
