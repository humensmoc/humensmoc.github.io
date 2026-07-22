import { randomUUID } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';

import { validateLibrary } from './library.js';

function assertValidLibrary(library) {
  const errors = validateLibrary(library);
  if (errors.length) throw new Error(`数据校验失败：\n${errors.join('\n')}`);
}

export async function readLibrary(filePath) {
  const text = await readFile(filePath, 'utf8');
  let library;
  try {
    library = JSON.parse(text);
  } catch (error) {
    throw new Error(`JSON 格式错误：${error.message}`, { cause: error });
  }
  assertValidLibrary(library);
  return library;
}

export async function writeLibrary(filePath, library, io = {}) {
  assertValidLibrary(library);
  const write = io.writeFile ?? writeFile;
  const move = io.rename ?? rename;
  const remove = io.unlink ?? unlink;
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;

  try {
    await write(temporaryPath, `${JSON.stringify(library, null, 2)}\n`, 'utf8');
    await move(temporaryPath, filePath);
  } finally {
    try {
      await remove(temporaryPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}
