var FloodFill = {

	withinTolerance: function(array1, offset, array2, tolerance)
	{
		var length = array2.length,
			start = offset + length;
		tolerance = tolerance || 0;

		while(start-- && length--) {
			if(Math.abs(array1[start] - array2[length]) > tolerance) {
				return false;
			}
		}

		return true;
	},

	fill: function(imageData, getPointOffsetFn, point, color, target, tolerance, width, height)
	{
	    var directions = [[1, 0], [0, 1], [0, -1], [-1, 0]],
			coords = [],
			points = [point],
			seen = {},
			key,
			x,
			y,
			offset,
			i,
			x2,
			y2,
			minX = -1,
			maxX = -1,
			minY = -1,
			maxY = -1;

		while (!!(point = points.pop())) {
			x = point.x;
			y = point.y;
			offset = getPointOffsetFn(x, y);

			if (!FloodFill.withinTolerance(imageData, offset, target, tolerance)) {
				continue;
			}

			if (x > maxX) { maxX = x; }
			if (y > maxY) { maxY = y; }
			if (x < minX || minX == -1) { minX = x; }
			if (y < minY || minY == -1) { minY = y; }

			i = directions.length;
			while (i--) {
				if (i < 4) {
					imageData[offset + i] = color[i];
					coords[offset+i] = color[i];
				}

				x2 = x + directions[i][0];
				y2 = y + directions[i][1];
				key = x2 + ',' + y2;

				if (x2 < 0 || y2 < 0 || x2 >= width || y2 >= height || seen[key]) {
					continue;
				}

				points.push({ x: x2, y: y2 });
				seen[key] = true;
			}
		}

		return {
			x: minX,
			y: minY,
			width: maxX-minX,
			height: maxY-minY,
			coords: coords
		}
	}

}; 


var fillColor = document.getElementById("inkColor").value.toString(); // color @here
var fillTolerance = 2;

function hexToRgb(hex, opacity) {
	opacity = Math.round(opacity * 255) || 255;
	hex = hex.replace('#', '');
	var rgb = [], re = new RegExp('(.{' + hex.length/3 + '})', 'g');
	hex.match(re).map(function(l) {
		rgb.push(parseInt(hex.length % 2 ? l+l : l, 16));
	});
	return rgb.concat(opacity);
}

function floodFill(enable) {

	if (!enable) {
		canvas.off('mouse:down');
		canvas.selection = true;
		canvas.forEachObject(function(object){
			object.selectable = true;
		});
		return;
	}
  
	//canvas.deactivateAll();
  canvas.forEachObject(object => {
    object.selectable = false;
    object.evented = false;

});
  canvas.renderAll(); // Hide object handles!
	canvas.selection = false;
	
var isActive= false;

	canvas.on({
		'mouse:down': function(e) {
			fillColor = document.getElementById("inkColor").value.toString(); // color @here
			var mouse = canvas.getPointer(e.e),
				mouseX = Math.round(mouse.x), mouseY = Math.round(mouse.y),
				fcanvas = canvas.lowerCanvasEl,
                
				context = fcanvas.getContext('2d', { willReadFrequently: true }),
				parsedColor = hexToRgb(fillColor),
				imageData = context.getImageData(0, 0, fcanvas.width, fcanvas.height),
				getPointOffset = function(x,y) {
					return 4 * (y * imageData.width + x)
				},
				targetOffset = getPointOffset(mouseX, mouseY),
				target = imageData.data.slice(targetOffset, targetOffset + 4);

			if (FloodFill.withinTolerance(target, 0, parsedColor, fillTolerance)) {
				// Trying to fill something which is (essentially) the fill color
				console.log('Ignore... same color')
				return;
			}

			// Perform flood fill
			var data = FloodFill.fill(
				imageData.data,
				getPointOffset,
				{ x: mouseX, y: mouseY },
				parsedColor,
				target,
				fillTolerance,
				imageData.width,
				imageData.height
			);

			if (0 === data.width || 0 === data.height) {
				return;
			}

			var tmpCanvas = document.createElement('canvas'), tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
			tmpCanvas.width = fcanvas.width;
			tmpCanvas.height = fcanvas.height;
            
			var palette = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height); // x, y, w, h
			palette.data.set(new Uint8ClampedArray(data.coords)); // Assuming values 0..255, RGBA
			tmpCtx.putImageData(palette, 0, 0); // Repost the data.
			var imgData = tmpCtx.getImageData(data.x, data.y, data.width, data.height); // Get cropped image

			tmpCanvas.width = data.width;
			tmpCanvas.height = data.height;
          //tmpCanvas.selectable= false
			tmpCtx.putImageData(imgData,0,0);

			// Convert canvas back to image:
			var img = new Image();
      img.selection=false 
			img.onload = function() {
				canvas.add(new fabric.Image(img, {
					left: data.x,
					top: data.y,
					selectable: false
				}))
			};

			img.src = tmpCanvas.toDataURL('image/png'); 
         
      //tmpCanvas.selection=false
      
			canvas.add(new fabric.Image(tmpCanvas, {
				left: data.x,
				top: data.y,
       // selection: false
			}))
            
      
      floodFill(false);
      isActive=false
		}
	});
}
