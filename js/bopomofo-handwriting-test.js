//
//iOS 10.3.4 Safari 
//  replace const, let with var
//  CSS touch-action: none; no function, put preventDefault in touchstart
//
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var outputElement = document.getElementById('output');
var clearBtn = document.getElementById('clearBtn');
var outputBtn = document.getElementById('outputBtn');
var undoBtn = document.getElementById('undoBtn');
var bopomofo = document.getElementById('bopomofo');

var isDrawing = false;
var currentStroke = [];
var strokes = [];  // 存所有字的筆畫
var boundingBoxes = []; // 存所有筆畫的邊框
var drawingTimeoutId = -1;

/**
 * Pointer position (relative to canvas)
 * @param {Object} e
 * @return {Object}
 */
function getCoords(e) {
  var rect = canvas.getBoundingClientRect();			
  return {
	  x: (e['clientX'] - rect.left),
	  y: (e['clientY'] - rect.top)
  };
}

function removeUnusedListener(e) {
  var isTouch = e.touches;
  canvas.removeEventListener(!isTouch ? 'touchstart' : 'mousedown', onStartDrawing);
  canvas.removeEventListener(!isTouch ? 'touchmove' : 'mousemove', onDrawing);
  canvas.removeEventListener(!isTouch ? 'touchend' : 'mouseup', onStopDrawing);
  //canvas.removeEventListener(!isTouch ? 'touchcancel' : 'mouseout', onCancilDrawing);
}
function onStartDrawing(e) {
  removeUnusedListener(e);

  e.preventDefault();
  e.stopPropagation();

	
  try{clearTimeout(drawingTimeoutId);}catch(err){}
	
  isDrawing = true;
  currentStroke = [];
  if(e.touches) e = e.changedTouches[0]; //暫時只取第一觸控
  var pos = getCoords(e);
  currentStroke.push(pos);
}
function onDrawing(e) {
  if (!isDrawing) return;

  e.preventDefault();
  e.stopPropagation();
  
  if(e.touches) e = e.changedTouches[0]; //暫時只取第一觸控
  var pos = getCoords(e);
  currentStroke.push(pos);
	
  ctx.strokeStyle = 'black';
  ctx.setLineDash([]); //solid line
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;			
  ctx.beginPath();
  ctx.moveTo(currentStroke[currentStroke.length - 2].x, currentStroke[currentStroke.length - 2].y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}
function onStopDrawing(e) {
  if (currentStroke.length > 1) {
    strokes.push(currentStroke);
    updateBoundingBox(currentStroke);
  }
  isDrawing = false;

  drawingTimeoutId = setTimeout(outputStrokes, 1500);
}

// 判斷兩個矩形是否重疊
function isRectangleOverlap(rect1, rect2) {
  return !(rect1[0] + rect1[2] < rect2[0] || // rect1 is to the left of rect2
    rect1[0] > rect2[0] + rect2[2] || // rect1 is to the right of rect2
    rect1[1] + rect1[3] < rect2[1] || // rect1 is above rect2
    rect1[1] > rect2[1] + rect2[3]);  // rect1 is below rect2
}

// 重疊就放入同一個陣列中(合併)
function groupStrokes(strokes) {
  var result = [];
  var currentGroup = [];
  var lastBoundingBox = [];
  var currentBoundingBox = [];

  for (var stroke of strokes) {
    if (currentGroup.length === 0) {
      currentGroup.push(stroke);
      lastBoundingBox = getBoundingBox(stroke);
    } else {
      var isMerged = false;
      currentBoundingBox = getBoundingBox(stroke);

      if (isRectangleOverlap(lastBoundingBox, currentBoundingBox)) {
        currentGroup.push(stroke);
        isMerged = true;
        lastBoundingBox = mergeBoundingBox(lastBoundingBox, currentBoundingBox);
      }

      if (!isMerged) {
        result.push(currentGroup);
        currentGroup = [stroke];
        lastBoundingBox = currentBoundingBox;
      }
    }
  }

  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}
function groupStrokes(strokes) {
  var result = [];
  var box = [];			
  strokes.forEach(stroke=>{
    box = getBoundingBox(stroke);
    for (var i=0; i<boundingBoxes.length; i++) {
      if (isRectangleOverlap(box, boundingBoxes[i])) {
        if(!result[i]) {
          result[i] = [];
        }
        result[i].push(stroke);
        break;
      }
    }
  });
  return result;
}

// 計算每一個筆畫的邊界框
function getBoundingBox(stroke) {
  var d = 5; //稍加大範圍
  var xs = stroke.map(p => p.x);
  var ys = stroke.map(p => p.y);
  var minX = Math.min(...xs) - d;
  var maxX = Math.max(...xs) + d;
  var minY = Math.min(...ys) - d;
  var maxY = Math.max(...ys) + d;
  var sizeX = Math.max(maxX - minX, 10); //橫豎有可能太小,至少 10
  var sizeY = Math.max(maxY - minY, 10); //橫豎有可能太小,至少 10
  return [minX, minY, sizeX, sizeY];
}
function mergeBoundingBox(box1, box2) {
  var minX = Math.min(box1[0], box2[0]);
  var minY = Math.min(box1[1], box2[1]);
  var maxX = Math.max(box1[0]+box1[2], box2[0]+box2[2]);
  var maxY = Math.max(box1[1]+box1[3], box2[1]+box2[3]);
  var sizeX = Math.max(maxX - minX, 10); //橫豎有可能太小,至少 10
  var sizeY = Math.max(maxY - minY, 10); //橫豎有可能太小,至少 10
  return [minX, minY, sizeX, sizeY];
}

// 計算每一個筆畫的邊界框並畫紅框
function updateBoundingBox(stroke) {
  var boundingBox = getBoundingBox(stroke);

  // 檢查是否和前一個框重疊
  var isMerged = false;
  var overlapIndex = -1;
  var box = [];
  for (var i=0; i<boundingBoxes.length; i++) {
    box = boundingBoxes[i];
    if (isRectangleOverlap(box, boundingBox)) {
      isMerged = true;
      overlapIndex = i;
      break;
    }
  }

  if (!isMerged) {
    // 畫紅色虛框
    dashedBox(boundingBox);

    // 記錄這個字的邊框
    boundingBoxes.push(boundingBox);
  } else {
    boundingBoxes[overlapIndex] = mergeBoundingBox(box, boundingBox);
    redraw();
  }
  updateBoundingBoxAgain();
}
function updateBoundingBoxAgain() {
  var mergedIndex = [];
  var overlapIndex = 0;
  var box = [];
  for (var i=1; i<boundingBoxes.length; i++) {
    box = boundingBoxes[i];
    if (isRectangleOverlap(box, boundingBoxes[overlapIndex])) {
      mergedIndex.push(i);
      boundingBoxes[overlapIndex] = mergeBoundingBox(boundingBoxes[overlapIndex], box);
      break;
    } else {
      overlapIndex = i;
    }
  }

  if (mergedIndex.length >= 0) {
    //delete boundingBox merged
    for(var i=mergedIndex.length-1; i>=0; i--) {
      boundingBoxes.splice(mergedIndex[i], 1);
    }
    redraw();
  }
}

// 更新畫布, 重繪合併後的所有筆畫和紅框
function redraw() {
  // 清空畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  gridLines();

  // 重繪所有筆畫
  for (var stroke of strokes) {
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.setLineDash([]); //solid line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (var i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }

  // 重繪所有紅框
  for (var box of boundingBoxes) {
    dashedBox(box);
  }
}
function dashedBox(box) {
  ctx.strokeStyle = '#ff000050';
  ctx.setLineDash([10, 5]); //dash line [10, 5]
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(box[0], box[1], box[2], box[3]);
  ctx.stroke();
}
function gridLines() {
  // Draw vertical lines
  var cellSize = 50;
  ctx.strokeStyle = '#c0c0c050';
  ctx.setLineDash([]); //dash line
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var x = 0; x <= canvas.width; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  // Draw horizontal lines
  for (var y = 0; y <= canvas.height; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

// 輸出辨識結果
async function outputStrokes() {

  try{clearTimeout(drawingTimeoutId);}catch(err){}

  var groupedStrokes = groupStrokes(strokes);
  var result = '';
  var data, stroke, words;
  var phList = [], ph, phWord, html, tone;
  var inputList = [];
  var phTemp = [];

  function getTone(r, t, v) {
    var ch;
    for(var i=0; i<r.length; i++) {
      ch = Array.from(r[i])[0]; //只取第一個字
      if(t.indexOf(ch) >= 0) {
        return v;
      }
    }
    return '';
  }

  for(var i=0; i<groupedStrokes.length; i++) {
    stroke = groupedStrokes[i];
    data = getPostDataByStroke(stroke, canvas);
    if(data) {
      words = await fetchHandwritingResult(data);
      //console.log(words);
      result += JSON.stringify(words) + '\n';

      ph = getPh(words);

      if(ph.length ==0 && (phTemp.length > 0 || (inputList.length > 0 && getPh(Array.from(inputList[inputList.length-1])).length > 0))) {
        //ˊˇˋ˙
		if(  
             (tone=getTone(words, '/／丿', 'ˊ')) 
          || (tone=getTone(words, 'VVv∨✓√ⅴⅤ', 'ˇ')) 
          || (tone=getTone(words, '、丶＼\\', 'ˋ'))
		  || (tone=getTone(words, '.°。^', '˙'))
		  ){
          ph = [tone];
        } else if(words.indexOf('一') >= 0) {
          ph = ['ㄧ']
        }
      }

      if(ph && ph[0]) {
        phList.push(ph[0]);
        phTemp.push(ph[0]);
      } else {
        if(phTemp.length > 0) {
          //將前面的注音解析後加入
          phTemp = splitZhuyin(phTemp.join('')); //注音
          if(phTemp.length > 0) {
            inputList = inputList.concat(phTemp);
          }
        }
        inputList.push(words[0]);  //國字
        phTemp = [];
      }
    }
  }
  if(phTemp.length > 0) { //最後殘留的注音
    phTemp = splitZhuyin(phTemp.join('')); //注音
    if(phTemp.length > 0) {
      inputList = inputList.concat(phTemp);
    }
  }
  console.log(inputList);

  outputElement.textContent = result;

  //test over the previous html
  Array.from(bopomofo.children).forEach(c=>c.remove());
  html = ''; //<br>';
  inputList.forEach(v=>{
    if(getPh(Array.from(v)).length > 0) {
      html += '<ruby>　<rt>' + splitZhuyin(v) + '</rt></ruby>';
    } else {
      html += '<ruby>' + v + '</ruby>';
    }
  });
  bopomofo.innerHTML = html;
  void bopomofo.offsetWidth; // 讀取 offsetWidth 觸發重繪
  Array.from(bopomofo.children).forEach(c=>void c.offsetWidth);

  //整個辨識看看
  data = getPostDataByStroke(null, canvas);
  if(data) {
    words = await fetchHandwritingResult(data);
    console.log(words);
    if(words) {
      outputElement.textContent = '===整個畫布一次辨識\n' +  JSON.stringify(words) + '\n===\n' + outputElement.textContent;
    }
  }

}


function getPh(r) {
  var allPhSymbol = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦˊˇˋ˙";
  var list = [];
  r.forEach(v=>{
    if(allPhSymbol.indexOf(v) >= 0) {
      list.push(v);
    }
  });
  //如果ㄑㄥ都有,讓ㄥ優先
  var qIndex = list.indexOf('ㄑ'); 
  var engIndex = list.indexOf('ㄥ');
  if(qIndex >= 0 && engIndex >= 0 && engIndex > qIndex) {
    list[engIndex] = 'ㄑ';
	list[qIndex] = 'ㄥ';
  }
  return list;
}
function makeRequestHandwriting(data) {
  return new Promise(function(resolve, reject) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8");
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
    resolve(xhr.responseText); // Resolve with the response text
    } else {
    reject(new Error(xhr.statusText)); // Reject with an error
    }
  };
  xhr.onerror = function() {
    reject(new Error("Network error")); // Handle network errors
  };
  xhr.setRequestHeader("content-type", "application/json");
  xhr.send(data);
  });
}
function getPostDataByStroke(stroke, canvas) {
  var ready = false;
  var trace = [];
  if((!stroke || stroke.length < 1) && typeof(strokes)!='undefined' && strokes!=null && strokes.length > 0) {
    //沒傳參數就整個畫布的筆跡辨識
    stroke = strokes;
  }
  if(stroke && stroke.length > 0) {
    stroke.forEach(s => {
      var points = [[], []];
      if(typeof(window['simplify']) == 'function') {
        var path = window['simplify'](s, 1, true);
		console.log(s, ' ==> ', path);
        path.forEach(p => {
          points[0].push(Math.round(p.x));
          points[1].push(Math.round(p.y));
        });
      } else {
        s.forEach(p=>{
          points[0].push(Math.round(p.x));
          points[1].push(Math.round(p.y));
        });
      }
      trace.push(points);
      if (points[0].length > 1)
      ready = true;
    });
  }
  var options = {};
  options.width = canvas.width;
  options.height = canvas.height;
  //options.language = (gameMode.trim() == '數學' ? 'en' : 'zh_TW');
  //console.log(ready, trace);
  var data;
  if (ready) {
    data = JSON.stringify({
    "options": "enable_pre_space",
    "requests": [{
      "writing_guide": {
        "writing_area_width": options.width || this.width || undefined,
        "writing_area_height": options.height || this.width || undefined
      },
      "ink": trace,
      "language": options.language || "zh_TW"
      }
    ]
    });
  }
  return data;
}
async function fetchHandwritingResult(data) {
  var result;
  try {
  result = await makeRequestHandwriting(data);
  result = JSON.parse(result)[1][0][1];
  } catch (error) {
  console.error("Error fetching data:", error);
  }
  return result;
}

// 停筆後自動輸出結果
//setInterval(outputStrokes, 1000);  // 每秒更新输出

//依注音拼寫規則分解注音字串為陣列
function splitZhuyin(str) {
  var initials = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ";
  var medials = "ㄧㄨㄩ";
  var finals = "ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ";
  var tones = "ˊˇˋ˙";
  var enableValidCheck = false;

  var result = [];
  var buffer = "";
  var pendingLightTone = false; // 前置 ˙ 暫存

  var isInitial = ch => initials.includes(ch);
  var isMedial  = ch => medials.includes(ch);
  var isFinal   = ch => finals.includes(ch);
  var isTone    = ch => tones.includes(ch);

  function hasFinalPart(s) {
  return [...s].some(c => isFinal(c));
  }

  function hasMedialPart(s) {
  return [...s].some(c => isMedial(c));
  }

  function isValidSyllable(syllable) {
  if(!enableValidCheck) return true;

  if (![...syllable].some(c => isMedial(c) || isFinal(c))) {
    return /^[ㄓㄔㄕㄖㄗㄘㄙㄦ]$/.test(syllable);
  }
  if (syllable.includes("ㄩ") &&
    [...syllable].some(c => "ㄅㄆㄇㄈㄓㄔㄕㄖㄗㄘㄙ".includes(c))) {
    return false;
  }
  return true;
  }

  function closeSyllable() {
  if (!buffer) return;
  var syll = buffer;
  // 若有前置輕聲 → 把 ˙ 放到前面
  if (pendingLightTone && ![...syll].some(isTone)) {
    syll = "˙" + syll;
  }
  // 若後置輕聲 → 移到前面
  if (syll.endsWith("˙")) {
    syll = "˙" + syll.slice(0, -1);
  }
  if (isValidSyllable(syll)) {
    result.push(syll);
  }
  buffer = "";
  pendingLightTone = false;
  }

  //修正辨識 ㄥ 變 ㄑ 的問題
  function fixOng(ph) {
  var indices = findAllOccurrences(ph, 'ㄑ');
  ph = Array.from(ph);
  var last = ph.length - 1;
  var found = -1;
  var index, next;
  for(var i=0; i<indices.length; i++) {
    index = indices[i];
    next = ph[index+1];
    if(!next) {  //結尾
    ph[index] = 'ㄥ';
    } else if (isInitial(next) || isTone(next)) { //後接聲母或是調號
    ph[index] = 'ㄥ';
    }
  }
  return ph.join('');
  }
  function findAllOccurrences(mainString, subString) {
  var indices = [];
  var startIndex = 0;
  var foundIndex;

  while ((foundIndex = mainString.indexOf(subString, startIndex)) !== -1) {
    indices.push(foundIndex);
    startIndex = foundIndex + 1; // Start the next search after the current match
  }

  return indices;
  }

  //if(typeof(str)!='string') {
  //  str = str.join(''); //array to string
  //}
  //str = str.replace(/\s/g, ''); //remove all space
  //console.log(str);
  //str = fixOng(str);

  for (var i = 0; i < str.length; i++) {
    var ch = str[i];

    if (ch === "˙" && buffer.length === 0) {
      pendingLightTone = true;
      continue;
    }

    buffer += ch;
    var next = str[i + 1];

    if (isTone(ch) && ch !== "˙") {
      closeSyllable();
    } else if (ch === "˙") {
      closeSyllable();
    } else if (next) {
      if (isInitial(next)) {
        closeSyllable();
      } else if (isMedial(next) || isFinal(next)) {
        if (hasFinalPart(buffer) || (hasMedialPart(buffer) && isMedial(next))) {
          closeSyllable();
        }
      }
    }
  }

  if (buffer) closeSyllable();

  return result;
}

function init() {

  gridLines();
  //document.querySelector('#HTML5FunWrapper').style.visibility = 'visible';
  isDrawing = false;
  currentStroke = [];
  strokes = [];
  boundingBoxes = [];
  drawingTimeoutId = -1;

  //add listeners
  canvas.addEventListener('mousedown', onStartDrawing);
  canvas.addEventListener('mousemove', onDrawing);
  canvas.addEventListener('mouseup', onStopDrawing);
  canvas.addEventListener('touchstart', onStartDrawing, { passive: false });
  canvas.addEventListener('touchmove', onDrawing);
  canvas.addEventListener('touchend', onStopDrawing);

  // 清除畫布
  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gridLines();
    strokes = [];
    boundingBoxes = [];
    outputElement.textContent = '';
    bopomofo.innerHTML = '';
  });
  undoBtn.addEventListener('click', () => {
    strokes.splice(strokes.length-1, 1);
    boundingBoxes = [];
    strokes.forEach(stroke=>updateBoundingBox(stroke));
    redraw();
    outputStrokes();
  });
  outputBtn.addEventListener('click', () => {
    outputElement.textContent = '';
    outputStrokes();
  });
}

init();
