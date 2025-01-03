@echo off
cmd /u /c dir /b ..\mp3 > ..\images_list.txt && .\ConvertZ.exe /i:ULE /o:utf8 ..\images_list.txt ..\images_list.txt