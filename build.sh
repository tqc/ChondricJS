#!/bin/bash

OutFile="built/chondric.js"

echo Building $OutFile

cat src/AppFrameWork.js > $OutFile
cat src/listsync.js >> $OutFile
cat src/versioneddatabase.js >> $OutFile


OutFile="built/chondric.css"

echo Building $OutFile

cat src/AppFrameWork.css > $OutFile
