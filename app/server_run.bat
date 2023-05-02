@ECHO OFF
TITLE Run node.js server

ECHO Start Server ....


git clone https://github.com/danilnetosin33/ib-tws.git
cd ib-tws
npm i 
node order.js

PAUSE