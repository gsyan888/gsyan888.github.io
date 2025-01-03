<?php
$pList="ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩˊˇˋ˙";
$lines = file("test.txt");

for($i=0 ; $i<sizeof($lines); $i++ ) {
	$line = trim($lines[$i]);
	if( $col = preg_split("/\s+/", $line) ) {
		for ($c = 0 ; $c<sizeof($col); $c++ ) {
			$output = "";
			$n = 0;
			do {
				//判斷是否為注音符號
				$ch = substr($col[$c], $n , 2);
				if (! strpos($pList , $ch ) ) {
					//在輸出國字之前先加個空格
					$output .= " ";	
				}
				$output .= $ch;
				$n += 2;
			} while( $n < strlen($col[$c]) ) ;
			print trim($output);
			print (  $c == sizeof($col) -1 ? ";\r\n" : "," );
		}
	}
}
					
?>