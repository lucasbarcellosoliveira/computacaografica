var container;
var camera, scene, renderer;
var mouseX = 0, mouseY = 0, pmouseX=0, pmouseY=0, rawmouseX=0, rawmouseY=0, prawmouseX, prawmouseY=0;
var borderX=20, borderY=50; //borders from left side and bottom
var windowHalfX = (window.innerWidth-borderX) / 2;
var windowHalfY = (window.innerHeight-borderY) / 2;
var beginsX=8, beginsY=63; //coordinates to canvas/render top-left corner
var myobject; //object shown
var animating=false; //true if animation is playing
var nframes=20; //maximum number of keyframes
var interpolationsteps=10; //number of positions between keyframes
var keyframePos={}; //object position in each keyframe
var keyframeQuat={}; //object quaternion in each keyframe
var selectedkeyframes=0; //number of keyframes selected now
var mousebutton;
init();
function init() {
	//based on three.js example
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	camera = new THREE.PerspectiveCamera( 45, (window.innerWidth-20) / (window.innerHeight-50), 1, 2000 );
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
	renderer.domElement.addEventListener ( 'mousedown', function (event) {
		mousebutton=event.buttons;
		mouseIsPressed = true; 
		mousePressed();
	});
	renderer.domElement.addEventListener ( 'mouseup', function () { 
		mouseIsPressed = false; 
		mouseReleased(); 
	});
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	setup();
	render();
}
function onWindowResize() {
	windowHalfX=(window.innerWidth-borderX)/2;
	windowHalfY=(window.innerHeight-borderY)/2;
	camera.aspect=(window.innerWidth-borderX)/(window.innerHeight-borderY);
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth-borderX,window.innerHeight-borderY);
}
function onDocumentMouseMove( event ) {
	pmouseX=mouseX;
	pmouseY=mouseY;
	prawmouseX=rawmouseX;
	prawmouseY=rawmouseY;
	mouseX=(event.clientX-beginsX-windowHalfX)/((window.innerWidth-borderX)/2);
	mouseY=(event.clientY-beginsY-windowHalfY)/((window.innerHeight-borderY)/2);
	rawmouseX=event.clientX;
	rawmouseY=event.clientY;
	if (mouseIsPressed)
		mouseDragged();
}
function render() {
	requestAnimationFrame(render);
	renderer.render(scene,camera);
}
function mousePressed(){}
function mouseDragged(){
	if (mousebutton==1){ //left click -> rotation
		var mouse=new THREE.Vector3(mouseX,mouseY,0);
		var pmouse=new THREE.Vector3(pmouseX,pmouseY,0);
		var objpos=new THREE.Vector3(myobject.position.x,myobject.position.y,myobject.position.z);
		objpos.project(camera);
		objpos.z=0;
		var quat=new THREE.Quaternion();
		if (mouse.distanceTo(objpos)>0.5){ //simple rotation
			if (isNaN(mouse.angleTo(pmouse))) return;
			quat.setFromAxisAngle(new THREE.Vector3(0,0,1),mouse.angleTo(pmouse)*Math.sign(mouse.cross(pmouse).z)); //multiplication must be in this order as .cross alters mouse variable
		}
		else{ //arcball behavior
			mouse.z=Math.sqrt(0.5-mouse.distanceTo(objpos));
			pmouse.z=Math.sqrt(0.5-pmouse.distanceTo(objpos));
			mouse.x=-mouse.x;
			pmouse.x=-pmouse.x;
			var axis=new THREE.Vector3();
			axis.copy(mouse);
			axis.cross(pmouse).normalize();
			if (isNaN(mouse.angleTo(pmouse)) || isNaN(axis.x==NaN) || isNaN(axis.y==NaN) || isNaN(axis.z==NaN)) return;
			quat.setFromAxisAngle(axis,mouse.angleTo(pmouse));
		}
		myobject.applyQuaternion(quat);
	}
	else{ //right click -> translation
		var delta=new THREE.Vector3((rawmouseX-prawmouseX)/camera.position.z,-(rawmouseY-prawmouseY)/camera.position.z,0);
		if (myobject.position.z)
			delta.multiplyScalar(Math.abs(myobject.position.z)/camera.position.z);
		myobject.position.add(delta);
	}
}
function mouseReleased(){}
function setup(){
	var button;
	for (var i=0; i<nframes; i++){ //adds buttons to page and initializes them
		button = document.createElement("btn");
		button.setAttribute("id","keyframe"+i);
		button.setAttribute("class","button");
		button.addEventListener("click", keyframeClicked.bind(null,i));
		document.getElementById("keyframes").appendChild(button);
	}
	button = document.createElement("btn");
	button.setAttribute("id","play");
	button.setAttribute("class","play");
	button.innerHTML="<b>Play</b>";
	button.addEventListener("click", animate);
	document.getElementById("keyframes").appendChild(button);
	document.onkeypress=keyPressed;
	document.onwheel=wheelRolled;
	document.getElementById("slider").oninput=slide;
	document.oncontextmenu=function(){return false;}; //disables context menu
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
			animate();
	}
}
function wheelRolled(event){
	if (event.deltaY<0){ //zoom in
		myobject.position.z+=0.5;
		for (i=0;i<nframes;i++)
			if (keyframePos[i]!=undefined)
				keyframePos[i].z+=0.5;
	}
	else{ //zoom out
		myobject.position.z-=0.5;
		for (i=0;i<nframes;i++)
			if (keyframePos[i]!=undefined){
				keyframePos[i].z-=0.5;
			}
	}
}
function keyframeClicked(index){
	if (keyframePos[index]){ //if button is already selected
		keyframePos[index]=undefined;
		keyframeQuat[index]=undefined;
		document.getElementById("keyframe"+index).setAttribute("class", "button");
		selectedkeyframes--;
	}
	else{ //if button is not selected yet
		keyframePos[index]=new THREE.Vector3(myobject.position.x,myobject.position.y,myobject.position.z); //stores current position
		keyframeQuat[index]=new THREE.Quaternion(myobject.quaternion.x,myobject.quaternion.y,myobject.quaternion.z,myobject.quaternion.w); //stores current quaternion
		document.getElementById("keyframe"+index).setAttribute("class", "button selected");
		selectedkeyframes++;
	}
}
async function animate(){ //interpolate and animate
	if (selectedkeyframes<2) return;
	animating=!animating;
	var next, start=0;
	while (keyframePos[start]==undefined)
		start++;
	while(animating){
		if (selectedkeyframes<2){animating=!animating; return;}
		next=start+1;
		if (next==nframes) next=0;
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
function slide(){
	if (selectedkeyframes<2)
		return;
	var startkeyframe=Math.floor(document.getElementById("slider").value/(100/selectedkeyframes));
	var keyframenumber=0;
	var findkeyframe=-1;
	while (findkeyframe!=startkeyframe){
		while (keyframePos[keyframenumber]==undefined)
			keyframenumber++;
		findkeyframe++;
		keyframenumber++;
	}
	var start=keyframenumber-1;
	var next=start+1;
	while (keyframePos[next]==undefined){ //finds next keyframe
		next++;
		if (next==nframes)
			next=0;
	}
	var alpha=(document.getElementById("slider").value-(startkeyframe*100/selectedkeyframes))/50;
	myobject.position.lerpVectors(keyframePos[start],keyframePos[next],alpha);
	THREE.Quaternion.slerp(keyframeQuat[start],keyframeQuat[next],myobject.quaternion,alpha);
}
function sleep(ms){ //allows waiting between frames
	return new Promise(resolve => setTimeout(resolve, ms));
}
