
var svgArray = [];
function loadSvg(url) {
  fabric.loadSVGFromURL(url.svg, function(objects, options) {
    // add the loaded SVG object to the svgArray
    svgArray.push({label:url.label, objects:objects, options:options});
  });
}

// loop through the svgUrls array and load each SVG file
svgUrls.forEach(function(url) {
  loadSvg(url);
});

// variables
var version = '1.000',
    loadedJSON = {}, projectJSON,
    activeLayer, imagesPNG, imagesSVG,
    $data, thisTool, prevTool, line, isDown, loadedSVGCode,
    swatches = ['rgb(0, 0, 0)', 'rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)'];

// feature coming soon
$('[data-comingsoon]').click(function() {
  alertify.log('coming soon...');
  return false;
});
$('[data-alert]').on('click', function() {
  var val = $(this).attr('data-alert');
  alertify.log(val);
});

// load file
function loadJSON() {
    
  if (parseFloat(loadedJSON.version) <= 0.1) {
    swal({
      title: 'Warning!',
      text: "This project is using a version of TouchDrawer that's no longer supported.",
      type: 'warning',
    })
  } else 
  if (parseFloat(version) > parseFloat(loadedJSON.version)) {
    swal({
      title: 'Warning!',
      text: "This project is using an older version of TouchDrawer. Some features may not work!",
      type: 'warning',
    })
  }
    
  swatches = loadedJSON.swatches[0];
  
  // select zoom tool and reset to default size
  if ($('[data-tools=zoom].active').is(':visible')) {
    $('[data-resetzoompos]').trigger('click');
  } else {
    $('[data-tools=zoom]').trigger('click');
    $('[data-resetzoompos]').trigger('click');
  }
 
  // clear history when a new project is created
  canvas.clear();
  lockHistory = false;
  undo_history = [];
  redo_history = [];
  undo_history.push(JSON.stringify(canvas));
  
  loadedSVGCode = loadedJSON.svg.toString();
  
}

// load svg file on drop
document.addEventListener("dragover", function(e) {
  e.preventDefault();
});
document.addEventListener("drop", function(e) {
  e.preventDefault();
});

// size presets
$('[data-size]').on('click', function() {
  str = $(this).attr('data-size');
  w = str.substr(0, str.indexOf('x'));
  h = str.substring(str.length, str.indexOf('x') + 1);
  
  $('[data-new=width]').val(w);
  $('[data-new=height]').val(h);
});
// init panzoom
var drawArea = document.querySelector('[data-canvas]');
var instance = panzoom(drawArea, {
  bounds: true,
  boundsPadding: 0.1
});
instance.pause();

// toggle canvas layers
$('[data-righticons] [data-layer]').on('click', function() {
  activeLayer = $(this).attr('data-layer');
  
  if ($('[data-righticons] [data-layer].active').is(':visible')) {
    $('[data-righticons] [data-layer].active').removeClass('active');
    $(this).addClass('active');
  } else {
    $(this).addClass('active');
  }
});

// initialize the canvas
var canvas = this.__canvas = new fabric.Canvas('canvas', {
  backgroundColor: '#fff',
  globalCompositeOperation: 'destination-atop',
  enableRetinaScaling: false,
  selectable: false
});
$('[data-tools=fillasbg] > div > div').css('background', document.getElementById("inkColor").value.toString());
canvas.setOverlayColor('transparent'.toString(),undefined,{erasable:false, globalCompositeOperation: 'source-over'});
fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = '#1faeff';

// clear history when a new project is created
lockHistory = false;
undo_history = [];
redo_history = [];
undo_history.push(JSON.stringify(canvas));
canvas.clear();

//// add groups as layers
//var roughGroup = new fabric.Group();
//var paintGroup = new fabric.Group();
//var highlightsGroup = new fabric.Group();
//var inkGroup = new fabric.Group();
//canvas.add(roughGroup);
//canvas.add(paintGroup);
//canvas.add(highlightsGroup);
//canvas.add(inkGroup);

canvas.setWidth(1280);
canvas.setHeight(800);
canvas.calcOffset();

canvas.renderAll();

// make first undo
undo_history.push(JSON.stringify(canvas));
redo_history.length = 0;


// toggle tools
// open tools menu
function openToolsMenu(tool) {
  removeEvents();
  canvas.selection = false;
  canvas.discardActiveObject();
  canvas.renderAll();
  $('[data-mainmenu], [data-dialog]').hide();
  $('[data-toolsmenu]').show();
  
  // detect active tool
  $('[data-selection]').hide();
  $('[data-toolsoption]').hide();
  $('[data-toolsoption='+ tool.toString().toLowerCase() +']').show();
  
  // is the tool menu
  document.getElementById("h-active-tool").innerHTML = tool.toString().toLowerCase();
  // zoom tool
  if (tool.toString().toLowerCase() === 'zoom') {
    canvas.selection = false;
    instance.resume();
  } else {
    canvas.selection = false;
    instance.pause();
    $('[data-toolsoption=zoom] button').removeClass('active');
  }
  
  // color picker tool
  if (tool.toString().toLowerCase() === 'colorpicker') {
    $('[data-toolsoption=colorpicker] button.active').trigger('click');
  }
  
  // other tools
  if (tool.toString().toLowerCase() === 'select') {
    $('[data-forselect]').hide();
    $('[data-selectall]').show();
    changeObjectSelection(true);
    canvas.isDrawingMode = false;
    canvas.selection = true;
    if (canvas.item(0)) {
      canvas.item(0)["hasControls"] = true;
      canvas.item(0)["hasBorders"] = true;
      canvas.item(0)["selectable"] = true;
      canvas.renderAll();
    }
  }
  if (tool.toString().toLowerCase() === 'fill') {
    changeObjectSelection(true);
    canvas.isDrawingMode = false;
  }
  if (tool.toString().toLowerCase() === 'eraser') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = parseFloat($('#brushSize').val());
    canvas.isDrawingMode = true;
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'pencil') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.strokeLineCap = $('#brushStrokeCap').val(); // butt / round / square
    canvas.freeDrawingBrush.strokeLineJoin = $('#brushStrokeLineJoin').val(); // bevel / round / miter
    canvas.freeDrawingBrush.strokeMiterLimit = $('#brushMiter').val();
    canvas.freeDrawingBrush.width = 1;
    canvas.freeDrawingBrush.color = document.getElementById("inkColor").value.toString();
    canvas.isDrawingMode = true;
  }
  if (tool.toString().toLowerCase() === 'autopen') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.strokeLineCap = $('#brushStrokeCap').val(); // butt / round / square
    canvas.freeDrawingBrush.strokeLineJoin = $('#brushStrokeLineJoin').val(); // bevel / round / miter
    canvas.freeDrawingBrush.strokeMiterLimit = $('#brushMiter').val();
    canvas.freeDrawingBrush.width = 1;
    canvas.freeDrawingBrush.color = document.getElementById("inkColor").value.toString();
    canvas.isDrawingMode = true;
    let points_array = [];
    let is_drawing = 0;

    canvas.on('mouse:down', (ev)=>{
      points_array = [];
      points_array.push([ev.pointer.x.toFixed(3), ev.pointer.y.toFixed(3)]);
      is_drawing = 1
    });
    canvas.on('mouse:move', (ev)=>{
      if (is_drawing == 1){
        points_array.push([ev.pointer.x.toFixed(3), ev.pointer.y.toFixed(3)]);
      }
    });
    canvas.on('mouse:up', (ev)=>{
      if (is_drawing == 1){
        points_array.push([ev.pointer.x.toFixed(3), ev.pointer.y.toFixed(3)]);
        is_drawing = 0;
        const myArray = {'label':"predict", 'points':points_array};
        const csrftoken = getCookie('csrftoken');

        $.ajax({
          url: "datacollect2",
          type: "POST",
          data: {"my_string": JSON.stringify(myArray)},
          beforeSend: function(xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
          },
          success: function(response) {
            console.log(response);
              // assuming we can extrant label from response
              let labels = svgArray.map(obj => obj.label);
              let label = response.message;
              // let label = "like";
              const index = svgArray.findIndex(function(svg) {
                return svg.label === label;
              });
            
              // if the SVG object was found, add it to the canvas
              if (index >= 0) {
                const svgObject = svgArray[index];
                const myObject = fabric.util.groupSVGElements(svgObject.objects, svgObject.options);
                const fabricObject = fabric.util.object.clone(myObject);
                fabricObject.set("stroke", document.getElementById("inkColor").value.toString());
                fabricObject.set("fill", document.getElementById("inkColor").value.toString());
                let x = points_array.reduce((acc, curr) => acc + parseFloat(curr[0]), 0) / points_array.length;
                let y = points_array.reduce((acc, curr) => acc + parseFloat(curr[1]), 0) / points_array.length;
                let x_coords = points_array.map(subarr => parseFloat(subarr[0]));
                let scaleX = (Math.max(...x_coords) - Math.min(...x_coords))/fabricObject.width;
                let y_coords = points_array.map(subarr => parseFloat(subarr[1]));
                let scaleY = (Math.max(...y_coords) - Math.min(...y_coords))/fabricObject.height;
                
                fabricObject.scaleX = scaleX;
                fabricObject.scaleY = scaleY;
                fabricObject.set({
                  left: x,
                  top: y,
                  originX: 'center',
                  originY: 'center'
                });
                var rem_stroke = canvas.getObjects()[canvas.getObjects().length -1];
                canvas.remove(rem_stroke);
                canvas.add(fabricObject);
              } else {
                console.error(`SVG object with label not found.`);
              }
          },
          error: function(xhr) {
            console.log(xhr.statusText);
          }
        });// end ajax
      
        // model.predict
      }
    });
  }
  if (tool.toString().toLowerCase() === 'brush') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.strokeLineCap = $('#brushStrokeCap').val(); // butt / round / square
    canvas.freeDrawingBrush.strokeLineJoin = $('#brushStrokeLineJoin').val(); // bevel / round / miter
    canvas.freeDrawingBrush.strokeMiterLimit = $('#brushMiter').val();
    canvas.freeDrawingBrush.width = parseFloat($('#brushSize').val());
    canvas.freeDrawingBrush.color = document.getElementById("inkColor").value.toString();
    canvas.isDrawingMode = true;
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'rect') {
    changeObjectSelection(false);
    drawRect();
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'ellipse') {
    changeObjectSelection(false);
    drawEllipse();
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'line') {
    changeObjectSelection(false);
    drawLine();
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'triangle') {
    changeObjectSelection(false);
    drawTriangle();
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'splatter') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
    canvas.freeDrawingBrush.width = parseFloat($('#brushSize').val());
    canvas.freeDrawingBrush.strokeLineCap = $('#brushStrokeCap').val(); // butt / round / square
    canvas.freeDrawingBrush.strokeLineJoin = $('#brushStrokeLineJoin').val(); // bevel / round / miter
    canvas.freeDrawingBrush.strokeMiterLimit = $('#brushMiter').val();
    canvas.freeDrawingBrush.color = document.getElementById("inkColor").value.toString();
    canvas.isDrawingMode = true;
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'spray') {
    changeObjectSelection(false);
    canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
    canvas.freeDrawingBrush.width = parseFloat($('#brushSize').val());
    canvas.freeDrawingBrush.strokeLineCap = $('#brushStrokeCap').val(); // butt / round / square
    canvas.freeDrawingBrush.strokeLineJoin = $('#brushStrokeLineJoin').val(); // bevel / round / miter
    canvas.freeDrawingBrush.strokeMiterLimit = $('#brushMiter').val();
    canvas.freeDrawingBrush.color = document.getElementById("inkColor").value.toString();
    canvas.isDrawingMode = true;
    $('[data-toolsoption=brushsize]').show();
  }
  if (tool.toString().toLowerCase() === 'fill') {
    floodFiller();
    // canvas.on("mouse:down", (options)=>{
    //   if (document.getElementById("h-active-tool").innerHTML.toString() == "fill"){
    //   }
    // });
    
    // $('[data-tools=fillasbg] > div > div').css('background', document.getElementById("inkColor").value.toString());
    // canvas.setBackgroundColor(document.getElementById("inkColor").value.toString(),undefined,{erasable:false});
    // canvas.renderAll();
    // undo_history.push(JSON.stringify(canvas));
    // redo_history.length = 0;
    // $('[data-tools=zoom]').trigger('click');
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

// Hide select tool options for when the object isn't selected
canvas.on('before:selection:cleared', function() {
  $('[data-forselect]').hide();
  $('[data-selectall]').show();
  $('[data-selectortool=ungroup]').hide();
});

// trigger tools
$('[data-triggertool]').on('click', function() {
  thisTool = $(this).attr('data-triggertool').toString().toLowerCase();
   $('[data-tools='+ thisTool +']').trigger('click');
});

// close tools menu
function closeToolsMenu() {
  removeEvents();
  canvas.selection = false;
  changeObjectSelection(false);
  canvas.discardActiveObject();
  canvas.renderAll();
  
  $('[data-mainmenu]').show();
  $('[data-toolsmenu], [data-dialog]').hide();
  $('[data-selection]').hide();
  instance.pause();
}
$('[data-tools]').on('click', function(val) {
  thisTool = $(this).attr('data-tools').toString().toLowerCase();
  val = thisTool;
  
  // if tool is not active
  if (!$('[data-tools].active').is(':visible')) {
    $(this).addClass('active');
    openToolsMenu(val);
  } else {
    // if tool is active
    // are you clicking on same tool or not?
    $(this).each(function(i) {
      // if you are remove the class
      if ($('[data-tools].active').attr('data-tools').toString().toLowerCase() === thisTool) {
        $('[data-tools].active').removeClass('active');
        closeToolsMenu()

        // if not remove the class from the original and then add it
      } else {
        $('[data-tools].active').removeClass('active');
        $(this).addClass('active');
        openToolsMenu(val);
      }
    });
  }
});

// change brush size
$('#brushSize, #brushStrokeCap, #brushStrokeLineJoin, #brushMiter').change(function() {
  var activeTool = $('[data-tools].active').attr('data-tools').toString().toLowerCase();
  openToolsMenu(activeTool);
});

// tools
function drawLine() {
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    var points = [pointer.x, pointer.y, pointer.x, pointer.y];
    line = new fabric.Line(points, {
      strokeWidth: parseFloat($('#brushSize').val()),
      strokeLineCap: $('#brushStrokeCap').val(), // butt / round / square
      strokeLineJoin: $('#brushStrokeLineJoin').val(), // bevel / round / miter
      strokeMiterLimit: $('#brushMiter').val(),
      // stroke: strokePickr.getColor().toRGBA().toString(),
      stroke: document.getElementById("inkColor").value.toString(),
      fill: null,
      originX: 'center',
      originY: 'center',
      centeredRotation: true,
      selectable: false
    });
    canvas.add(line);
  });
  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);
    line.set({
      x2: pointer.x,
      y2: pointer.y
    });
    canvas.renderAll();
  });
  canvas.on('mouse:up', function(o) {
    isDown = false;
    line.setCoords();
    if (lockHistory) return;
  //  console.log("object:modified");
    undo_history.push(JSON.stringify(canvas));
    redo_history.length = 0;
  });
}
function drawRect() {
  var rect, isDown, origX, origY;

  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    var pointer = canvas.getPointer(o.e);
    rect = new fabric.Rect({
      left: origX,
      top: origY,
      originX: 'left',
      originY: 'top',
      width: pointer.x - origX,
      height: pointer.y - origY,
      angle: 0,
      selectable: false,
      centeredRotation: true,
      strokeWidth: parseFloat($('#brushSize').val()),
      strokeLineCap: $('#brushStrokeCap').val(), // butt / round / square
      strokeLineJoin: $('#brushStrokeLineJoin').val(), // bevel / round / miter
      strokeMiterLimit: $('#brushMiter').val(),
      stroke: document.getElementById("inkColor").value.toString(),
      fill: 'rgba(0,0,0,0)',
      centeredRotation: true,
    });
    canvas.add(rect);
  });
  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);

    if (origX > pointer.x) {
      rect.set({
        left: Math.abs(pointer.x)
      });
    }
    if (origY > pointer.y) {
      rect.set({
        top: Math.abs(pointer.y)
      });
    }

    rect.set({
      width: Math.abs(origX - pointer.x)
    });
    rect.set({
      height: Math.abs(origY - pointer.y)
    });


    canvas.renderAll();
  });
  canvas.on('mouse:up', function(o) {
    isDown = false;
    rect.setCoords();
    if (lockHistory) return;
  //  console.log("object:modified");
    undo_history.push(JSON.stringify(canvas));
    redo_history.length = 0;
  });
}
function drawEllipse() {
  var ellipse, isDown, origX, origY;
  
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    ellipse = new fabric.Ellipse({
      left: pointer.x,
      top: pointer.y,
      rx: pointer.x - origX,
      ry: pointer.y - origY,
      angle: 0,
      strokeWidth: parseFloat($('#brushSize').val()),
      strokeLineCap: $('#brushStrokeCap').val(), // butt / round / square
      strokeLineJoin: $('#brushStrokeLineJoin').val(), // bevel / round / miter
      strokeMiterLimit: $('#brushMiter').val(),
      stroke: document.getElementById("inkColor").value.toString(),
      fill: 'rgba(0,0,0,0)',
      selectable: true,
      centeredRotation: true,
      originX: 'center',
      originY: 'center'
    });
    canvas.add(ellipse);
  });
  canvas.on('mouse:move', function(o){
      if (!isDown) return;
      var pointer = canvas.getPointer(o.e);
      var rx = Math.abs(origX - pointer.x)/2;
      var ry = Math.abs(origY - pointer.y)/2;
      if (rx > ellipse.strokeWidth) {
        rx -= ellipse.strokeWidth/2
      }
       if (ry > ellipse.strokeWidth) {
        ry -= ellipse.strokeWidth/2
      }
      ellipse.set({ rx: rx, ry: ry});

      if(origX>pointer.x){
          ellipse.set({originX: 'right' });
      } else {
          ellipse.set({originX: 'left' });
      }
      if(origY>pointer.y){
          ellipse.set({originY: 'bottom'  });
      } else {
          ellipse.set({originY: 'top'  });
      }
      canvas.renderAll();
  });
  canvas.on('mouse:up', function(o){
    isDown = false;
    ellipse.setCoords();
    if (lockHistory) return;
  //  console.log("object:modified");
    undo_history.push(JSON.stringify(canvas));
    redo_history.length = 0;
  });
}
function drawTriangle() {
  var triangle, isDown, origX, origY;
  
  canvas.on('mouse:down', function(o) {
    isDown = true;
    var pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    triangle = new fabric.Triangle({
      left: pointer.x,
      top: pointer.y,
      width: pointer.x - origX,
      height: pointer.y - origY,
      strokeWidth: parseFloat($('#brushSize').val()),
      strokeLineCap: $('#brushStrokeCap').val(), // butt / round / square
      strokeLineJoin: $('#brushStrokeLineJoin').val(), // bevel / round / miter
      strokeMiterLimit: $('#brushMiter').val(),
      stroke: document.getElementById("inkColor").value.toString(),
      fill: 'rgba(0,0,0,0)',
      selectable: false,
      centeredRotation: true,
      originX: 'left',
      originY: 'top'
    });
    canvas.add(triangle);
  });
  canvas.on('mouse:move', function(o) {
    if (!isDown) return;
    var pointer = canvas.getPointer(o.e);

    if (origX > pointer.x) {
      triangle.set({
        left: Math.abs(pointer.x)
      });
    }
    if (origY > pointer.y) {
      triangle.set({
        top: Math.abs(pointer.y)
      });
    }

    triangle.set({
      width: Math.abs(origX - pointer.x)
    });
    triangle.set({
      height: Math.abs(origY - pointer.y)
    });


    canvas.renderAll();
  });
  canvas.on('mouse:up', function(o) {
    isDown = false;
    triangle.setCoords();
    if (lockHistory) return;
  //  console.log("object:modified");
    undo_history.push(JSON.stringify(canvas));
    redo_history.length = 0;
  });
}
function enableSelection() {
  removeEvents();
  changeObjectSelection(true);
  canvas.selection = true;
}
function changeObjectSelection(value) {
  canvas.forEachObject(function (obj) {
    obj.selectable = value;
  });
  canvas.renderAll();
}
function removeEvents() {
  canvas.isDrawingMode = false;
  canvas.selection = false;
  canvas.off('mouse:down');
  canvas.off('mouse:up');
  canvas.off('mouse:move');
}

// undo redo commandhistory
canvas.on("object:added", function() {
  if (lockHistory) return;
//  console.log("object:added");
  undo_history.push(JSON.stringify(canvas));
  redo_history.length = 0;
//  console.log(undo_history.length);
});
canvas.on("path:created", function() {
  
});
canvas.on("object:modified", function() {
  if (lockHistory) return;
//  console.log("object:modified");
  undo_history.push(JSON.stringify(canvas));
  redo_history.length = 0;
//  console.log(undo_history.length);
});
canvas.on("selection:updated", function() {
  if (lockHistory) return;
//  console.log("object:modified");
  undo_history.push(JSON.stringify(canvas));
  redo_history.length = 0;
//  console.log(undo_history.length);
});

// select all then group command
$('[data-selectall]').click(function() {
  removeEvents();
  changeObjectSelection(true);
  canvas.isDrawingMode = false;
  $('.canvas-container').css('z-index', 1);
  $('.history').removeClass('hide');
  $('[data-selection=tools]').addClass('hide');
  
  selectall();
  canvas.renderAll();
});

function undo() {
  if (undo_history.length > 0) {
    lockHistory = true;
    if (undo_history.length > 1) redo_history.push(undo_history.pop());
    var content = undo_history[undo_history.length - 1];
    canvas.loadFromJSON(content, function () {
      canvas.renderAll();
      lockHistory = false;
    });
  }
}
function redo() {
  if (redo_history.length > 0) {
    lockHistory = true;
    var content = redo_history.pop();
    undo_history.push(content);
    canvas.loadFromJSON(content, function () {
      canvas.renderAll();
      lockHistory = false;
    });
  }
}
function selectall() {
  canvas.discardActiveObject();
  var sel = new fabric.ActiveSelection(canvas.getObjects(), {
    canvas: canvas,
  });
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
  $('[data-forselect]').show();
}
function copy() {
  // clone what are you copying since you
  // may want copy and paste on different moment.
  // and you do not want the changes happened
  // later to reflect on the copy.
  canvas.getActiveObject().clone(function(cloned) {
    _clipboard = cloned;
  });
}
function paste() {
  // clone again, so you can do multiple copies.
  _clipboard.clone(function(clonedObj) {
    canvas.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });
    if (clonedObj.type === 'activeSelection') {
      // active selection needs a reference to the canvas.
      clonedObj.canvas = canvas;
      clonedObj.forEachObject(function(obj) {
          canvas.add(obj);
      });
      // this should solve the unselectability
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }
    _clipboard.top += 10;
    _clipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
  });
  
  if (lockHistory) return;
//  console.log("object:modified");
  undo_history.push(JSON.stringify(canvas));
  redo_history.length = 0;
}
function duplicate() {
  copy();
  paste();
}
function remove() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.getActiveObjects().forEach((obj) => {
      canvas.remove(obj)
    });
    canvas.discardActiveObject().renderAll()
  }
  
  if (lockHistory) return;
//  console.log("object:modified");
  undo_history.push(JSON.stringify(canvas));
  redo_history.length = 0;
}

// transforms
function flipH() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentFlip = activeObj.get('flipX')
    if (currentFlip === true) {
      activeObj.set('flipX', false)
    } else {
      activeObj.set('flipX', true)
    }
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function flipV() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentFlip = activeObj.get('flipY')
    if (currentFlip === true) {
      activeObj.set('flipY', false)
    } else {
      activeObj.set('flipY', true)
    }
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function rotateCW() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentAngle = activeObj.get('angle')
//    activeObj.set('originX', "center")
//    activeObj.set('originY', "center")
    activeObj.set('angle', currentAngle + 90)
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function rotateCCW() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    var currentAngle = activeObj.get('angle')
//    activeObj.set('originX', "center")
//    activeObj.set('originY', "center")
    activeObj.set('angle', currentAngle - 90)
    activeObj.setCoords();
    canvas.renderAll();
  }
}

// Align the selected object
function process_align(val, activeObj) {
  //Override fabric transform origin to center
  fabric.Object.prototype.set({
    originX: 'center',
    originY: 'center',
  });

  const bound = activeObj.getBoundingRect()

  switch (val) {
    case 'left':
      activeObj.set({
        left: activeObj.left - bound.left 
      });
      break;
    case 'right':
      activeObj.set({
        left: canvas.width - bound.width/2
      });
      break;
    case 'top':
      activeObj.set({
        top: activeObj.top - bound.top
      });
      break;
    case 'bottom':
      activeObj.set({
        top: canvas.height - bound.height/2
      });
      break;
    case 'center':
      activeObj.set({
        left: canvas.width / 2
      });
      break;
    case 'middle':
      activeObj.set({
        top: canvas.height / 2
      });
      break;
  }
}

// Assign alignment
function alignLeft() {
  var cur_value = 'left';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
};
function alignCenter() {
  var cur_value = 'center';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignRight() {
  var cur_value = 'right';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignTop() {
  var cur_value = 'top';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignMiddle() {
  var cur_value = 'middle';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}
function alignBottom() {
  var cur_value = 'bottom';
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (cur_value != '' && activeObj) {
    process_align(cur_value, activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  } else {
    alertify.error('No item selected');
    return false;
  }
}

// layers
var objectToSendBack;
canvas.on("selection:created", function(event){
  objectToSendBack = event.target;
});
canvas.on("selection:updated", function(event){
  objectToSendBack = event.target;
});
function sendBackwards() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.sendBackwards(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function sendToBack() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.sendToBack(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function sendForward() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.bringForward(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function sendToFront() {
  var activeObj = canvas.getActiveObject() || canvas.getActiveGroup();
  if (activeObj) {
    canvas.bringToFront(activeObj);
    activeObj.setCoords();
    canvas.renderAll();
  }
}
function ungroup() {
  var activeObject = canvas.getActiveObject();
  if(activeObject.type=="group"){
    var items = activeObject._objects;
    activeObject._restoreObjectsState();
    canvas.remove(activeObject);
    for(var i = 0; i < items.length; i++) {
      canvas.add(items[i]);
      canvas.item(canvas.size()-1).hasControls = true;
    }

    canvas.renderAll();
  }
}
function group() {
  if (!canvas.getActiveObject()) {
    return;
  }
  if (canvas.getActiveObject().type !== 'activeSelection') {
    return;
  }
  canvas.getActiveObject().toGroup();
  canvas.requestRenderAll();
  
  // used to detect the object type
  var activeObject = canvas.getActiveObject();
  if(activeObject.type === "group") {
    $('[data-selectortool=ungroup]').show();
  }
}
function floodFiller(){
  floodFill(true);
}
function fillTool() {
  canvas.discardActiveObject();
  return;
  
  var obj = canvas.getActiveObject();
  // detect if it's a fill
  if (obj.hasFill()) {
    obj.set('fill', document.getElementById("inkColor").value.toString());
  } else {
//    obj.set('stroke', null);
    obj.set('stroke', document.getElementById("inkColor").value.toString());
  }
  
  // detect if it's a stroke
  if (obj.hasStroke()) {
    obj.set('stroke', document.getElementById("inkColor").value.toString());
  } else {
//    obj.set('stroke', null);
    obj.set('fill', document.getElementById("inkColor").value.toString());
  }
//  var id = canvas.getObjects().indexOf(e.target);
//  canvas.setActiveObject(canvas.item(id));
  canvas.discardActiveObject();
  canvas.renderAll();
  canvas.renderAll();
}
canvas.on('selection:created', function() {
  if ($('[data-tools=fill].active').is(':visible')) {
    if ($('[data-tools=fill].active').is(':visible')) {
      fillTool();
    }
  }
  
  // show ungroup icon if a group is selected while the select tool is active
  if ($('[data-tools=select].active').is(':visible')) {
    $('[data-forselect]').show();

    // used to detect the object type
    var activeObject = canvas.getActiveObject();
    if(activeObject.type === "group") {
      $('[data-selectortool=ungroup]').show();
    }
  }
});
canvas.on('selection:updated', function() {
  if ( $('[data-tools=fill].active').is(':visible')) {
    if ($('[data-tools=fill].active').is(':visible')) {
      fillTool();
    }
  }
});
canvas.on('mouse:over', function(event) {
  if ($('[data-tools=fill].active').is(':visible')) {
    if (event.target != null) {
      event.target.hoverCursor = 'pointer';
    }
  }
});
canvas.on('touch:gesture', function(event) {
  // canvas stays the same size it just zooms and pans all within the canvas

  // // detect if select tool is active
  // if ($('[data-tools=select].active').is(':visible')) {
  //   if (event.e.touches && event.e.touches.length == 2) {
  //     // Get event point
  //     var point = new fabric.Point(event.self.x, event.self.y);
  //     // Remember canvas scale at gesture start
  //     if (event.self.state == "start") {
  //       zoomStartScale = self.canvas.getZoom();
  //     }
  //     // Calculate delta from start scale
  //     var delta = zoomStartScale * event.self.scale;
  //     // Zoom to pinch point
  //     self.canvas.zoomToPoint(point, delta);
  //   }
  // }
});

// export png or svg
function downloadImage() {
  var ext = "png";
  var base64 = canvas.toDataURL({
    format: ext,
    enableRetinaScaling: false
  });
  var link = document.createElement("a");
  link.href = base64;
  projectname = $("[data-projectname]")[0].textContent.toLowerCase().replace(/ /g, "-");
  link.download = projectname + `.${ext}`;
  link.click();
};
function downloadSVG() {

  var svg = canvas.toSVG();
  var a = document.createElement("a");
  var blob = new Blob([svg], { type: "image/svg+xml" });
  var blobURL = URL.createObjectURL(blob);
  a.href = blobURL;
  projectname = $("[data-projectname]")[0].textContent.toLowerCase().replace(/ /g, "-");
  a.download = projectname + ".svg";
  a.click();
  URL.revokeObjectURL(blobURL);
};
function downloadPNGWithFilters() {
  
  var dataURL = canvas.toDataURL('image/png');
  var link = document.createElement('a');
  link.href = dataURL;
  link.download = projectname = $("[data-projectname]")[0].textContent.toLowerCase().replace(/ /g, "-");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
function downloadSVGWithFilters() {  
  var svg = canvas.toSVG();
  var str = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg';

  var a = document.createElement("a");
  var blob = new Blob([svg], { type: "image/svg+xml" });
  var blobURL = URL.createObjectURL(blob);
  a.href = blobURL;
  projectname = $("[data-projectname]")[0].textContent.toLowerCase().replace(/ /g, "-");
  a.download = projectname + ".svg";
  a.click();
  URL.revokeObjectURL(blobURL);
}

// toggle dialogs
function openDialog(dialog) {
  // detect active tool
  $('[data-dialogs] [data-dialog]').hide();
  $('[data-dialogs] [data-dialog='+ dialog.toString().toLowerCase() +']').show();
}
function closeDialogs() {
  $('[data-dialogs] [data-dialog]').hide();
}

// reset zoom position
$('[data-resetzoompos]').click(function() {
  $('[data-canvas]').css('transform-origin', '')
                    .css('transform', '');
  instance.restore();
});

// click frame to open in editor
function getFrameCode(event) {
  var group = [];
  var svgCode = event.outerHTML;
  
  fabric.loadSVGFromString(svgCode.toString(),function(objects,options) {
      var loadedObjects = new fabric.Group(group);
      loadedObjects.set({
        x: 0,
        y: 0
      });
      canvas.centerObject(loadedObjects);
      canvas.add(loadedObjects);
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
  },function(item, object) {
      object.set('id',item.getAttribute('id'));
      group.push(object);
  });
  
  if ($('[data-tools].active').is(':visible')) {
    // deselect and reselect active tool
    var activeTool = $('[data-tools].active').attr('data-tools');
    $('[data-tools].active').trigger('click');
    $('[data-tools='+ activeTool +']').trigger('click');
  } else {
    // no active tool selected use select tool by default
    $('[data-tools=zoom]').trigger('click');
  }
}
canvas.on('selection:created', function(event) {
  if ($('[data-tools=zoom].active').is(':visible')) {
    removeEvents();
    changeObjectSelection(true);
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.discardActiveObject();
    canvas.renderAll();
    return false;
  }
});

undo();

// export files
function getProjectJSON() {
  projectJSON = {
    "version": version,
    "settings": [{
      "name": $('[data-projectname]')[0].textContent,
    }],
    swatches,
    "svg": canvas.toSVG()
  };
};
function exportJSON() {
  getProjectJSON();
  var projectname = $('[data-projectname]')[0].textContent.toLowerCase().replace(/ /g, "-")
  if (!$('[data-projectname]')[0].textContent.toLowerCase().replace(/ /g, "-")) {
    projectname = $('[data-projectname]')[0].textContent = "_TouchDrawer";
  }
  var blob = new Blob([JSON.stringify(projectJSON)], {type: "application/json;charset=utf-8"});
  saveAs(blob, projectname + "_TouchDrawer.json");
}

// hide tools options onload
$('[data-toolsmenu]').hide();
$('[data-toolsmenu] [data-toolsoption]').hide();

// hide dialogs onload
$('[data-dialogs] [data-dialog]').hide();

// shortcut keys
window.addEventListener("keydown", function(e) {
//  // (CMD+N)
//  if ( e.metaKey && e.keyCode == 78 ) {
//    //
//  }
//  // (CMD+S)
//  if ( e.metaKey && e.keyCode == 83 ) {
//    //
//  }
  // (SHIFT+CTRL+Z)
  if ( e.shiftKey && e.ctrlKey && e.keyCode == 90 ) {
    redo();
    return false;
  }
  // (CTRL+Z)
  if ( e.ctrlKey && e.keyCode == 90 ) {
    undo();
  }
  // (DEL)
  if ( e.keyCode == 46 ) {
    if ($('[data-tools=select].active').is(':visible')) {
      remove();
    }
    return false;
  }
});

// init zoom tool onload
$('[data-tools=colorpicker]').trigger('click');
$('[data-tools=colorpicker]').trigger('click');
setTimeout(function() {

  $('[data-tools=zoom]').trigger('click');
//  $('[data-tools=select]').trigger('click');
//  $('[data-tools=brush]').trigger('click');
}, 300);
//$('[data-tools=brush]').trigger('click');
//$('[data-tools=ellipse]').trigger('click');