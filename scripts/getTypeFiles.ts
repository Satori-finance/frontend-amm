const path = require('path')
const fs = require('fs')

export function getTypeFiles(basePath: string) {
  const typeFiles: string[] = [];

  function findTypeFile(p: string) {
    const files = fs.readdirSync(p);
    files.forEach((item: string) => {
      const fPath = path.join(p, item);
      const stat = fs.statSync(fPath);
      if (stat.isDirectory() === true) {
        findTypeFile(fPath);
      }
      if (stat.isFile() === true) {
        typeFiles.push(fPath.replace(/\\/g, '/'));
      }
    });
  }

  findTypeFile(basePath);

  return typeFiles
}
