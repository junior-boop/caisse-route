import { readFileSync } from 'fs';

const file = process.argv[2];
const buf = readFileSync(file);

const numTables = buf.readUInt16BE(4);
let nameTableOffset = null;
for (let i = 0; i < numTables; i++) {
  const recordOffset = 12 + i * 16;
  const tag = buf.toString('ascii', recordOffset, recordOffset + 4);
  if (tag === 'name') {
    nameTableOffset = buf.readUInt32BE(recordOffset + 8);
    break;
  }
}
if (nameTableOffset == null) {
  console.log(file, '-> no name table');
  process.exit(0);
}

const format = buf.readUInt16BE(nameTableOffset);
const count = buf.readUInt16BE(nameTableOffset + 2);
const stringOffset = buf.readUInt16BE(nameTableOffset + 4);

const wanted = { 1: 'family', 2: 'subfamily', 4: 'full', 6: 'postscript', 16: 'typoFamily', 17: 'typoSubfamily' };
const results = {};

for (let i = 0; i < count; i++) {
  const recOffset = nameTableOffset + 6 + i * 12;
  const platformID = buf.readUInt16BE(recOffset);
  const nameID = buf.readUInt16BE(recOffset + 6);
  const length = buf.readUInt16BE(recOffset + 8);
  const offset = buf.readUInt16BE(recOffset + 10);
  if (!wanted[nameID]) continue;
  const dataStart = nameTableOffset + stringOffset + offset;
  let value;
  if (platformID === 1) {
    value = buf.toString('latin1', dataStart, dataStart + length);
  } else {
    value = buf.toString('utf16le', dataStart, dataStart + length).split('').filter((_, idx) => true).join('');
    // utf16be -> need manual swap since Buffer utf16le expects LE
    const bytes = buf.subarray(dataStart, dataStart + length);
    let s = '';
    for (let j = 0; j < bytes.length; j += 2) {
      s += String.fromCharCode(bytes.readUInt16BE(j));
    }
    value = s;
  }
  const key = wanted[nameID];
  if (!results[key]) results[key] = value;
}

console.log(file, JSON.stringify(results));
