/*
 * @Author: 冉志诚
 * @Date: 2024-08-01 15:16:08
 * @LastEditTime: 2024-08-14 15:53:34
 * @FilePath: \vite-plugin-react-easy-model\packages\model\src\index.ts
 * @Description:
 */
import { Plugin, transformWithEsbuild } from 'vite';
import { ModelContext } from './context';
import { UserOptions } from './type';
import { createDeclarations } from './utils';

export async function model(
  options: UserOptions = {},
): Promise<Plugin> {
  const virtualModuleId = '~react-model';
  let ctx: ModelContext;

  return {
    name: 'vite-plugin-react-easy-model',
    enforce: 'pre',
    async configResolved(config) {
      ctx = new ModelContext(
        options,
        config.root,
        virtualModuleId,
      );
      await ctx.start();
    },
    configureServer(server) {
      ctx.setupViteServer(server);
    },
    resolveId(source, importer, options) {
      if (source === virtualModuleId) {
        return source;
      }
    },
    async load(id, options) {
      if (id === virtualModuleId) {
        // 将代码写入缓存
        try {
          createDeclarations(ctx);
        } catch (error) {
          ctx.debug.hmr(`创建类型文件失败`);
        }
        const { code, map } = await transformWithEsbuild(
          ctx.code,
          '',
          {
            loader: 'tsx',
          },
        );
        return {
          code,
          map,
        };
      }
    },
  };
}
