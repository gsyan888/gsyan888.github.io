@echo off
cmd /u /c dir /b ..\data > ..\list.txt && .\ConvertZ.exe /i:ULE /o:utf8 ..\list.txt ..\list.txt
