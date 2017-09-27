      var lines=[]; //array of lines
      var movingLine; //line currently being moved or last moved
      var movingPoint; //end currently being moved or last moved
      var intersections=[]; //array of intersections
      var originalX; //mouseX when translation was started
      var originalY; //mouseY when translation was started

      function setup(){
        createCanvas(500,500);
        background('rgba(0,255,0, 0.25)');
      }

      function draw(){
        clear();
	background('rgba(0,255,0, 0.25)');
        fill(255,255,255);
        for (i=0;i<lines.length;i++){
          line(lines[i].x0,lines[i].y0,lines[i].x1,lines[i].y1); //draws lines
        }
        fill(192,0,192);
        for (i=0;i<intersections.length;i++){
          ellipse(intersections[i].x,intersections[i].y,10); //draws intersections
        }
      }

      function mousePressed(){
	for (i=0;i<lines.length;i++){ //for each line, checks if mouse is near an end or along it
          if (Math.pow(mouseX-lines[i].x0, 2)+Math.pow(mouseY-lines[i].y0, 2)<=100){ //if mouse is near a line's first end
            lines[i].x0=mouseX;
            lines[i].y0=mouseY;
            movingPoint=0;
            movingLine=i;
            return;
          }
          if (Math.pow(mouseX-lines[i].x1, 2)+Math.pow(mouseY-lines[i].y1, 2)<=25){ //if mouse is near a line's second end
            lines[i].x1=mouseX;
            lines[i].y1=mouseY;
            movingPoint=1;
            movingLine=i;
            return;
          }
          if (distPointToSegmentSquared({x:mouseX,y:mouseY},{x:lines[i].x0,y:lines[i].y0},{x:lines[i].x1,y:lines[i].y1})<=100){ //if mouse is close to a line but not by an end
            originalX=mouseX;
            originalY=mouseY;
            movingPoint=2;
            movingLine=i;
            return;
          }
        }
        lines.push({x0:mouseX, y0:mouseY, x1:mouseX, y1:mouseY}); //if mouse is not near any line's end, a new line will be drawn
        movingPoint=1;
        movingLine=lines.length-1;
      }

      function mouseDragged(){
        if (movingPoint==0){ //checks if first end will be moved
          lines[movingLine].x0=mouseX;
          lines[movingLine].y0=mouseY;
        }
        else if (movingPoint==1){ //checks if second end will be moved
          lines[movingLine].x1=mouseX;
          lines[movingLine].y1=mouseY;
        }
        else{ //checks if line will be translated
          var deltaX=mouseX-originalX;
          var deltaY=mouseY-originalY;
          lines[movingLine].x0+=deltaX;
          lines[movingLine].y0+=deltaY;
          lines[movingLine].x1+=deltaX;
          lines[movingLine].y1+=deltaY;
          originalX=mouseX;
          originalY=mouseY;
        }
        checkIntersections();
      }

      function checkIntersections(){ //checks if new line position creates intersections
        var removeIntersections=[];
        for (i=0;i<intersections.length;i++){
          if (intersections[i].line0==movingLine||intersections[i].line1==movingLine){
            removeIntersections.push(intersections[i]); //picks intersections that which will move
          }
        }
        intersections=intersections.filter(item=>!removeIntersections.includes(item)); //removes obsolete intersections
        var u;
        var t;
        for (i=0;i<lines.length;i++){
          if (i==movingLine){
            continue;
          }
          u=((lines[i].y1-lines[i].y0)*(lines[movingLine].x0-lines[i].x0)-(lines[i].x1-lines[i].x0)*(lines[movingLine].y0-lines[i].y0))/((lines[i].x1-lines[i].x0)*(lines[movingLine].y1-lines[movingLine].y0)-(lines[i].y1-lines[i].y0)*(lines[movingLine].x1-lines[movingLine].x0));
          t=(lines[movingLine].x0+(lines[movingLine].x1-lines[movingLine].x0)*u-lines[i].x0)/(lines[i].x1-lines[i].x0);
          if (u>=0&&u<=1&&t>=0&&t<=1){
            intersections.push({x:lines[movingLine].x0+(lines[movingLine].x1-lines[movingLine].x0)*u, y:lines[movingLine].y0+(lines[movingLine].y1-lines[movingLine].y0)*u, line0:movingLine, line1:i});
          }
        } //approach as seen in https://math.stackexchange.com/questions/375083/given-coordinates-of-beginning-and-end-of-two-intersecting-line-segments-how-do
      }

      function distPointToSegmentSquared(p,a,b){ //computes point-segment distance to the power of 2
        var l=Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2);
        if (l==0){
          return Math.pow(p.x-a.x,2)+Math.pow(p.y-a.y,2);
        }
        var t=((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l;
        t=Math.max(0, Math.min(1, t));
        return Math.pow(p.x-(a.x+t*(b.x-a.x)),2)+Math.pow(p.y-(a.y+t*(b.y-a.y)),2);
      } //approach as seen in https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
