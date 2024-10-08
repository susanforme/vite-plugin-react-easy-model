/*
 * @Author: 冉志诚
 * @Date: 2024-08-06 14:54:40
 * @LastEditTime: 2024-08-13 15:44:34
 * @FilePath: \vite-plugin-react-easy-model\packages\model\build.config.ts
 * @Description:
 */
import fs from 'node:fs';
import path from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig([
  {
    externals: ['vite','typescript'],
    
    clean: true,
    declaration: true,
    entries: ['src/index'],
    rollup: {
      emitCJS: true,
      inlineDependencies: true,
    },
    hooks: {
      'build:done'(ctx) {
        const templatePath = path.resolve(
          ctx.options.rootDir,
          'src/templates',
        );
        const outputTemplatePath = path.resolve(
          ctx.options.outDir,
          'templates',
        );
        fs.cpSync(templatePath, outputTemplatePath, {
          force: true,
          recursive: true,
        });
      },
    },
  },

]);
