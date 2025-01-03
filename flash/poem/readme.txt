=-=-=-=-=-=-=-=-=-=-=
 唐詩三百首 Flash 版
=-=-=-=-=-=-=-=-=-=-=

------------------------------------------------------------------------------------
Created:	2006.03
Last modified:	2006.03.19
Author:		台北市力行國小 顏國雄 gsyan@lsps.tp.edu.tw	
------------------------------------------------------------------------------------


源起
------
班上持續在推每週一唐詩的活動，

在網路上用過多次由羅鳳珠教授所建立的

　唐詩世界網站 (http://cls.admin.yzu.edu.tw/300/ALL/CONTENT/ROMANCE.HTM)

不過由於它是用網頁的方式呈現，注音的部份並無法依一般習慣顯示在字的右邊，
對孩子們來說，將注音放在國字的下面總是怪怪的，
剛好前一陣子在研究 Flash 時寫了個可在每個國字旁加注音的程式，
於是搭配 php 程式，將網站上的詩唐批次抓成文字檔並轉換成合適的格式，
現在可以在 Flash 中顯示有正確注音的唐詩了。


程式
-----
poem_one.swf	讀取 set.txt 中的設定，顯示指定的唐詩

poem.swf	執行後讓使用者選取唐詩後顯示


set.txt
--------
功能：設定要讀取的唐詩的詩體和要顯示的編號，例如：

	styleName=七言絕句&selectedNum=3

	讓 poem_one.swf 讀取七言絕句(7-regular-verse.txt)中的第三首詩

	styleName :

	設定值		對映的資料檔案
	-----------	--------------------------
	五言絕句	5-quatrain.txt
	七言絕句	7-quatrain.txt
	五言律詩	5-regular-verse.txt
	七言律詩	7-regular-verse.txt
	五言古詩	5-ancient-verse.txt
	七言古詩	7-ancient-verse.txt
	樂府		folk-song-styled-verse.txt


唐詩三百首來源
---------------
	唐詩內容主要擷取自下面的網址:
	http://cls.admin.yzu.edu.tw/300/ALL/CONTENT/ROMANCE.HTM

ToDo
-----

1.由網站抓來的資料部份有問題已修正, 應該還有少數幾首注音或內容待修。
2.加上列印的功能。

