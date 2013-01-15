#!/bin/bash

OutFile="built/chondric.js"

echo Building $OutFile

cat src/app.js > $OutFile
cat src/view.js >> $OutFile
#cat src/page.js >> $OutFile
cat src/listsync.js >> $OutFile
cat src/versioneddatabase.js >> $OutFile


OutFile="built/chondric.css"

echo Building $OutFile

cat src/app.css > $OutFile
