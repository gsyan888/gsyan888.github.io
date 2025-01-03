<?php
//-------------------------------------------------
// arithmetic.swf 排行榜接收/傳送程式
// by 北市力行國小 gsyan  
// 最近更新 : 2013.11.15
//-------------------------------------------------
// 使用方法:
//	將此程式和 arithmetic.swf 放在一同一個目錄中
//	在 arithmetic.swf 的設定檔中,放入底下的參數
//
//		&scriptURL=arithmetic_top10.php&
//
//	依 $top10_folder 所指定的內容建立存放成績檔的目錄
//	預設是 $top10_folder = "top10" , 
//	所以建立一個名為 top10 的資料夾, 並將它的權限改為 777 (unix 中)
//
//-------------------------------------------------
// arithmetic.swf 會以 POST 的方式傳來以下的參數
// 	filename 	: swf 載入的設定檔的檔名
//	user 		: 使用者名稱
//	numLevel	: 通過的關數
//	timerTotal	: 花費的時間
//	timerDefault: 計時器倒數的秒數
//	totalDefault: 過關的題數
//
// arithmetic.swf 會以 GET 的方式傳來以下的參數
// 	filename 	: swf 載入的設定檔的檔名
//-------------------------------------------------
// arithmetic.swf 希望接收到的資料格式
//
// #\t使用者\t日期\t時間(秒)\n
// --\t------\t----------\t------\n";
//
// 第一欄為名次, 第二欄為使用者名稱,第三欄為送出資料的日期,第四欄為過關所花費的時間
// 每一欄間, 以 Tab 隔開
//
//-------------------------------------------------
// 可自訂的參數
//-------------------------------------------------

$top10_folder = "top10";			//存放記錄檔的資料夾(記得權限設為777)
$top10_filename_prefix = "score-";	//成績記錄檔檔名的前置字串


//-------------------------------------------------
// 程式: 底下的不需要更動
//-------------------------------------------------

//依使用者傳來的設定檔檔名, 重組記錄檔的檔名
if(isset($_GET['filename'])) {
	$filename = $top10_folder."/".$top10_filename_prefix.$_GET['filename'];
} else {
	$filename = $top10_folder."/arithmetic_top10.txt";
}
//先檢查記檔案是否存在, 不存在就新增檔案
if( !file_exists($filename) ) {
	if( $OUT = @fopen($filename, "w") ) {
		fclose($OUT);
	}
}

//如果傳來 user, timerTotal, timerDefault, totalDefault 
//就將成績寫入檔案中, 每個欄位間用半形逗號分隔
//依序為:timerDefault,totalDefault,numLevel,timerTotal,user,unix time stamp
if( isset($_POST['user']) && isset($_POST['timerTotal']) && isset($_POST['timerDefault']) && isset($_POST['totalDefault']) ) {
	if( $OUT = @fopen($filename, "a") ) {
		//過關時間,過關題數,level,花費時間,使用者代號,UnixTimeStamp
		fwrite($OUT, $_POST['timerDefault'].",".$_POST['totalDefault'].",".$_POST['numLevel'].",".$_POST['timerTotal'].",".$_POST['user'].",".time()."\r\n");
		fclose($OUT);
	} else {
		echo "無法寫入成績!!\n\n";
	}
}

//讀入成績檔案, 並輸出
if( $lines = @file($filename) ) {
	//將成績依出題設定及完成關數分開排序
	foreach($lines as $line) {
		$line = trim($line);
		if( $v = explode(",", $line) ) {
			//時間-題數_Level
			$level = $v[0]."-".$v[1]."_".$v[2]; //時間-題數_Level
			$record = $v[3];					//過關所花的時間
			$id = $v[4]."@".$v[5];				//user@unixTimeStamp
			//如果不是第一筆就在前面先加個半形逗號
			if( isset($data[$level][$record]) ) {
				$data[$level][$record] .= ",".$id;
			} else {
				$data[$level][$record] = $id;
			}
		}
	}
	//將時區設為台北
	date_default_timezone_set("Asia/Taipei");
	//將資料排序
	krsort($data);
	
	//開始解析資料庫
	foreach($data as $key=>$value) {
		//只顯示闖過幾關的, 想全部顯示就註解底下2行
		if( substr($key,-2) != '_5' ) {
			continue;
		}
		
		//依成績排序, 高分者在前
		ksort($data[$key], SORT_NUMERIC);
		
		$head = str_replace("-", "秒內完成",$key);
		$head = str_replace("_", "題，闖", $head);
		$head .= " 關";
		
		//依序輸出成績資料
		echo "#\t使用者\t日期\t時間(秒)\n";
		echo "--\t------\t----------\t------\n";
		$i=1;	//名次
		foreach($data[$key] as $k=>$v) {
			if( $users = explode(",", $v) ) {
				foreach($users as $u) {
					echo $i."\t";
					list($user, $timeStamp) = explode("@", $u);
					echo $user."\t";
					if(!((int)$timeStamp > 0)) {	//沒有記錄日期						
						$recordDate = " - ";
					} else {				//有記錄日期
						$tm = localtime((int)$timeStamp, true);
						$recordDate = sprintf("%d-%02d-%02d %02d:%02d:%02d", $tm['tm_year']+1900, $tm['tm_mon']+1, $tm['tm_mday'], $tm['tm_hour'], $tm['tm_min'], $tm['tm_sec']);
					}
					echo $recordDate."\t".$k."\n";
				}
				$i += count($users);
			} else {
				echo $i."\t";
				list($user, $timeStamp) = explode("@", $v);
				echo $user;
				if(!((int)$timeStamp > 0)) {	//沒有記錄日期
					$recordDate = " - ";
				} else {				//有記錄日期
					$tm = localtime($timeStamp, true);
					$recordDate = sprintf("%d-%02d-%02d %02d:%02d:%02d", $tm['tm_year']+1900, $tm['tm_mon']+1, $tm['tm_mday'], $tm['tm_hour'], $tm['tm_min'], $tm['tm_sec']);
				}
				echo $recordDate."\t".$k."\n";				
			}
			
		}
	}	
} else {
	echo "\n目前沒有任何記錄。\n";
}
?>