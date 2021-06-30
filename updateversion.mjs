

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('package.json'));
const oldversion = data.version.trim().split('.');
const newversion = [...oldversion];
newversion[newversion.length-1]=''+(parseInt(newversion[newversion.length-1])+1);
console.log(`updating version to ${newversion.join('.')}...`);
data.version=newversion.join('.');
writeFileSync('package.json', JSON.stringify(data,null,2));