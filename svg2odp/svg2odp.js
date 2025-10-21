/** 
 * svg2odp.js
 *
 * Convert SVG to LibreOffice Impress ODP file.
 * SVG flatten with flatten.js, merge and export to ODP with JSZip.
 *
 * Credits: 
 *  flatten.js (https://github.com/inloop/svg2android)
 *  jszip.min.js (https://stuk.github.io/jszip/)
 *
 * Author: G.S.Yan (https://gsyan888.blogspot.com/)
 * Create: 2025.04.27
 *
 */ 
//啟動檔案輸入的監聽
function startFileInputListener() {
	const dropArea = document.getElementById('drop-area');
	const fileInput = document.getElementById('file-input');
	const pasteInput = document.getElementById('paste-input');
	if(dropArea && fileInput) {
		//監聽 drag & drop
		dropArea.addEventListener('dragover', (event) => {
			event.preventDefault();
			dropArea.classList.add('dragging');
		});
		dropArea.addEventListener('dragleave', () => {
			dropArea.classList.remove('dragging');
		});
		dropArea.addEventListener('drop', (event) => {
			event.preventDefault();
			dropArea.classList.remove('dragging');
			const files = event.dataTransfer.files;
			handleFiles(files);
		});
		dropArea.onclick = function(e) {
			fileInput.click();
		};
		//監聽貼上資料,檔案
		pasteInput.addEventListener('paste', handlePaste);

		//監聽檔案選取
		fileInput.addEventListener('change', (event) => {
			const files = event.target.files;
			handleFiles(files);
		});
	}
}
//處理檔案
function handleFiles(files) {
	loadTemplate();

	for(var i=0; i<files.length; i++) {
		var file = files[i];
		if(/image\/svg/i.test(file.type)) {
			const reader = new FileReader();
			reader.onload = (event) => {					
				const svgWrapper = document.querySelector('#svgWrapper');
				const parser = new DOMParser();
				const svgDoc = parser.parseFromString(event.target.result, 'image/svg+xml');
				const svgElement = svgDoc.documentElement;
				
				//筆順的會有 id 放一個字, 是筆順的, 就試著將合併的 path 分解, 解決筆畫重疊的問題
				if(typeof(svgElement.id)=='string' && svgElement.id != '' && svgElement.id.replace(/[a-zA-Z0-9\-_]/g, '') == svgElement.id) {
					console.log('break merged path ...');
					breakPath(svgElement);	//Break SVG merged path
				}
				
				//svgWrapper.appendChild(svgElement); // Add SVG to the document
				var svgContainer = document.createElement('div');
				svgContainer.setAttribute('class', 'svg-container');
				svgContainer.setAttribute('filename', file.name); //將圖檔檔名記下備用
				svgContainer.title = file.name;
				svgContainer.appendChild(svgElement);								
				svgWrapper.appendChild(svgContainer);
				
				flatten(svgElement, true); //將 SVG 語法簡單化

				var btn = document.createElement('button');
				btn.setAttribute('class', 'removeBtn');
				btn.innerHTML = '❌'; //'⛔';
				btn.title = '[X] 不使用這張圖';
				btn.onclick = function(e) {
					this.parentElement.remove();
					if(svgWrapper.children.length < 1) {
						document.querySelector('#result-area').style.display = 'none';
					}
				};
				svgContainer.appendChild(btn);
				
				//檢查 SVG 語法, 帶有 transform 者, 加鎖頭
				var withTranform = /\s+transform/i.test(svgElement.innerHTML);
				var label = document.createElement('label');
				label.setAttribute('class', 'groupLabel');
				label.innerHTML = withTranform ? '🔒':'🔓'; //'🎵' : '🎶';
				label.title = withTranform ? '以整張圖加入':'可解除群組';
				svgContainer.appendChild(label);
				
			};
			reader.readAsText(file);
		} else {
			console.log(file);
		}
	}
	document.querySelector('#result-area').style.display = 'block';
}
function handlePaste(e) {
	//console.log(e);
	//console.log(e.clipboardData);			
	e.preventDefault();
	setTimeout(function(){
		e.target.innerHTML = '';
		try{document.querySelector('#file-input').focus();}catch(e){};
	}, 250);
	var data = (e.clipboardData || window.clipboardData);
	items = data.items;
	for (var i = 0; i < items.length; i++) {
		if (items[i].type.indexOf('image/svg') >= 0) {
			var blob = items[i].getAsFile();
			handleFiles([blob]);
		} else if(items[i].type.indexOf('text/plain') >= 0) {
			items[i].getAsString(async(txt)=> {
				var filename = '未命名.svg';
				if(/^https:\/\//.test(txt)) {
					//是網址的就先下載內容
					if(txt.indexOf('https://openclipart.org/detail/') >= 0) {	//openclipart 的網址
						txt = txt.replace('/detail/', '/download/') + '.svg';
					}
					var m = null;
					if((m = txt.match(/([a-z0-9\_\-\.]+\.svg)$/i))) {
						m = m[1];
					}
					var nocacheVal = (txt.indexOf('?')>=0 ? '&':'?') + 'nocache=' + new Date().getTime();	//為了避免 cache 的問題,在檔名後加亂數
					try {
						var rs = await fetch('https://www.corsproxy.io?'+encodeURIComponent(txt + nocacheVal));
						txt = await rs.text();
					}catch(e){
						console.log('download fail...');
					};
					if(txt!='' && typeof(m)=='string' && m!='') {
						filename = m;
					}
				}
				if(/<svg[^>]*>/.test(txt) && /<\/svg[^>]*>/.test(txt)) {
					txt = txt.trim(); //去掉頭尾的空白, 以免 xml 解析錯誤
					///var blob = new Blob([txt], {type:'image/svg+xml'});
					var f = new File([txt], filename, {type:'image/svg+xml'});
					handleFiles([f]);
				} else {
					console.log(txt);
				}
			});
		}
	}
}

function exportOdpFile(filename, zipSource, content) {
	if(typeof(JSZip)=='undefined' || typeof(JSZip.loadAsync)!='function') {
		loadJSFile(); //請著重新載入程式
		alert('程式未載入, 無法製作 .odp 簡報檔案, 請再重試看看 ...');
		return;
	}
	fetch(zipSource)
	.then(res => res.blob())
	.then(JSZip.loadAsync)
	.then(function (zip) {
		return zip.file('content.xml', content);
	})
	.then(zip => {
		zip.generateAsync({type:"base64"})
		.then(function (base64) {
			//console.log(base64);
			var anchor = document.createElement('a');
			anchor.setAttribute('download', filename);
			anchor.setAttribute('href', 'data:application/zip;base64,' + base64);
			anchor.setAttribute('target', '_blank');
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
		});
	})
}

//將筆順已合併的 path 重新打散
function breakPath(svgElement) {
	const groups = svgElement.querySelectorAll('g');
	groups.forEach((group) => {
		const pathList = group.querySelectorAll('path');
		pathList.forEach((path) => {
			var pathD =  path.getAttribute('d');
			var dList = pathD.trim().split(/\s*z\s*/i).filter(function(el) { return el; });
			if(dList.length > 1) {
				path.setAttribute('d', dList[dList.length-1] + ' Z');
				var oldPath = path;
				for(var i=dList.length-2; i >= 0; i--) {
					var newPath = path.cloneNode(true);
					newPath.setAttribute('d', dList[i] + ' Z');
					oldPath = group.insertBefore(newPath, oldPath);
				}
			}
		});
	});
}

//color code rgb(r,g,b) to hex (#ffffff)
function rgbToHex(rgb, g, b) {
	var m, hexStr = rgb;
	var hex = function(n) {	return n.toString(16).padStart(2, '0');};
	if(typeof(rgb) == 'string' && /rgb/i.test(rgb) && (m = rgb.match(/(\d+)/g)) ) {
		hexStr = '#' + hex(Number(m[0])) + hex(Number(m[1])) + hex(Number(m[2]));
	} else if(!isNaN(rgb) && !isNaN(g) && !isNaN(b)){
		hexStr = '#' + hex(rgb) + hex(g) + hex(b);
	}
	return hexStr;
}

//cm to px
function cm2px(cm) {
	return Number( (cm / 0.0264583333).toFixed(3) );
}
//px to cm
function px2cm(px) {
	return Number( (px * 0.0264583333).toFixed(3) );
}

//
//base64 encoding and decoding for UTF-8 
//
// rf. https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
//
function u_atob(ascii) {
	return Uint8Array['from'](atob(ascii), function(c){return c.charCodeAt(0)} );
}
function u_btoa(buffer) {
	var binary = [];
	var bytes = new Uint8Array(buffer);
	for (var i = 0, il = bytes.byteLength; i < il; i++) {
		binary.push(String.fromCharCode(bytes[i]));
	}
	return btoa(binary.join(''));
}
function base64Encode(str) {	
	return ( u_btoa(new TextEncoder()['encode'](str)) );
};
function base64Decode(base64Str) {
	if(/base64,/i.test(base64Str)) {
		base64Str = base64Str.split(/base64,/)[1];
	}
	return ( new TextDecoder()['decode'](u_atob(base64Str)) );
};		

function calculateGrid(W, H, n) {
	if((W > H && n > 5) || (W < H && n > 2)) {	
		// 將寬度大小保留起來, 供檢查用
		var width = W;
	    // 自動計算方形物件的邊長
	    var a = Math.sqrt((W * H) / n);
	    // 計算每行的物件數量（列數）
	    var col = Math.floor(W / a);
	    // 計算每列的物件數量（行數）
	    var row = Math.floor(H / a);
	    // 計算總物件數量
	    var total = col * row;
		
	    // 調整行數和列數以確保能容納所有物件
	    while (total < n) {
	        if (W >= H) {
	            col++;
	            W += a;
	        } else {
	            row++;
	            H += a;
	        }
	        total = col * row;
	    }
		if(width < a * col) {
			a = width / col;
		}
	} else {
		var col = n;
		var row = 1;
		var a = W / col;
	}
	
    return { col, row, a };
}

//
//待研究 https://stackoverflow.com/questions/53635449/get-absolute-coordinates-of-element-inside-svg-using-js

function getTransformBBox(svgElement, bbox) {
	if(!bbox) {
		bbox = svgElement.getBBox();
	}
	// Get the transformation matrix
	// https://www.w3.org/TR/SVG11/coords.html#TransformMatrixDefined
	// https://docs.aspose.com/svg/net/drawing-basics/transformation-matrix/
	//   matrix(a  b c d  e  f )
	//   x: ax+cy+e,  y: bx+dy+f
	//   matrix(sx 0 0 sy tx ty) s:scale, t:translate 
	var transformMatrix = svgElement.getCTM(); 
	//console.log(transformMatrix);
	// Apply the transformation matrix to the bounding box
		
	return {
		x: bbox.x * transformMatrix.a + bbox.y * transformMatrix.c + transformMatrix.e,
		y: bbox.x * transformMatrix.b + bbox.y * transformMatrix.d + transformMatrix.f,
		width: bbox.width * transformMatrix.a,
		height: bbox.height * transformMatrix.d
	};
}

function parseContentXml(xmlStr) {
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xmlStr, "application/xml");

	const page1 = xmlDoc.getElementsByTagName("draw:page")[0];

	xmlDoc.getAllStyle = function() {
		return Array.from(this.getElementsByTagName('style:style'));
	};
	xmlDoc.getStyleByName = function(name) {
		return this.getAllStyle().filter(e=>e.getAttribute('style:name')==name)[0];
	};
	xmlDoc.getStyleTotalNumber = function(family) {
		if(typeof(family)=='string') {
			return this.getAllStyle().filter(e=>e.getAttribute('style:family')==family).length;
		} else {
			return this.getAllStyle().length;
		}
	};
	
	xmlDoc.addStyle = function(family, attribute, html, parent) {
		var node = this.createElement('style:style');
		var name = (family=='graphic'?'gr':'P') + (this.getStyleTotalNumber(family) + 1);
		node.setAttribute('style:name', name);
		node.setAttribute('style:family', family);
		if(typeof(attribute)!='undefined') {
			var keys = Object.keys(attribute);
			for(var i=0; i < keys.length; i++) {
				node.setAttribute(keys[i], attribute[keys[i]]);
			}
		}
		if(parent) {
			parent.appendChild(node);
		} else {
			var s; 
			if(family == 'graphic') {
				s = this.getStyleByName('gr1');
			} else {
				s = this.getStyleByName('P1');
			}
			s.parentNode.insertBefore(node, s);
		}
		if(typeof(html)=='string') {
			node.innerHTML = html;
		}
		return node;
	};
	xmlDoc.findTextParagraphName = function(color) {
		var pStyle = this.getAllStyle().filter(e=>e.getAttribute('style:family')=='paragraph');
		var name = '';
		var p, drawFillColor;		
		for(var i=0; i<pStyle.length; i++) {
			if(typeof(color)=='string') {
				p = pStyle[i].getElementsByTagName('loext:graphic-properties');
				if(p && typeof(p[0])!='undefined') {
					drawFillColor = p[0].getAttribute('draw:fill-color');
					if(drawFillColor!=null && color==drawFillColor) {
						name = pStyle[i].getAttribute('style:name');
						break;
					}
				}
			} else 	if(pStyle[i].children.length==1 ) {
				if(pStyle[i].children[0].tagName=='style:paragraph-properties' && pStyle[i].children[0].getAttribute('fo:text-align')) {
					name = pStyle[i].getAttribute('style:name');
					break;
				}
			}
		}
		return name;
	};
	xmlDoc.getTextParagraphName = function(color) {
		var name = this.findTextParagraphName(color);
		if(name == '') {
			var html = '';
			if(typeof(color)=='string') {
				html += '<loext:graphic-properties draw:fill="solid" draw:fill-color="' + color + '"/>';
			}
			html += '<style:paragraph-properties fo:text-align="center"/>';
			var node = this.addStyle('paragraph', {}, html);
			name = node.getAttribute('style:name');
		}
		return name;
	};
	xmlDoc.findGrapicStyleName = function(fillColor, stroke, strokeWidth) {
		var grStyle = this.getAllStyle().filter(e=>e.getAttribute('style:family')=='graphic');
		var name = '';
		var p, found, drawFillColor, drawStroke, drawStrokeWidth;
		for(var i=0; i<grStyle.length; i++) {
			found = false;
			p = grStyle[i].getElementsByTagName('style:graphic-properties');
			if(p && typeof(p[0])!='undefined') {			
				drawFillColor = p[0].getAttribute('draw:fill-color');
				drawStroke = p[0].getAttribute('draw:stroke');
				drawStrokeWidth = p[0].getAttribute('svg:stroke-width');
				if(drawStrokeWidth) drawStrokeWidth = drawStrokeWidth.replace(/[a-z]/ig, ''); //remove unit charactor
				//console.log(p[0], drawFillColor, drawStroke, drawStrokeWidth);
				found = typeof(fillColor)=='string' &&  drawFillColor!=null && fillColor==drawFillColor;
				found = found && typeof(stroke)=='string' &&  drawStroke!=null && stroke==drawStroke;
				found = found && typeof(strokeWidth)=='number' &&  drawStrokeWidth!=null && strokeWidth==Number(drawStrokeWidth);
				if(found) {
					name = grStyle[i].getAttribute('style:name');
					break;
				}
			}
		}
		return name;
	};
	xmlDoc.getPathGrapicStyleName = function(fillColor, stroke, strokeWidth) {
		if(strokeWidth <= 0) {
			stroke = 'none';
			strokeWidth = 0;
		}
		var name = this.findGrapicStyleName(fillColor, stroke, strokeWidth);
		if(name == '') {
			var html = '<style:graphic-properties draw:stroke="' + stroke + '" draw:stroke-dash="Dash_20_Dot_20_4" svg:stroke-width="' + strokeWidth + 'cm" draw:stroke-linejoin="none" svg:stroke-linecap="butt" draw:fill="solid" draw:fill-color="' + fillColor + '" draw:textarea-horizontal-align="center" draw:textarea-vertical-align="middle" loext:decorative="false"/>';
			var node = this.addStyle('graphic', {"style:parent-style-name":"standard"}, html);
			name = node.getAttribute('style:name');
		}
		return name;
	};
	xmlDoc.getObjectGraphicStyleName = function() {
		var html = '<style:graphic-properties draw:textarea-horizontal-align="center" draw:textarea-vertical-align="middle" draw:color-mode="standard" draw:luminance="0%" draw:contrast="0%" draw:gamma="100%" draw:red="0%" draw:green="0%" draw:blue="0%" fo:clip="rect(0cm, 0cm, 0cm, 0cm)" draw:image-opacity="100%" style:mirror="none" loext:decorative="false"/>';
		return this.addStyle('graphic', {"style:parent-style-name":"Object_20_with_20_no_20_fill_20_and_20_no_20_line"}, html).getAttribute('style:name');
	};
	xmlDoc.getDrawAttribute = function(elm) {
		var bbox = elm.getBBox();
		var computedStyle = {}; //window.getComputedStyle(elm); //取得最終的 style 備用
		var attr = {
			width: bbox.width,
			height: bbox.height,
			x: bbox.x,
			y: bbox.y,
			viewbox: `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`,		
			fill: rgbToHex(elm.style.fill || elm.getAttribute('fill') || computedStyle['fill'] || 'none'),
			stroke: rgbToHex(elm.style.stroke || elm.getAttribute('stroke') || computedStyle['stroke'] || 'none'),
			strokeWidth: px2cm(elm.style['stroke-width'] || elm.getAttribute('stroke-width') || parseInt(computedStyle['stroke-width']) || 0),
		}
		if(attr.strokeWidth == 0) {
			attr.stroke = 'none';
		}
		return attr;
	};
	xmlDoc.getImageBase64Data = function(elm) {
		var attr = this.getDrawAttribute(elm);
		var newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		newSvg.setAttribute('version', '1.1');
		newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		newSvg.setAttribute('width', attr.width);
		newSvg.setAttribute('height', attr.height);
		newSvg.setAttribute('viewBox', attr.viewbox);
		newSvg.appendChild(elm.cloneNode(true)); //複製原來的 path, 加入新的 SVG 中		
		var xmlString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + newSvg.outerHTML;
		//var dataUrl = 'data:image/svg+xml;base64,' + base64Encode(xmlString);
		
		return base64Encode(xmlString);
	};
	//draw:g
	xmlDoc.createDrawGroup = function(parent) {
		var node = this.createElement('draw:g');
		node.setAttribute('draw:style-name', this.topGroupStyleName);
		if(parent) {
			parent.appendChild(node);
		} else {
			//page1.appendChild(node);
			var notes = this.getElementsByTagName('presentation:notes');
			if(notes) {
				notes[0].parentNode.insertBefore(node, notes[0]);
			}
		}
		return node;
	};
	function circle2Path2(cx, cy, r){
		return 'M '+cx+' '+cy+' m -'+r+', 0 Z a '+r+','+r+' 0 1,1 '+(r*2)+',0 Z a '+r+','+r+' 0 1,1 -'+(r*2)+',0 Z';
	}
	function circle2Path(cx, cy, rx, ry){
		var r = rx;
		if(typeof(ry)!='number') { //未設定 ry 表示為圓, 否則為橢圓, r 就設為 0
			ry = r;	
		} else {
			r = 0;
		}
		return "M" + (cx-rx) + "," + cy + "a" + rx + "," + ry + " 0 1,0 " + (2 * rx) + ",0" + "a" + rx + "," + ry + " 0 1,0 " + (-2 * rx) + ",0 Z";
	}
	//draw:path , draw:polygon, draw:frame
	xmlDoc.createDrawNode = function(parent, svgElement, x0, y0, scale, isEmbed) {
		var node, dataBase64, pathD, points;  //points for rect tag
		var attr = this.getDrawAttribute(svgElement);
		isEmbed = typeof(isEmbed)=='boolean' && isEmbed;
		if(isEmbed) {
			dataBase64 = this.getImageBase64Data(svgElement);
		} else if(svgElement.tagName == 'rect') {
			var px0=attr.x, py0=attr.y, px1=Number(attr.x)+Number(attr.width), py1=Number(attr.y)+Number(attr.height);
			points = px0+','+py0 +' '+ px1+','+py0 +' '+ px1+','+py1 +' '+ px0+','+py1;
		} else if(svgElement.tagName == 'polygon') {
			points = svgElement.getAttribute('points');
		} else if(svgElement.tagName == 'circle') {
			var cx = Number(svgElement.getAttribute('cx'));
			var cy = Number(svgElement.getAttribute('cy'));
			var cr = Number(svgElement.getAttribute('r'));
			pathD = circle2Path(cx, cy, cr);
		} else if(svgElement.tagName == 'path') {
			pathD =  svgElement.getAttribute('d');
			if(typeof(pathD)=='string') {
				pathD = pathD.trim().replace(/\s+/g, ' ');
				pathD = pathD.replace(/([\d\s])M/g, '$1Z M'); //close the path
				if(!/z$/i.test(pathD.trim())) {
					pathD += ' Z';  //flatten 過的, 最後面的 Z 都不見了, 補回來
				}
			}			
		}
		if(attr.fill == 'none' && attr.stroke == 'none' && attr.strokeWidth == 0) {
			try {
				var attrP = this.getDrawAttribute(svgElement.parentElement);
				attr.fill = attrP.fill;
				attr.stroke = attrP.stroke;
				attr.strokeWidth = attrP.strokeWidth;
			}catch(e){};
		}
		var styleName, textStyleName;
		if(isEmbed) {
			styleName = this.getObjectGraphicStyleName();
			textStyleName = this.getTextParagraphName();
		} else {
			styleName = this.getPathGrapicStyleName(attr.fill, attr.stroke, attr.strokeWidth);
			textStyleName = this.getTextParagraphName(attr.fill);
		}
		
		//依放到簡報中的比例縮放
		attr.width *= scale; 
		attr.height *= scale;
		attr.x *= scale; 
		attr.y *= scale; 
		
		//加上原點的位置
		attr.x += x0; 
		attr.y += y0; 
		
		if(isEmbed) {
			node = this.createElement('draw:frame');
		} else if(typeof(pathD)=='string') {
			node = this.createElement('draw:path');
		} else if(typeof(points)=='string') {
			node = this.createElement('draw:polygon');
		}
		node.setAttribute('draw:layer', "layout");
		node.setAttribute('draw:style-name', styleName);
		node.setAttribute('draw:text-style-name', textStyleName);
		node.setAttribute('svg:width', px2cm(attr.width)+'cm');
		node.setAttribute('svg:height', px2cm(attr.height)+'cm');
		node.setAttribute('svg:x', px2cm(attr.x)+'cm');
		node.setAttribute('svg:y', px2cm(attr.y)+'cm');
		
		if(isEmbed) {
			var img = this.createElement('draw:image');
			img.setAttribute('draw:mime-type', 'image/svg+xml');
			img.innerHTML = '<office:binary-data>' + dataBase64 + '</office:binary-data><text:p/>';
			node.appendChild(img);
		} else {
			node.setAttribute('svg:viewBox', attr.viewbox);
			if(typeof(pathD)=='string') {
				node.setAttribute('svg:d', pathD);
			} else if(typeof(points)=='string') {
				node.setAttribute('draw:points', points);
			}		
			node.innerHTML = '<text:p/>';
		}
		
		if(parent) {
			parent.appendChild(node);
		} else {
			//page1.appendChild(node);
			var notes = this.getElementsByTagName('presentation:notes');
			if(notes) {
				notes[0].parentNode.insertBefore(node, notes[0]);
			}
		}		
	};
	xmlDoc.exportToString = function() {
		var serializer = new XMLSerializer();
		return serializer.serializeToString(this);
	};

	//先新增一個 graphic style , 並記錄名稱, 群組時專用
	xmlDoc.topGroupStyleName = xmlDoc.addStyle('graphic', {}, '<style:graphic-properties loext:decorative="false"/>').getAttribute('style:name');
	
	return xmlDoc;	
}

function svgConvert(xmlDoc, svgElement, x, y, scale, parent, unGroup) {
	if(typeof(svgElement)=='string') {
		svgElement = document.querySelector(svgElement);
	}	
	
	//var svgRoot = svgElement.ownerSVGElement;
	
	unGroup = typeof(unGroup)=='boolean' && unGroup;
	

	//還沒找到有設定 transform matrix 時的最佳解法, 先整張圖用 embed 的方式
	//xmlDoc.createDrawNode(parent, svgElement, x, y, scale, true);

	var children = Array.from(svgElement.children);
	
	//if(children.length > 0 && !parent) {
	//  //將整張圖放到一個群組, 在 Google Slider 中還可解開群組, 但是在 Canva 中無法, 先停用
	//	parent = xmlDoc.createDrawGroup();
	//} 
	
	children.forEach((child) => {
		if(child.tagName == 'g') {
			var transform;
			var tx=0, ty=0;
			
			//xmlDoc.createDrawNode(parent, child, x, y, scale, true); //embed binary format
			
			if(unGroup) {
				svgConvert(xmlDoc, child, x + tx, y + ty, scale, parent, unGroup);
			} else {
				var gNode = xmlDoc.createDrawGroup(parent);
				svgConvert(xmlDoc, child, x + tx, y + ty, scale, gNode, unGroup);
			}
		} else if(/path|rect|circle|polygon/.test(child.tagName)) {
			fistDrawAdd = true;
			xmlDoc.createDrawNode(parent, child, x, y, scale, false);
		}
	});
}

function generateOdpFile(selectors, unGroup) {
	var xmlDoc = parseContentXml(contentXmlStr);

	if(typeof(selectors)!='string') {
		selectors = '#svgWrapper';
	}
	selectors += ' svg';

	const svgList = document.querySelectorAll(selectors);

	showMessage('轉換 ' + svgList.length + ' 個 SVG 圖形...');
	
	if(svgList.length < 1) {
		return;
	}
	
	//是否要整個打散(不使用 draw:group)
	if(typeof(unGroup)!='undefined') {
		unGroup = typeof(unGroup)=='boolean' && unGroup;
	} else {
		if((unGroup=document.querySelector('#ungroup-input')) && unGroup.checked) {
			unGroup = true;
		} else {
			unGroup = false;
		}
	}
	
	const slideWidth = 28; //slide width (cm)
	const slideHeight = 15.75; //slide height (cm)
		
	//計算最佳的排列方式及大小
	var size = calculateGrid(slideWidth*0.9, slideHeight,  svgList.length);
	
	//限制大小最大不可超過 7.5cm
	if(size.a > 7.5) {
		size.a = 7.5;
	}
	
	var targetSize = size.a * (unGroup?0.8:0.85); //unit: cm
	size.a *= 0.95;

	//計算起始的座標
	var x0 = cm2px((slideWidth - size.a * size.col) / 2);  //unit: px
	var y0 = cm2px((slideHeight - size.a * size.row) / 2); //unit: px
	
	var words = '';
	var offset = cm2px(size.a);
	svgList.forEach((svgElement, nIndex) => {
	
		var bb = svgElement.getBBox();
		
		words += svgElement.id || '';
		var x = x0 + nIndex % size.col * offset;
		var y = y0 + Math.floor(nIndex / size.col) * offset;
		//var scale = targetSize / px2cm(svgElement.getBBox().height);
		var scale = targetSize / px2cm(Math.max(bb.width, bb.height));
		//修正起始座標, 讓圖能放在中央
		x += (offset - bb.width*scale)/2 - bb.x*scale;
		y += (offset - bb.height*scale)/2  - bb.y*scale;
		
		svgConvert(xmlDoc, svgElement, x, y, scale, null, unGroup);
	});
	if(svgList.length > 0) {
		var contentString = xmlDoc.exportToString();
		
		try {
			document.getElementById('odpContent').value = contentString;
		}catch(e){};
		
		//將內容放到 content.xml, 並加入 .odp 檔案中, 完成後自動匯出
		var filename;
		if(svgList.length > 1) {
			//var filename = '簡報-轉自-' + svgList.length + (words?'-'+words.substring(0,3):'') + '.odp'; //LibreOffice Impress file
			filename = '簡報-內含-SVG圖x' + svgList.length + '.odp'; //LibreOffice Impress file
		} else {
			filename = svgList[0].parentElement.getAttribute('filename');
			filename = '簡報-內含-' + (filename?filename.replace(/\.svg/i, '_svg'):'SVG') +  '.odp'; //LibreOffice Impress file
		}
		exportOdpFile(filename, zipSource, contentString);
	}
}

function showMessage(msg) {
	var x = document.getElementById("mySnackBar");
	if(x) {
		x.innerHTML = msg;
		x.classList.add("show");
		setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
	} else {
		alert(msg);
	}
}
function showMessageMulti(txt) {
  var el = document.createElement("div");
  el.className = "snackbar";
  var y = document.getElementById("snackbar-container");
  el.innerHTML = txt;
  y.append(el);
  el.className = "snackbar show";
  setTimeout(function(){ el.className = el.className.replace("snackbar show", "snackbar"); }, 3000);
}
function loadJSFile(jsFileList) {
	var jsFileListDefault = [
		'https://gsyan888.github.io/svg2odp/jszip.min.js',
		'https://gsyan888.github.io/svg2odp/flatten.js'
	];
	if(typeof(jsFileList)=='undefined' || jsFileList==null) {
		jsFileList = jsFileListDefault;
	}
	if(jsFileList.length > 0) {
		var js = document.createElement('script'); 
		js.type = 'text/javascript';
		js.src = jsFileList[0];
		js.onload = function () { 
			jsFileList.splice(0, 1);
			console.log('File loading left ... ' + jsFileList.length ); 
			loadJSFile(jsFileList);
		};
		document.head.appendChild(js);
	}
}

async function fetchTemplateFile(url, callback) {
	var nocacheVal = '?nocache=' + new Date().getTime();	//為了避免 cache 的問題,在檔名後加亂數
	//var rs = await fetch(url + nocacheVal);
	var rs = await fetch(url);
	var data = await rs.text();
	if(typeof(callback)=='function') {
		callback(data);
	}
	return data;
}

//LibreOffice .odp 樣版及 .odp 中的 content.xml 樣版
var contentXmlStr, zipSource;
var contentXmlUrl = 'https://gsyan888.github.io/svg2odp/content.xml';
var zipSourceUrl = 'https://gsyan888.github.io/svg2odp/slide-sample.odp.txt';

function loadTemplate() {
	if(typeof(contentXmlStr)=='string' && typeof(zipSource)=='string' && contentXmlStr!='' && zipSource!='') {
		return;
	}
	//showMessage('載入簡報範本 ...');
	fetchTemplateFile(zipSourceUrl, function(txt) {
		console.log('odf template download ...');
		if(txt) {
			//get sample slide file, base64 encode
			zipSource = txt;
			
			//showMessage('載入 ODF 範本 ...');		
			fetchTemplateFile(contentXmlUrl, function(txt){
				console.log('content.xml downlaod ...');
				if(txt) {
					//get template xml file
					contentXmlStr = txt;
					showMessage('檔案載入完畢, 可以開始轉 SVG 檔 ...');
				} else {
					showMessage('設定檔範本載入失敗，請按重新整理後再試 ...');
				}
			});
		} else {
			showMessage('簡報檔範本載入失敗，請按重新整理後再試 ...');
		}
	});
}

function triggerMagic(icon) {
	if(typeof(magicCouter)!='number') {
		magicCouter = 0;
	}
	var updateProgress = function(p, finish) {
		var loadingRing = document.querySelector('.loading-ring');
		if(!loadingRing) {
			loadingRing = document.createElement('div');
			loadingRing.setAttribute('class', 'loading-ring');
			document.body.appendChild(loadingRing);
		}
		loadingRing.innerHTML = '<label>' + (typeof(p)=='string'?p:p.toFixed(0)) + '</label>';
		if(finish || (!isNaN(p) && Number(p) >= 100)) {
			loadingRing.remove();
		}
	};
	var getWords = function () {
		
		var word = prompt('✅ 請輸入要轉換的國字:\n\n🏠 筆順資料來源: 中華民國教育部「國字標準字體筆順學習網」\n\n⛔ 不得用於商業用途\n', '');
		if(typeof(word)=='string' && (word=word.replace(/[a-z0-9\.,;\-_\?\:\&\$\%\#\=\!\*\@\(\)\[\]\'\"\s，；。「」？！]/ig,''))!='') {
			if(word.length <= 20) {
				showMessage('下載資料, 請稍候...');
				moeStroke.toSVG(word.trim(), 0, false, true, true, updateProgress, function(files) {
					var txt = 'SVG 圖檔下載失敗 ...';
					if(files.length > 0) {
						txt = '已新增 ' + files.length + '個 SVG 圖檔...';
						handleFiles(files);
					}
					showMessage(txt);
				});
			} else {
				alert('一次下載太多個字, 已超過下載上限...');
				location.reload();
			}
		}
	};
	if(++magicCouter >= 3) {
		icon.style.opacity = 1;
		if(typeof(moeStroke)=='undefined') {
			//載入筆順部件相關模組
			var js = document.createElement('script'); 
			js.type = 'text/javascript';
			js.src = 'https://gsyan888.github.io/html5_fun/assets/moeStroke.min.js?v=202510211242';
			js.onload = function() { 
				console.log('Script loaded ... '); 
				if(typeof(getWords)=='function') {
					getWords();
				}
			};
			js.onerror = function() {
				showMessage('程式載入失敗 ...');
				document.head.removeChild(js);
				icon.style.opacity = 0.35;
				icon.style.scale = 1;
				magicCouter = 0;
			};
			document.head.appendChild(js);
		} else {
			getWords();
		}
	} else {		
		icon.style.opacity = Number(icon.style.opacity) + 0.15;
		icon.style.scale = Number(icon.style.scale)||1 + 0.35;
	}
}

function start() {
	//showMessage('載入範本...');
	loadTemplate();	
	//showMessage('載入程式...');
	loadJSFile();
	startFileInputListener();
}

if (/SVG|ODP/i.test(document.title)) {    
	//start();
}
