<?php
$filename = "math_multi_top10.txt";

if( isset($_POST['user']) && isset($_POST['timerTotal']) && isset($_POST['timerDefault']) && isset($_POST['totalDefault']) ) {
	if( $OUT = fopen($filename, "a") ) {
		//過關時間,過關題數,level,花費時間,使用者代號,UnixTimeStamp
		fwrite($OUT, $_POST['timerDefault'].",".$_POST['totalDefault'].",".$_POST['numLevel'].",".$_POST['timerTotal'].",".$_POST['user'].",".time()."\r\n");
		fclose($OUT);
	}
}
?>
<html>
<head>
<title>排行榜</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
<h1>排行榜</h1>
<?
if( $lines = file($filename) ) {
	foreach($lines as $line) {
		$line = trim($line);
		if( $v = explode(",", $line) ) {
			//時間-題數_Level
			if( isset($data[$v[0]."-".$v[1]."_".$v[2]][$v[3]]) ) {
				$data[$v[0]."-".$v[1]."_".$v[2]][$v[3]] .= ",".$v[4]."@".$v[5];
			} else {
				$data[$v[0]."-".$v[1]."_".$v[2]][$v[3]] = $v[4]."@".$v[5];
			}
		}
	}
	date_default_timezone_set("Asia/Taipei");
	krsort($data);
	foreach($data as $key=>$value) {
		//只顯示闖過幾關的, 想全部顯示就註解底下3行
		if( substr($key,-2) != '_5' ) {
			continue;
		}
		
		ksort($data[$key], SORT_NUMERIC);
		$head = str_replace("-", "秒內完成",$key);
		$head = str_replace("_", "題，闖", $head);
		$head .= " 關";
		echo "<h3>".$head."</h3>\r\n";
		echo "<table border=\"1\" width=\"500\">\r\n";
		echo "<tr><td align=\"center\" width=\"30\">#</td><td width=\"250\">使用者</td><td width=\"150\" align=\"center\">日期</td><td width=\"100\" align=\"center\">時間(秒)</td></tr>\r\n";
		$i=1;
		foreach($data[$key] as $k=>$v) {
			if( $users = explode(",", $v) ) {
				foreach($users as $u) {
					echo "<tr><td align=\"center\">".$i."</td><td>";
					list($user, $timeStamp) = explode("@", $u);
					echo $user;
					if(!((int)$timeStamp > 0)) {	//沒有記錄日期						
						$recordDate = " - ";
					} else {				//有記錄日期
						$tm = localtime((int)$timeStamp, true);
						$recordDate = sprintf("%d-%02d-%02d %02d:%02d:%02d", $tm['tm_year']+1900, $tm['tm_mon']+1, $tm['tm_mday'], $tm['tm_hour'], $tm['tm_min'], $tm['tm_sec']);
					}
					echo "</td><td align=\"center\">".$recordDate."</td><td align=\"right\">".$k."</td>\r\n";
				}
				$i += count($users);
			} else {
				//echo "<tr><td align=\"center\">".$i++."</td><td>".$v."</td><td align=\"right\">".$k."</td>\r\n";
					echo "<tr><td align=\"center\">".$i."</td><td>";
					list($user, $timeStamp) = explode("@", $v);
					echo $user;
					if(!((int)$timeStamp > 0)) {	//沒有記錄日期
						$recordDate = " - ";
					} else {				//有記錄日期
						$tm = localtime($timeStamp, true);
						$recordDate = sprintf("%d-%02d-%02d %02d:%02d:%02d", $tm['tm_year']+1900, $tm['tm_mon']+1, $tm['tm_mday'], $tm['tm_hour'], $tm['tm_min'], $tm['tm_sec']);
					}
					echo "</td><td align=\"center\">".$recordDate."</td><td align=\"right\">".$k."</td>\r\n";
				
			}
			
		}
		echo "</table><br />\r\n";
	}	
}
?>
</body>
</html>