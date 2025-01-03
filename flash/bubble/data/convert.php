<?php
$lines = file("in.txt");
$qCount=1;
for($i=0; $i<sizeof($lines); $i++) {
	$line = trim($lines[$i]);
	if( $col = preg_split("/\s+/", $line) ) {
		//題目
		print "&q".$qCount."=".$col[0].";";
		for($c=1;$c<sizeof($col);$c++) {
			//正確答案
			print $col[$c];
			if($c<sizeof($col)-1) {
				print ",";
			} else {
				print ";";
			}
		}
		$line = trim($lines[$i+1]);
		if( $col = preg_split("/\s+/", $line) ) {
			for($c=0;$c<sizeof($col);$c++) {
				//錯誤答案
				print $col[$c];
				if($c<sizeof($col)-1) {
					print ",";
				} else {
					print ";";
				}
			}
		}
		print trim($lines[$i+2])."&\r\n";
		$i +=3 ;
		$qCount++;
	}
}
?>