<?php
/* ----------------------------------------------------------------------
1.將 logger.php 上載到 web server
2.建立一個存放記錄檔的資料夾 (ex. data)
3.將資料夾的權限設為 777

呼叫語法: 			http://......./logger.php?datafile=xxxxx.csv
記錄檔的下載路徑: 	http://......./data/xxxxx.csv
--------------------------------------------------------------------------*/

$file_name = "score.csv";		//default filename
$folder_name = "data";			//folder name

if(isset($_POST['result'])) {
	echo '&result='.$_POST['result'];
	
	if( isset($_GET['datafile']) ) {
		$file_name = $_GET['datafile'];
	}
	$file_name = $folder_name.'/'.$file_name;
	
	if( $OUT = fopen($file_name, 'a+') ) {
		$Windows_dateTime = time()/ 86400 + 25569;		//convert Unix Time to Windows date time format
		fwrite($OUT, $Windows_dateTime.','.$_POST['result']."\r\n");
		fclose($OUT);
	} else {
		echo "&status=File_Write_Error";
	}
} else {
	echo "&status=NG";
}
?>