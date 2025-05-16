function start() {
	loadSVG();
}
function loadSVG() {
	var url, rs, data;
	var urlBase = 'https://gsyan888.github.io/svg2odp/test/';
	var wrapper = document.querySelector('#svgWrapper');
	if(wrapper) {
		for(var i=1; i<=2; i++) {
			url = urlBase + 'test-' + i + '.svg';
			fetch(url)
			.then((rs) => {
				if(!rs.ok) {
					throw new Error('SVG file fetch error: ' + rs.status);
				}
				return rs.text();
			})
			.then((data) => {
				if(/<svg/.test(data)) {
					const parser = new DOMParser();				
					const svgDoc = parser.parseFromString(data, 'image/svg+xml');
					const svgElement = svgDoc.documentElement;
					const container = document.createElement('div');
					container.setAttribute('class', 'svg-container');
					container.innerHTML = '<label>SVG ' + (wrapper.children.length+1) + ' </label>';
					container.appendChild(svgElement);
					wrapper.appendChild(container);
				} else {
					throw new Error('not SVG file ...');
				}
			});
		}
	};
}
/**
 *
 * @param {string} maskId
 */
function maskTest(maskId) {
	document.querySelectorAll('#svgWrapper svg').forEach(e=>demo('', e, maskId));
}
/**
 *
 * @param {Object} svgElement
 * @param {string} maskId
 */
function updateMaskLabel(svgElement, maskId) {
	var label = svgElement.parentElement.querySelector('label');
	if(label) {
		label.innerHTML = 'ID: ' + maskId;
	}
}
/**
 * 在第二個字上疊第一個字的字框, 方便觀察
 */
function addGhost() {
	var wrapper = document.querySelector('#mask-test-wrapper');
	var svg = document.querySelectorAll('#svgWrapper svg');
	if(svg && wrapper) {
		var ghost = svg[0].cloneNode(true);
		ghost.setAttribute('id', 'svg-ghost');
		ghost.style.position = 'absolute';
		ghost.querySelectorAll('g').forEach(g=>{
			g.setAttribute('stroke-opacity', 1);
			g.setAttribute('fill', 'none');
			g.setAttribute('stroke', '#B5B2B2');
			g.setAttribute('stroke-width', 8);
			g.setAttribute('stroke-dasharray', '10,10');
		});
		var cloneList = ['width', 'height', 'top', 'left'];
		var b = svg[1].getBoundingClientRect();
		cloneList.forEach(a=>ghost.style[a] = b[a]+'px');
		wrapper.appendChild(ghost);
	}
}
/**
 *
 * @param {number} demoIndex
 * @param {Object} target
 * @param {string} maskId
 */
function demo(demoIndex, target, maskId) {
	var svgElement;
	if(!target) {
		target = 'svg';
	}
	if(typeof(target)=='string') {
		svgElement = document.querySelector(target);
	} else {
		svgElement = target;
	}		
	
	var tracks;
	//var tracks = moeStroke.getTrack(svgElement);
	
	if(!svgElement || !(tracks = getTrack(svgElement)) || tracks.length < 1) {
		console.log('debug: stroke SVG not found ... ', target);
		return;
	}
	
	//svgElement.style.width = "200px";
	//svgElement.style.height = "200px";
	
	var newSvgElement = function(tag) {
		return document.createElementNS('http://www.w3.org/2000/svg', tag);
	};
	var removeAllChildren = function(elm) {
		if(elm && elm.children) {
			Array.from(elm.children).forEach(c=>c.remove()); 
		}
	};
	var newCircle = function(x, y, r, color) {
		var c = newSvgElement('circle');
		c.setAttribute('cx', x);
		c.setAttribute('cy', y);
		c.setAttribute('r', r);
		c.setAttribute('stroke-width',1);
		c.setAttribute('fill', color);
		c.setAttribute('fill-opacity', 1);
		c.setAttribute('stroke', color);
		c.setAttribute('stroke-linecap', 'round');
		return c;
	};

	//var uuid = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}();
	//var uuid = window.URL.createObjectURL(new Blob([])).slice(-36);
	var uuid = window.URL.createObjectURL(new Blob([])).slice(-8); //改短一點
	uuid = uuid.replace(/-/g, '');
	
	
	//var demoG = svgElement.querySelector('#demo');
	var demoG = svgElement.querySelector('[mask]');
	if(!demoG) {
		//demoG = document.createElement('g'); //這種不能用
		demoG = newSvgElement('g');
		demoG.setAttribute('id', 'demo');
		//demoG.setAttribute('mask', 'url(#demo-mask)');
		svgElement.appendChild(demoG);
		
		if(!svgElement.querySelector('#demo-style')) {
			var style = newSvgElement('style');
			style.setAttribute('id', 'demo-style');
			style.innerHTML = '.stroke-fill-red{fill:#FFD9E6;}.stroke-fill-black{fill:#000000;}';
			svgElement.appendChild(style);
		}
	}
	
	//var maskId = 'demo-mask-' + uuid;
	if(typeof(maskId) != 'string' || maskId.replace(/\s/g,'') == '') {
		maskId = 'demo-mask-' + uuid;
	} 
	var drawId = 'demo-draw-' + uuid;
	
	updateMaskLabel(svgElement, maskId);
	
	demoG.setAttribute('mask', 'url(#' + maskId + ')');
	
	//demoMask = demoG.querySelector('#demo-mask');
	//demoDraw = demoG.querySelector('#demo-draw');
	var demoMask = demoG.querySelector('mask[id^="demo-mask"]');
	var demoDraw = demoG.querySelector('g[id^="demo-draw"]');	
	if(!demoMask) {
		demoMask = newSvgElement('mask');
		//demoMask.setAttribute('id', 'demo-mask');
		demoG.appendChild(demoMask);
	} else {
		removeAllChildren(demoMask);//remove children
	}
	if(!demoDraw) {
		demoDraw = newSvgElement('g');
		//demoDraw.setAttribute('id', 'demo-draw');
		demoG.appendChild(demoDraw);
	} else {
		removeAllChildren(demoDraw);//remove children
	}
	demoMask.setAttribute('id', maskId);
	demoDraw.setAttribute('id', drawId);
	
	var demoDone = svgElement.querySelector('g[id^="demo-done"]');
	if(!demoDone) {
		demoDone = newSvgElement('g');
		demoDone.setAttribute('id', 'demo-done');
		demoDone.setAttribute('class', 'stroke-fill-black');
		svgElement.appendChild(demoDone);
	} else {
		removeAllChildren(demoDone);//remove children
	}	
	
	var setStrokeFillClass = function(index, fill) {
		var elm = svgElement.querySelector('#t'+index);
		if(elm) {
			var isBlack = (fill=='black');
			var isRed = (fill=='red');
			elm.classList.toggle('stroke-fill-black', isBlack);
			elm.classList.toggle('stroke-fill-red', isRed);
		}
	};		

	var strokeDemoInit = function() {
		for(var i=0; i<tracks.length; i++) {
			setStrokeFillClass(i+1, 'red');
		}
	};
	
	if(typeof(demoIndex)!='number') {
		strokeDemoInit();
	}
	var updateDemoDone = function(index) {
		if(demoDone) {
			var path = svgElement.querySelector('#t'+(index+1)); //t1 為第一畫
			if(path) {
				path = path.cloneNode(true);
				path.removeAttribute('id');
				path.removeAttribute('class');
				demoDone.appendChild(path);
			}
		}
	};
	//add mask
	var updateMask = function(index) {
		if(demoMask) {
			//var maskPath = svgElement.querySelectorAll('path')[index].cloneNode(true);
			var maskPath = svgElement.querySelector('#t'+(index+1)); //t1 為第一畫
			if(maskPath) {
				maskPath = maskPath.cloneNode(true);
				maskPath.setAttribute('fill', '#ffffff');	
				maskPath.setAttribute('fill-opacity', 1);
				removeAllChildren(demoMask);
				demoMask.appendChild(maskPath);
			}
		}
	};
	var getDemoPoints = function(tk, index) {
		var points = [];
		var m = 1, dx = 1, dy = 1, x, y, pt, ptNext, total;
		
		updateMask(index);
		
		var offsetScale = 1;//0.85; //每次移動 size 的多少倍, 0.5 最適當, 0.75 可加快速度
		for(var i=0; i<tk[index].length; i++) {
			pt = tk[index][i];
			x = pt['x'];
			y = pt['y'];
			size = pt['size'] || 120;
			ptNext = tk[index][i+1];
			if(!ptNext) {
				points.push({x:x, y:y, size:size});
				break;
			} else {
				total = Math.ceil( Math.max(Math.abs(ptNext.x - x), Math.abs(ptNext.y - y)) / (size*offsetScale) );
				dx = (ptNext.x - x) / total;
				dy = (ptNext.y - y) / total;
				points.push({x:x, y:y, size:size});
				for(var j=0; j<total; j++) {
					x += dx;
					y += dy;
					points.push({x:x, y:y, size:size});
				}
			}
		}
		//console.log(points);
		return points;
	};
	
	try {clearInterval(svgElement.demoIntervalId);}catch(e){};
	
	var tIndex = 0;
	var tLastIndex = tracks.length;
	if(typeof(demoIndex)=='number') {
		tIndex = demoIndex;
		tLastIndex = demoIndex;
	}
	var demoPoints = getDemoPoints(tracks, tIndex++);
	
	svgElement.demoIntervalId = setInterval(function() {
		var svgExist = document.body.contains(svgElement); //檢查 SVG 是否在頁面中
		var point;
		if(demoPoints.length > 0) {
			point = demoPoints.splice(0, 1)[0];
			//console.log(demoPoints.length, point);
		}
		if(svgExist && point && point['x']!=null && point['y']!=null && point['size']!=null) {
			demoDraw.appendChild(newCircle(point['x'], point['y'], Math.ceil(point['size']*1.15), '#000000'));
		} else if(svgExist && tIndex < tLastIndex) {
			removeAllChildren(demoDraw);
			//setStrokeFillClass(tIndex, 'black');  //讓筆畫變成黑色填滿
			updateDemoDone(tIndex-1);
			demoPoints = getDemoPoints(tracks, tIndex++);
		} else {
			clearInterval(svgElement.demoIntervalId);
			//removeAllChildren(demoDraw);
			//removeAllChildren(demoMask);
			demoG.remove();
			demoDone.remove();			
			//全字示範者, 去掉所有 black, red class, 讓顏色恢復原來的; 單一筆畫者用黑色
			if(typeof(demoIndex)!='number') {
				for(var i=1; i<=tracks.length; i++) setStrokeFillClass(i, '');
			} else {
				setStrokeFillClass(tIndex, 'black');
			}
			
			console.log('debug: demo finish...');
		}
	}, 100);
}
/** 
 * 將 SVG 中的 desc 還原為 Track 物件
 * @param {Object} svgElement
 * @return {Object}
 */
function getTrack(svgElement) {
	var trackArray = [];
	var tracks = [], track, p, point, points;
	var desc = svgElement.querySelector('desc');
	if(desc && /tracks/.test(desc.innerHTML) && desc.innerHTML.replace(/\s/g, '')!= '') {
		try {
			tracks = JSON.parse(desc.innerHTML)['tracks'];
		}catch(e) { tracks = [];};
	}
	for(var i=0; i<tracks.length; i++) {
		points = [];
		track = tracks[i].trim().split(/\s+/);
		for(var j=0; j<track.length; j++) {				
			p = track[j].trim().split(',');
			if(p.length > 1) {
				point = {
					x: parseFloat(p[0]),
					y: parseFloat(p[1])
				}
				if(!isNaN(p[2])) {
					point['size'] = parseFloat(p[2]);
				}
				points.push(point);
			}
		}
		if(points.length > 0) {
			trackArray.push(points);
		}
	}
	return trackArray;
}
	