<?php
$pList="�t�u�v�w�x�y�z�{�|�}�~������������������������������������������������������������";
$lines = file("test.txt");

for($i=0 ; $i<sizeof($lines); $i++ ) {
	$line = trim($lines[$i]);
	if( $col = preg_split("/\s+/", $line) ) {
		for ($c = 0 ; $c<sizeof($col); $c++ ) {
			$output = "";
			$n = 0;
			do {
				//�P�_�O�_���`���Ÿ�
				$ch = substr($col[$c], $n , 2);
				if (! strpos($pList , $ch ) ) {
					//�b��X��r���e���[�ӪŮ�
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