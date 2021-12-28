"use strict";
exports.__esModule = true;
exports.getTypeFiles = void 0;
var path = require('path');
var fs = require('fs');
function getTypeFiles(basePath) {
    var typeFiles = [];
    function findTypeFile(p) {
        var files = fs.readdirSync(p);
        files.forEach(function (item) {
            var fPath = path.join(p, item);
            var stat = fs.statSync(fPath);
            if (stat.isDirectory() === true) {
                findTypeFile(fPath);
            }
            if (stat.isFile() === true) {
                typeFiles.push(fPath.replace(/\\/g, '/'));
            }
        });
    }
    findTypeFile(basePath);
    return typeFiles;
}
exports.getTypeFiles = getTypeFiles;
