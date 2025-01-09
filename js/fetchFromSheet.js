/**
 *--------------------------------------
 * Google 試算表查詢相關
 *--------------------------------------
 */
 
/**
 * 公用
 */ 
/**
 * 解析出 SpreadSheet 的文件 ID
 * @param {string} url 試算表的網址
 * @return {string} id
 */
function gdGetSpreadSheetID(url) {
  var id = '';
  if(!(/^https:\/\//.test(url)) && url.length>20) {
    id = url;
  } else if(/\/d\/([^\/]{20}[^\/]+)\//.test(url)) {
    id = window['RegExp']['lastParen'];
  }
  return id;
};
function gdGetSpreadSheetUrl(id, gid) {
  return 'https://docs.google.com/spreadsheets/d/'+id+'/edit?usp=sharing'+(typeof(gid)=='string' && gid!=''?'&gid='+gid+'#gid='+gid:'');	
}
/**
 * 製作 SpreadSheet 的查詢資料網址
 * @param {string} urlOrId 試算表的網址或是 id
 * @param {string|null} [sheet] 工作表名稱
 * @param {string|null} [query] SQL string
 * @param {number|null} [headers] total number
 * @return {string} url 如果不是試算表的網址就回傳空字串
 */
function gdGetSpreadSheetQueryURL(urlOrId, sheet, query, headers) {
  var id = gdGetSpreadSheetID(urlOrId);
  var gid = urlOrId.match(/[\#\&\?]gid=(\d+)/); //工作表的 id
  if( gid && gid.length > 1 ) {
	gid = gid[1];
  } else {
    gid = '-1';
  }
  var url = '';
  if(id != '') {
    //預設使用 tqx=out:json
	url = 'https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?tqx=out:json';
	//如果有指定工作表名稱，就不使用 gid 
	//似乎 gid, sheet 同時存在的話，就看誰放前面
	//都不指定的話，就會取用在試算表中的第一個工作表
    if(typeof(sheet)=='string' && sheet.replace(/\s/g, '')!='') {
      url += '&sheet='+encodeURIComponent(sheet);  //指定工作表(sheet)
    } else if( gid != '-1' ) {
	  url += '&gid='+gid;
	}
    if(typeof(query)=='string' && query.replace(/\s/g, '')!='') {
      //query = 'Select *';
      //query = `Select * where A = '${gameID}'`;
      query = encodeURIComponent(query);
      url += '&tq='+query;  //指定查詢的 SQL 指令(tq)
    }
	if(typeof(headers)=='number') {
	  url += '&headers='+headers;
	}
	//console.log(url);
  }
  return url;
};

/**
 * JSONP 以新增 script 的方式，來執行試算表的查詢後的函數
 *
 * @param {string} url 試算表查詢資料的網址
 * @param {Function} callback 查到資料後要執的程序
 * @return {Object'}
 */
async function gdGetSpreadSheetData(url, callback)  {
  var timeoutTotal = 30; // 30 * 100 = 3sec. 等它3秒查詢
  var sheetQueryResult = null;
  
  //JSONP 呼叫 callback
  if(typeof(window['google'])=='undefined') {window['google'] = {}; }
  if(typeof(window['google']['visualization'])=='undefined') { window['google']['visualization'] = {}; }
  if(typeof(window['google']['visualization']['Query'])=='undefined') { window['google']['visualization']['Query'] = {};}
  window['google']['visualization']['Query']['setResponse'] = function(data) {
    var values = [];
	var value;
	var row, col;	
    if(data && typeof(data['status'])=='string' && data['status']=='ok') {
      if(typeof(data['table']['rows'])!='undefined' && data['table']['rows']!=null && data['table']['rows'].length>0) {		    
        //欄名(第一列資料)
		if(data['table']['parsedNumHeaders'] > 0) {
	      value = [];
          for(var i=0; i<data['table']['cols'].length; i++) {           
            col = data['table']['cols'][i];
  	        if(typeof(col['label'])=='string') {
              value.push(col['label']);
            }
		  }
		  if(value.length > 0 && value.length == data['table']['cols'].length) {
            values.push(value);
          }
        }		  
        for(var r=0; r<data['table']['rows'].length; r++) {
          value = [];
          row = data['table']['rows'][r];
		  for(var i=0; i<row['c'].length; i++) {
			col = row['c'][i];
		    if(typeof(col)!='undefined' && col!=null) {
              value.push(col['v']);
            } else {
			  value.push('');
		    }
		  }
		  values.push(value);
        }
      }
    }	  
	sheetQueryResult = values;
  };
  //查詢試算表的程序
  var nocacheVal = 'nocache=' + new Date().getTime();	//為了避免 cache 的問題,在檔名後加亂數
  var scriptToAdd = document.createElement('script');		//建立一個 scriptElement
  scriptToAdd.setAttribute('type','text/javascript');
  scriptToAdd.setAttribute('charset','utf-8');
  scriptToAdd.setAttribute('src', url + (/\?/.test(url)?'&':'?') + nocacheVal);	//避免 cache 時用的
  //scriptToAdd.setAttribute('src', url);
  //載入成功時
  scriptToAdd.onload = scriptToAdd.onreadystatechange = function() {
    if (!scriptToAdd.readyState || scriptToAdd.readyState === "loaded" || scriptToAdd.readyState === "complete") {
      scriptToAdd.onload = scriptToAdd.onreadystatechange = null;
      document.getElementsByTagName('head')[0].removeChild(scriptToAdd);	//將變數載入後移除 script
    };
  };
  //無法載入時, 將設定用預設值
  scriptToAdd.onerror = function() {
    scriptToAdd.onerror = null;	//將事件移除
    document.getElementsByTagName('head')[0].removeChild(scriptToAdd);	//移除 script
    if( typeof callback == 'function' ) {
      callback();	//執行指定的函數
    } else {
      var msg = '無法載入設定.';
      var resultBlock = document.querySelector('.resultBlock');
      if(typeof(resultBlock)!='undefined' && resultBlock!=null) {
        msg += '\n\n請確認一下:\n\n* 試算表共用連結的網址是否正確, \n\n* 是否開放任何人都可以檢視.';
        resultBlock.style.display = 'none';			
      }
      setTimeout(function() {
        alert(msg);
      }, 100);
    }
  }
  //在 head 的最前頭加上前述的 scriptElement
  var docHead = document.getElementsByTagName("head")[0];
  docHead.insertBefore(scriptToAdd, docHead.firstChild);

  //等待並檢查是否有資料了
  var timeoutCounter = 0;
  return new Promise((resolve) => {
    //每 0.1 秒檢查 sheetQueryResult 是否有設定值了, 有就回傳, 最多等 timeoutTotal 次
    var intId = setInterval(function() {
      if((typeof(sheetQueryResult) != 'undefined' && sheetQueryResult != null) || timeoutCounter > timeoutTotal) {
        clearInterval(intId);
        if(timeoutCounter > timeoutTotal) {
          sheetQueryResult = null;
        }
        return resolve(sheetQueryResult);
      }
      timeoutCounter++;
    }, 100);
  });  
};


/**
 * 以 JSONP 的方式向試算表查詢資料
 * @param {string} url 試算表的網址
 * @param {string} gameId 遊戲取用代碼
 * @param {string} idColName 取用代碼所在的欄位名稱
 * @return {Object}
 */
async function fetchGameDataFromSheet(url, gameId, idColName) {
  if(typeof(idColName)!='string') {
    idColName = 'A';
  }
  var sql = getGameSQL(gameId, idColName);
  var qURL = gdGetSpreadSheetQueryURL(url, '', sql, 1);
  var queryResult = await gdGetSpreadSheetData(qURL);  
  //傳回的資料應該有兩列, 取第二列, 並由欄名 idColName 的下一欄起
  var idColIndex = idColName.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);  
  //console.log(queryResult);
  if(queryResult.length > 1) {
    queryResult = queryResult[1].slice(idColIndex + 1);
  } else if(queryResult.length > 0){
	queryResult = queryResult[0].slice(idColIndex + 1);
  }
  return queryResult;
};
/**
 * 試算表查詢 SQL 
 * @param {string} gameID 遊戲取用代碼
 * @param {string} colName 遊戲取用代碼在哪一欄(A,B,C...), 未指定就用 A
 * @return {string} 資料查詢 SQL
 */
function getGameSQL(gameID, colName) {
    //var query = `Select * where (A contains "${gameID}")`;
	//return "SELECT * WHERE " + colName + " = '" + gameID + "'";
	return `SELECT * WHERE ${colName} = '${gameID}'`;
}

/**
 * 製作火車調派員設定及題庫
 * @param {Object} data 由試算表查來的資料陣列
 * @return {Object|string}
 */
async function getFlashvarsOfTrain(data) {
  var flashvars = '';	
  if(data.length >= 2 && data[0] == 'F8_TrainA') {
    if(/QTotal=\d+/.test(data[1]) && /Q1S=.+/.test(data[1])) {
      flashvars = data[1];
	} else if(data[1] && /spreadsheets/.test(data[1]) && gdGetSpreadSheetID(data[1])!='') {
	  flashvars = await sheetToTrain(data[1]);
	} else if(data[2] && /spreadsheets/.test(data[2]) && gdGetSpreadSheetID(data[2])!='') {
	  flashvars = await sheetToTrain(data[2]);		
    } else if(data[1].replace(/\s/g, '')!='') {
      var total = 0;    
	  var TitleName = '';
      var lines = data[1].trim().replace(/\r/g, '').split(/\n+/);
      for(var i=0; i<lines.length; i++) {
        if(lines[i].replace(/\s/g, '') != '') {
          if(/\//.test(lines[i])) {
            total++;
            flashvars += '&Q'+ total +'S='+lines[i]
		  } else if(TitleName=='') {
		    TitleName = lines[i];
		  }
	    }
      }
	  if(total > 0) {
	    flashvars = '&QTotal=' + total + '&BombTimeExtra=1&QFont=標楷體' + flashvars;	  
        if(TitleName!='') {
          flashvars = '&TitleName=' + TitleName + flashvars;
        }
        flashvars += '&okflag=1&';
      }	
    }
  }
  return flashvars;
}
/**
 * 抓取整個工作表的資料並轉為[火車調派員]設定及題庫
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function sheetToTrain(url) {
  var data = await getSheetData(url);
  //console.log(data);
  var flashvars = {};
  var foundQindex = false;  
  var values, varName;
  var QTotal = 0;
  for(var i=0; i<data.length; i++) {
    values = data[i];
	if(typeof(values[1])=='string') {
	  if( /TitleName|ModeFlag|BombTimeExtra/.test(values[1]) ) {
	    if(typeof(values[2])== 'undefined' || values[2]==null) {
          values[2] = '';
	    }
		flashvars[values[1]] = values[2];
	  } else if( /\*{3}題目序號可省略\*{3}/.test(values[1]) ) {
		foundQindex = true;
	  } else if(foundQindex && typeof(values[2])=='string' && values[2].length > 0) {
		QTotal++;
		flashvars['Q'+QTotal+'S'] = values[2];
		if(typeof(values[3])=='string' && values[3].length > 0) {
		  flashvars['A'+QTotal] = values[3];
		}
	  }
	}
  }
  if(QTotal > 0) {
    flashvars['QTotal'] = QTotal;	  
    flashvars['okflag'] = 1;
  }	  
  console.log(flashvars);
  return flashvars;
}
/**
 * 抓取整個工作表的資料並轉為 Teamplay 設定及題庫
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function sheetToTeamplay(url) {
  var data = await getSheetData(url);
  var flashvars = {};
  var foundQindex = false;  
  var values, varName;
  var questionLines = '';
  var fields;
  for(var i=0; i<data.length; i++) {
    values = data[i];
	if(typeof(values[1])=='string') {
	  if( /title|questionType|fieldsOrder|questionToAnswer|font_size_question|font_size_options|timer|autoGotoNext|onesec|keyNext|keyPrevious|keyPlay|keyPlayer1|keyPlayer2/.test(values[1]) ) {
	    if(typeof(values[2])== 'undefined' || values[2]==null) {
          values[2] = '';
	    }
		flashvars[values[1]] = values[2];
	  } else if( /\*{3}題庫\*{3}/.test(values[1]) ) {
		foundQindex = true;
	  } else if(foundQindex && typeof(values[2])=='string' && values[2].length > 0) {
		if(typeof(values[3])=='string' && values[3].length > 0) {
		  fields = [];
		  for(var j=2; j<values.length; j++) {
			if(typeof(values[j])=='string' && values[j].replace(/\s/g,'')!='') {
			  fields.push(values[j]);
			}
		  }
		  if(fields.length >= 2) {
			questionLines += fields.join(',')+'\n';
		  }
		}
	  }
	}
  }
  if(questionLines!='') {
    flashvars['questionLines'] = questionLines;	  
  }	  
  //console.log(flashvars);
  return flashvars;
}
/**
 * 抓取整個工作表的資料並轉為 Arithmetic 四則計算設定及題庫
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function sheetToArithmetic(url) {
  var data = await getSheetData(url);
  //console.log(data);
  var flashvars = {};
  var foundQindex = false;  
  var values, value;
  for(var i=0; i<data.length; i++) {
    values = data[i];
	if(typeof(values[1])=='string') {
	  value = '';
	  if( /title|introduction|scriptURL|setup_enabled|timer|questions|operator|level_\d+_[xy]/.test(values[1]) ) {
	    if(typeof(values[2])!= 'undefined' && values[2]!=null) {
		  value = values[2];
	    }
		flashvars[values[1]] = value;
	  }
	}
  }
  //console.log(flashvars);
  return flashvars;
}

/**
 * 抓取整個工作表的資料並轉為 Monopoly 設定及題庫
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function sheetToMonopoly(url) {
  var data = await getSheetData(url);
  //console.log(data);
  var flashvars = {};
  if(data.length > 0) {
    data.splice(0, 3); //去掉前面沒用的
    var col, k, v, node, child, id, type, text, title, step, options, answer;  
    var xmlString = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    var root = xmlDoc.querySelector('root');
    var tagNameMap = {}, keys;
    for(var i=0; i<data.length; i++) {
      col = data[i];
	  if(typeof(col[0])!='string' || col[0]=='') {
	    continue;
	  }
	  if(col[0]=='設定') {
        k = col[2];
		v = col[3];
		if(k!=null && v!=null) {
  		  node = xmlDoc.createElement('settings');
		  node.setAttribute(k, v);
		  root.appendChild(node);
		  if(k=='title') {
			  flashvars['gameTitle'] = v;
		  }
	    } 
	  } else if(col[0]=='格子內容') {
	    node = root.querySelector('blocks');
	    if(!node) {
		  node = xmlDoc.createElement('blocks');
		  root.appendChild(node);
		}
	    id = col[1];
		type = col[2]==null?'':col[2];
		text = col[3];
		if(id!=null && text!=null) {		  
		  child = xmlDoc.createElement('block');
		  child.setAttribute('id', id);
		  child.setAttribute('type', type);
		  child.setAttribute('text', text);
		  node.appendChild(child);
		}
	  } else {
	    title = col[0]; //==tag
		step = col[1];
		text = col[2];
		options = col[3];
		answer = col[4];
		if(title != null && step != null && text != null) {
		  if(!tagNameMap[title]) {
		    tagNameMap[title] = 'QA' + Object.keys(tagNameMap).length;
		  }
		  node = root.querySelector(tagNameMap[title]);
		  if(!node) {
		    node = xmlDoc.createElement(tagNameMap[title]);
			node.setAttribute('title', title);
			root.appendChild(node);
		  }
		  child = xmlDoc.createElement('item');
		  child.setAttribute('text', text);
		  child.setAttribute('step', step);
		  if(options!=null && answer!=null) {
		    //有選項的題型
			child.setAttribute('options', options);
			child.setAttribute('answer', answer);
		  }
		  node.appendChild(child);
		}
	  }
    }
    //將 block 的 type 改成對應的 tag name
    node = root.querySelectorAll('blocks block');
    if(node) {
      for(var i=0; i<node.length; i++) {
        type = node[i].getAttribute('type');
	    if(typeof(type)=='string' && type!='') {
	      node[i].setAttribute('type', tagNameMap[type]);
	    }
      }
    }
    //console.log(xmlDoc);
  }
  //轉為 xml 字串
  var serializer = new XMLSerializer();
  xmlString = '';
  try {
    xmlStr = serializer.serializeToString(xmlDoc);
  }catch(e) { console.log(e); };
  if(typeof(xmlStr)=='string') {
	flashvars['gameXML'] = xmlStr;
  }
  return flashvars;
}

/**
 * 以 & = 來解析出參數
 * @param {string} str 原始資料
 * @return {Object}
 */
function parseParams(str) {
  var pList = str.split(/&+/).filter(e=>e.replace(/\s/g,'')!='');
  var p = {};
  var f;
  for(var i=0; i<pList.length; i++) {
    f = pList[i].split('=');
	p[f[0]] = f[1];
  }
  return p;
}
/**
 * 將題庫資料換成這個順序排列: 題幹,答案,選項1,選項2,選項3,選項4
 * @param {Object} data 原始資料
 * @return {Object}
 */
function toQAO1O2O3O4(data) {
  //由第一列的標題判斷欄位
  var iQ = -1, iA = -1, iO = [], value;
  var qList = [];
  var col = data[0];
  for(var i=0; col && i<col.length; i++) {
    if(col[i].indexOf('題幹') >= 0 || col[i].indexOf('題目') >= 0) {
	  if(iQ < 0) {
        iQ = i;
	  }
	} else if(col[i].indexOf('答案') >= 0) {
	  if(iA < 0) {
        iA = i;
	  }
	} else if(col[i].indexOf('選項') >= 0) {
        iO.push(i);
	}
  }
  if(iQ >=0 && iA >= 0) {    
	for(var i=1; i<data.length; i++) {
      col = [];
	  col.push(data[i][iQ]);
	  col.push(data[i][iA]);
	  for(var j=0; j<iO.length; j++) {
		value = data[i][iO[j]];
		if(value && value!='') {
			col.push(value);
		}
	  }
	  qList.push(col);
	}
  }
  return qList;
}
/**
 * 將一維陣列變成以逗號分隔的多行字串
 * @param {Object} arr 原始資料
 * @return {string}
 */
function arryToString(arr) {
  var s = '';
  for(var i=0; i<arr.length; i++) {
	s += arr[i].join(',')+'\n';
  }
  return s;
}
/**
 * 製作 Teamplay 設定及題庫
 * @param {Object} data 由試算表查來的資料陣列
 * @return {Object|string}
 */
async function getFlashvarsOfTeamplay(data) {
  var flashvars = '';	
  if(data.length >= 2 && data[0] == 'teamplay') {
	//data[1].split(/&+/).filter(e=>e.replace(/\s/g,'')!='');	
    if(data[1] && /spreadsheets/.test(data[1]) && gdGetSpreadSheetID(data[1])!='') {
	  flashvars = await sheetToTeamplay(data[1]);
	} else {
		var params = parseParams(data[1]);
		if(data[2] && /spreadsheets/.test(data[2]) && gdGetSpreadSheetID(data[2])!='') {
		  var q = await getSheetData(data[2]);
		  q = toQAO1O2O3O4(q);
		  if(q.length > 0) {
			params['questionLines'] = arryToString(q).replace(/~~/g, ';');
			if(q[0].length == 2) {
				params['questionType'] = '兩欄式自動選項及答案';
			} else {
				params['questionType'] = '';
			}
			params['fieldsOrder'] = '題幹,答案,選項1,選項2,選項3,選項4';
		  }
		}
	    if(Object.keys(params).length > 0) {
		  flashvars = params;
		  //console.log(params);
		}
	}
  }
  return flashvars;
}
/**
 * 製作 Arithmetic 四則計算設定及題庫
 * @param {Object} data 由試算表查來的資料陣列
 * @return {Object|string}
 */
async function getFlashvarsOfArithmetic(data) {
  //arithmetic
  var flashvars = '';	
  if(data.length >= 2 && data[0] == 'arithmetic') {	
    if(data[1] && /spreadsheets/.test(data[1]) && gdGetSpreadSheetID(data[1])!='') {
	  flashvars = await sheetToArithmetic(data[1]);
	} else if(data[2] && /spreadsheets/.test(data[2]) && gdGetSpreadSheetID(data[2])!='') {
	  flashvars = await sheetToArithmetic(data[2]);		
	} else {
	  var params = parseParams(data[1]);
	  if(Object.keys(params).length > 2) {
        flashvars = params;
	    //console.log(params);
	  }
    }
  }
  return flashvars;
}
/**
 * 抓取整個工作表的資料
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function getSheetData(url) {
  var qURL = gdGetSpreadSheetQueryURL(url, '', '', 1);    
  var data = await gdGetSpreadSheetData(qURL); //抓題庫用(整個工作表的資料)
  return data;
}
async function getMenuItemFromSheet(sheetId, sheetGid, gameIdColName) {
    //setVisibility(0);

    //由選單工作表中抓出遊戲代碼
    //var query = `Select * where (A contains "${gameID}")`;
	var sheetUrl = gdGetSpreadSheetUrl(sheetId, sheetGid);
    var sql = `SELECT A,B WHERE ${gameIdColName} <> '' AND ${gameIdColName} IS NOT NULL`;  
    var queryURL  = gdGetSpreadSheetQueryURL(sheetUrl, '', sql, 1)
    var data = await gdGetSpreadSheetData(queryURL);
	
    rocketLaunch(false); //關閉火箭發射動畫

	if(data.length > 0) {
      //載入遊戲選單
      var menuItems = []; 
      for(var i=0; i<data.length; i++) {
	    //將參數重組為遊戲的網址
	    var gameURL = getGameURL(sheetId, '', data[i][0], gameIdColName, sheetGid, data[i][1]);
	    menuItems.push([gameURL, data[i][0]]); //暫存遊戲網址及遊戲代碼
	  } 
	  createGameMenu(menuItems); //製作遊戲選單	
	}
}
async function makeGameTest(swf_id, sheetId, gid, gameId) {
  var nocacheVal = '?nocache=' + new Date().getTime();
  
  var sheetURL = gdGetSpreadSheetUrl(sheetId, gid);
  var fnNames = {
	  'train': 'Train',
	  'f8_traina': 'Train',
	  'teamplay' : 'Teamplay',
	  'arithmetic': 'Arithmetic',
	  'monopoly': 'Monopoly',
  };
  
  var flashvars, data, swfURL, fnName;
  
  if(typeof(swf_id)=='string') {
	  swf_id = swf_id.toLowerCase();
  }
  
  //console.log('debug','\nswf_id\n',swf_id, '\nsheetId\n',sheetId, '\ngid\n',gid, '\ngameId\n',gameId);
  
  if(gameId != '') {
    data = await fetchGameDataFromSheet(sheetURL, gameId, 'A'); 
    swf_id = (data.length > 0 ? data[0]:'').toLowerCase();
	fnName = 'getFlashvarsOf' + fnNames[swf_id];
	//呼叫 getFlashvarsOfXxxxxx ,將資料轉為遊戲參數
    flashvars = await window[fnName](data);    
  } else { 
    //if(typeof(swf_id) != 'string' || swf_id == ''){
	//  //在試算表中的 B 欄中,找看看有沒有 SWF_ID
	//  data = await fetchGameDataFromSheet(sheetURL, 'SWF_ID', 'B');
	//  swf_id = (data.length > 0 ? data[0]:'').toLowerCase();
	//}
	if(typeof(swf_id) == 'string' && swf_id.replace(/\s/g,'') != ''){
	  fnName = 'sheetTo' + fnNames[swf_id];

	  //呼叫 sheetToXxxxxx , 取出指定網址的試算表內容
	  if(typeof(window[fnName]) == 'function') {
        flashvars = await window[fnName](sheetURL);  		
	  }
	} else {
	  await getMenuItemFromSheet(sheetId, gid, 'A');
	  return;
	}
  }
  if(typeof(swf_id) == 'string' && getSwfConfig(swf_id)){
    swfURL = 'https://gsyan888.github.io/flash/' + getSwfConfig(swf_id);
  } else {
	swfURL = '';
  }
    
  console.log('debug: ','\nflashvars: ', flashvars, '\nswfURL: ', swfURL);
  
  if(flashvars && swfURL != '') {
    var container = 'swfContainer';
    swfobject.embedSWF(swfURL, container, 800, 600, '', '', flashvars);
  } else {
	alert('** 找不到設定及題庫資料, 請確認後再試一次 **');
  }
};

