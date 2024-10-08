import { exec } from 'child_process';
import Debug from 'debug';
import fs from 'fs/promises';
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'path';
import { ModelContext } from './context';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const debug = {
  hmr: Debug('vite-plugin-react-easy-model:hmr'),
  search: Debug('vite-plugin-react-easy-model:search'),
};

/**
 * 去除路径的后缀,且不能错误的去除前面路径的.
 */
export function removeExt(path: string) {
  const index = path.lastIndexOf('.');
  if (index === -1 || index === 0) return path;
  return path.slice(0, index);
}

/**
 * @description 根据传入条件,返回一个唯一数组
 */
export function toUniqueArray<T>(
  arr: T[],
  compare: (a: T, b: T) => boolean,
): T[] {
  const result: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (!result.some((item) => compare(arr[i], item))) {
      result.push(arr[i]);
    }
  }
  return result;
}
/**
 * @param time 延迟时间
 * @description 睡一会~
 */
export const sleep = (time: number) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(true);
    }, time);
  });
};
/**
 * @description: 监听条件是否满足,满足执行回调
 * @param  condition 条件
 * @param  callback 回调
 * @param  time 间隔时间
 */
export async function ensure(
  condition: () => boolean | Promise<boolean>,
  callback?: Function,
  time = 400,
) {
  const result = await condition();
  if (result) {
    callback?.();
  } else {
    await sleep(time);
    await ensure(condition, callback, time);
  }
}
export async function checkFileAlive(
  filePath: string,
): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function createDeclarations(
  ctx: ModelContext,
) {
  const code = ctx.code;
  const buildFile = async (filePath: string) => {
    const isAlive = await checkFileAlive(filePath);
    if (!isAlive) {
      await sleep(100);
      return createDeclarations(ctx);
    }
    return new Promise((resolve, reject) => {
      const child = exec(
        `tsc ${filePath} --outDir ${path.resolve(
          __dirname,
          './cache',
        )}  --declaration --emitDeclarationOnly --allowJs --skipLibCheck  --rootdir ./ 
        `,
      );
      child.addListener('close', () => {
        resolve(true);
      });
      child.addListener('error', (err) => {
        reject(err);
      });
    });
  };
  const fileUrl = path.resolve(
    __dirname,
    './.cache.tsx',
  );
  await fs.writeFile(fileUrl, code, {
    // 不存在则创建
    flag: 'w+',
    encoding: 'utf-8',
  });
  await buildFile(fileUrl);
  const banners = ctx.getImportBanner();

  const cacheUrl = path.resolve(
    __dirname,
    '../dist/.cache.d.ts',
  );
  debug.hmr('read cache........', cacheUrl);
  await ensure(() => checkFileAlive(cacheUrl));
  debug.hmr('read cache completed');

  let content = await fs.readFile(cacheUrl, {
    encoding: 'utf-8',
  });
  // 操作类型
  // 1. 将所有的declare 删除
  content = content.replaceAll('declare', '');
  // 2. 将所有的import 替换为 type
  if (Object.keys(banners.struct).length > 0) {
    let destructions = '';
    const codeBody = Object.entries(banners.struct).reduce(
      (prev, [name, value]) => {
        const code = `${name}: (typeof import('${value}'))['default'];\n`;
        destructions += `${name},`;
        return prev + code;
      },
      '',
    );
    content = content.replaceAll(
      banners.result,
      `
      const {
        ${destructions}
      }:{
       ${codeBody}
      };
    `,
    );
  }

  // 写入client.d.ts
  await fs.writeFile(
    path.resolve(__dirname, '../client.d.ts'),
    `
     declare module '~react-model' {
        // import React from 'react';
        ${content.replaceAll('declare', '')}
      }
    `,
    {
      encoding: 'utf-8',
    },
  );
}
