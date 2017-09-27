//
// Global variables
//
var scene, width, height, camera, renderer;
var mouseIsPressed, mouseX, mouseY, pmouseX, pmouseY;

//
// Initialization of global objects and set up callbacks for mouse and resize
//
function init() {

	// Scene object
	scene = new THREE.Scene();

	// Will use the whole window for the webgl canvas
	width = window.innerWidth-20;
	height = window.innerHeight-20;

	// Orthogonal camera for 2D drawing
	camera = new THREE.OrthographicCamera( 0, width, 0, height, -height, height );
	camera.lookAt (new THREE.Vector3 (0,0,0));

	// Renderer will use a canvas taking the whole window
	renderer = new THREE.WebGLRenderer( {antialias: true, alpha: true}); /////alpha: true allows background color to be white
	renderer.sortObjects = false;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( width, height );

	// Append camera to the page
	document.body.appendChild( renderer.domElement );

	// Set resize (reshape) callback
	window.addEventListener( 'resize', resize );

	// Set up mouse callbacks. 
	// Call mousePressed, mouseDragged and mouseReleased functions if defined.
	// Arrange for global mouse variables to be set before calling user callbacks.
	mouseIsPressed = false;
	mouseX = 0;
	mouseY = 0;
	pmouseX = 0;
	pmouseY = 0;
	var setMouse = function () {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
	renderer.domElement.addEventListener ( 'mousedown', function () {
		setMouse();
		mouseIsPressed = true; 
		mousePressed();
	});
	renderer.domElement.addEventListener ( 'mousemove', function () { 
		pmouseX = mouseX;
		pmouseY = mouseY;
		setMouse();
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
}

// 
// Reshape callback
//
function resize() {
	width = window.innerWidth-20;
	height = window.innerHeight-20;
	camera.right = width;
	camera.bottom = height;
	camera.updateProjectionMatrix();
	renderer.setSize(width,height);
	render();
}

//
// The render callback
//
function render () {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
};

//------------------------------------------------------------
//
// User code from here on 
//
//------------------------------------------------------------

var selected=null; //polygon picked for translation or rotation
var drawing=false; //true if new polygon is being drawn
var drawingPolyLine; //polygonal bordar while baing drawed
var currentColor; //color randomly picked for new polygon
var polygons=[]; //array of polygons
var mouseX0, mouseY0; //'old' mouse coordinates needed to obtain mouse shift
var pins={}; //associative array of pins: associates each pair parent+children of polygons to a dictionary with its pin's information

function setup () {
	document.addEventListener('dblclick', pin); //binds double click to pin function
}

function mousePressed(){
	if (!drawing && !contains().length){ //starts new polygon
			drawing=true;
			var point=new THREE.Vector3 (mouseX,mouseY,0);
			var geometry=new THREE.Geometry();
			geometry.vertices.push(point);
			geometry.vertices.push(point);
			currentColor=Math.random()*0xffffff;
			drawingPolyLine = new THREE.Line(geometry, new THREE.LineBasicMaterial ({color:currentColor, depthWrite:false, linewidth:5}));
			scene.add(drawingPolyLine);
	}
	else{
		var geometry=new THREE.Geometry();
		geometry.vertices=drawingPolyLine.geometry.vertices;
		var point=new THREE.Vector3 (mouseX,mouseY,0);
		if (point.distanceTo(geometry.vertices[0])<=20){ //closes polygon
			drawing=false;
			geometry.vertices[geometry.vertices.length-1]=geometry.vertices[0];
			var shape=new THREE.Shape(geometry.vertices);
			var shapeGeometry=new THREE.ShapeGeometry(shape);
			var mesh=new THREE.Mesh(shapeGeometry,new THREE.MeshBasicMaterial({color:currentColor, side:THREE.DoubleSide}));
			scene.add(mesh);
			polygons.push(mesh);
			scene.remove(drawingPolyLine);
		}
		else{ //adds new vertex to polygon and keeps drawing
			geometry.vertices.push(point);
			drawingPolyLine.geometry=geometry;
		}
	}
}

function mouseMoved(){ //updates line being drawn from last point positioned to mouse cursor
	if (drawing){
		var point = new THREE.Vector3 (mouseX,mouseY,0);
		var geometry = new THREE.Geometry();
		geometry.vertices=drawingPolyLine.geometry.vertices;
		geometry.vertices[geometry.vertices.length-1]=point;
		drawingPolyLine.geometry=geometry;
	}
}

function mouseDragged() {
	if (selected && !drawing)
		if (selected.parent.type=="Mesh"){ //rotate
			var pos=new THREE.Vector4(pins[selected.parent.parent.uuid+selected.uuid].x,pins[selected.parent.parent.uuid+selected.uuid].y,0,1);
			var posMouse0=new THREE.Vector4(mouseX0,mouseY0,0,1);
			var posMouse=new THREE.Vector4(mouseX,mouseY,0,1);
			var m=new THREE.Matrix4();
			m.getInverse(selected.matrix);
			pos.applyMatrix4(m);
			var m2=new THREE.Matrix4();
			m2.getInverse(selected.parent.matrixWorld);
			m.multiply(m2);
			posMouse0.applyMatrix4(m);
			posMouse.applyMatrix4(m);
			selected.translateX(pos.x); //brings back to original position (order must be inversed)
			selected.translateY(pos.y);
			var v0=new THREE.Vector3(posMouse0.x-pos.x,posMouse0.y-pos.y,0);
			var v=new THREE.Vector3(posMouse.x-pos.x,posMouse.y-pos.y,0);
			var angle=v0.angleTo(v);
			angle*=Math.sign(v0.cross(v).z); //gets rotation direction
			if (angle!=NaN) selected.rotateZ(angle); //rotates selected polygon
			selected.translateX(-pos.x); //translates to origin (order must be inversed)
			selected.translateY(-pos.y);
		}
		else{ //translate
			var pos=new THREE.Vector4(mouseX-mouseX0,mouseY-mouseY0,0,1);
			var m=new THREE.Matrix4();
			m.extractRotation(selected.matrix);
			m.getInverse(m);
			pos.applyMatrix4(m);
			selected.translateX(pos.x);
			selected.translateY(pos.y);
		}
	else if (contains().length && !drawing) //first call after pressing, right before dragging
			selected=contains()[contains().length-1].object;
	mouseX0=mouseX;
	mouseY0=mouseY;
}

function mouseReleased() { //resets variable indicating no polygon is being moved
	selected=0;
}

function contains(){ //returns array with all polygons under mouse cursor
	var x=(event.clientX/window.innerWidth)*2-1; //x normalization
	var y=-(event.clientY/window.innerHeight)*2+1; //y normalization
	var raycaster=new THREE.Raycaster();
	raycaster.setFromCamera(new THREE.Vector3(x,y,0), camera);
	return raycaster.intersectObjects(polygons);
}

function pin(){
	containers=contains();
	if (containers.length>0){
		if (containers.length==1) //prepares array in case pinning on background/scene
			containers=[{object:scene},containers[containers.length-1]];
		if (containers[containers.length-1].object.parent.type!="Mesh"){ //inserts pin
			var posFront=new THREE.Vector4(mouseX,mouseY,0,1);
			var posBack=new THREE.Vector4(mouseX,mouseY,0,1);
			var m=new THREE.Matrix4();
			m.getInverse(containers[containers.length-1].object.matrixWorld);
			posFront.applyMatrix4(m);
			m.getInverse(containers[containers.length-2].object.matrixWorld);
			posBack.applyMatrix4(m);
			containers[containers.length-1].object.applyMatrix(m); //changes polygon base to his parent's base
			var curve=new THREE.EllipseCurve(posBack.x,posBack.y,5,5,0,2*Math.PI,false,0); //creates back pin
			var path=new THREE.Path(curve.getPoints(64));
			var geometry=path.createPointsGeometry(64);
			var shape=new THREE.Shape(geometry.vertices);
			var shapeGeometry=new THREE.ShapeGeometry(shape);
			var pin=new THREE.Mesh(shapeGeometry,new THREE.MeshBasicMaterial({color:0xc0c0c0, side:THREE.DoubleSide}));
			var curve2=new THREE.EllipseCurve(posFront.x,posFront.y,5,5,0,2*Math.PI,false,0); //crestes front pin
			var path2=new THREE.Path(curve2.getPoints(64));
			var geometry2=path2.createPointsGeometry(64);
			var shape2=new THREE.Shape(geometry2.vertices);
			var shapeGeometry2=new THREE.ShapeGeometry(shape2);
			var pin2=new THREE.Mesh(shapeGeometry2,new THREE.MeshBasicMaterial({color:0xc0c0c0, side:THREE.DoubleSide}));
			containers[containers.length-2].object.children.push(pin);
			pin.parent=containers[containers.length-2].object;
			pin.children.push(containers[containers.length-1].object);
			containers[containers.length-1].object.parent=pin;
			containers[containers.length-1].object.children.push(pin2);
			pin2.parent=containers[containers.length-1].object;
			pins[containers[containers.length-2].object.uuid+containers[containers.length-1].object.uuid]={back:pin,front:pin2,x:posBack.x,y:posBack.y};
		}
		else{ //removes pin
			var pin=pins[containers[containers.length-1].object.parent.parent.uuid+containers[containers.length-1].object.uuid];
			containers[containers.length-1].object.children.splice(containers[containers.length-1].object.children.indexOf(pin.front),1);
			containers[containers.length-1].object.parent.parent.children.splice(containers[containers.length-1].object.parent.parent.children.indexOf(pin.back),1);
			delete pins[containers[containers.length-1].object.parent.parent.uuid+containers[containers.length-1].object.uuid];
			containers[containers.length-1].object.applyMatrix(containers[containers.length-1].object.parent.parent.matrixWorld);
			containers[containers.length-1].object.parent=scene;
		}
	}
}

init();
