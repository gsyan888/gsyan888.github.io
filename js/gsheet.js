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
/**
 * 判斷網址是否為 Google SpreadSheet
 * @param {string} url 試算表的網址
 * @return {boolean} 
 */
function gdIsSpreadSheetUrl(url) {
  return ( typeof(url)=='string' && /sheets/.test(url) && gdGetSpreadSheetID(url)!='' );
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
 * @param {number} timeoutTotal 等幾個輪迴
 * @return {Object'}
 */
async function gdGetSpreadSheetData(url, callback, timeoutTotal)  {
  timeoutTotal = timeoutTotal || 30; // 30 * 100 = 3sec. 等它3秒查詢
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
	if( typeof callback == 'function' ) {
      callback(sheetQueryResult);	//執行指定的函數
    } 
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
      callback(sheetQueryResult);	//執行指定的函數
    } else {
      var msg = '無法載入設定.';
      var resultBlock = document.querySelector('.resultBlock');
      if(typeof(resultBlock)!='undefined' && resultBlock!=null) {
        msg += '\n\n請確認一下:\n\n* 試算表共用連結的網址是否正確, \n\n* 是否開放任何人都可以檢視.';
        resultBlock.style.display = 'none';			
      }
      //setTimeout(function() {
      //  alert(msg);
      //}, 100);
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
 * 抓取整個工作表的資料
 * @param {string} url Google 試算表共用連結的網
 * @return {Object}
 */
async function getSheetData(url) {
  var qURL = gdGetSpreadSheetQueryURL(url, '', '', 0);    
  var data = await gdGetSpreadSheetData(qURL); //抓題庫用(整個工作表的資料)
  return data;
}



