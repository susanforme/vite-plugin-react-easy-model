import fs from 'fs/promises';
import MagicString from 'magic-string';
import path from 'node:path';
import {
  ViteDevServer,
  normalizePath,
  parseAstAsync,
} from 'vite';
import { ResolvedOptions, UserOptions } from './type';
import { debug, removeExt, toUniqueArray } from './utils';
export class ModelContext {
  options: ResolvedOptions;
  root: string;
  #server?: ViteDevServer;
  #models: {
    path: string;
    namespace: string;
  }[];
  code: string;
  #virtualModuleId: string;
  /** 存储的import 体,用于在类型生成时替换 */
  #importBanner: {
    result: string;
    struct: {
      [name: string]: string;
    };
  } = {
    result: '',
    struct: {},
  };
  constructor(
    options: UserOptions,
    root: string,
    virtualModuleId: string,
  ) {
    this.options = this.#resolveOptions(options);
    this.#models = [];
    this.root = root;
    this.code = 'export default {};';
    this.#virtualModuleId = virtualModuleId;
  }
  #resolveOptions(options: UserOptions): ResolvedOptions {
    const { dirs = ['src/pages', 'src/models'] } = options;
    return {
      ...options,
      dirs,
      root: this.root,
    };
  }
  /** 存储的import 体,用于在类型生成时替换 */
  getImportBanner() {
    return this.#importBanner;
  }
  #sortAndUniqueModel() {
    this.#models = toUniqueArray(
      this.#models.sort((a, b) => {
        if (a.namespace < b.namespace) return -1;
        else if (a.namespace > b.namespace) return 1;
        return 0;
      }),
      (a, b) => a.namespace === b.namespace,
    );
  }
  async #writeCode(needUpdate = false) {
    // 写入之前需要对model进行排序,且去重
    this.#sortAndUniqueModel();

    const template = await fs.readFile(
      new URL('./templates/index.tsx', import.meta.url),
      {
        encoding: 'utf-8',
      },
    );

    const s = new MagicString(template);
    // 导入模块头部
    let importBanner = '';
    // 插入model模块
    let modelsBody = 'const models = {';
    this.#models.forEach((model, index) => {
      const transformPath = removeExt(model.path)
        .split(path.sep)
        .join('/');
      // 处理一下路径,不能包含后缀
      importBanner += `import model_${index} from '${transformPath}';\n`;
      this.#importBanner.struct[`model_${index}`] =
        transformPath;
      modelsBody += `model_${index}: {namespace: '${model.namespace}', model: model_${index}}`;
      if (index !== this.#models.length - 1) {
        modelsBody += ',';
      } else {
        modelsBody += '} as const;';
      }
    });
    if (this.#models.length === 0) {
      modelsBody += '};';
    }

    s.prepend(modelsBody);
    // 最后导入
    s.prepend(importBanner);
    this.#importBanner.result = importBanner;

    this.code = s.toString();
    if (needUpdate) {
      this.#update();
    }
  }
  #update() {
    debug.hmr('update model');
    this.#server?.ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          path: this.#virtualModuleId,
          acceptedPath: this.#virtualModuleId,
          timestamp: Date.now(),
        },
      ],
    });
  }
  async start() {
    const searchResult = await this.#searchGlob();
    this.#models = searchResult;
    await this.#writeCode();
  }
  async #searchGlob(dirs?: string[], rootDir?: string) {
    const r: {
      path: string;
      namespace: string;
    }[] = [];

    const actualDirs = dirs ?? this.options.dirs;
    // 获取所有的文件
    await Promise.all(
      actualDirs.map(async (dir) => {
        debug.search(`search ${dir}...`);
        // 递归扫描
        const currentPath = normalizePath(
          path.join(this.root, dir),
        );
        // 查找当前路径是否存在
        try {
          await fs.access(currentPath);
        } catch (error) {
          debug.search(`${currentPath} not found`);
          return;
        }
        // 保持相同的ignorePath
        const ignorePath = normalizePath(
          rootDir ?? path.join(this.root, dir),
        );
        const basename = path.basename(currentPath);
        const stat = await fs.stat(currentPath);
        if (stat.isDirectory()) {
          // 检查子路径
          const children = await fs.readdir(currentPath);
          const childSearch = await this.#searchGlob(
            children.map((v) => path.join(dir, v)),
            ignorePath,
          );
          r.push(...childSearch);
        } else {
          if (
            // 如果当前文件名为model，则直接返回
            this.#isModelFile(basename) ||
            // 如果路径中包含models,则返回
            this.#containerModelsDir(currentPath)
          ) {
            // 解析ast,判断是否有export default
            const code = await fs.readFile(currentPath, {
              encoding: 'utf-8',
            });
            try {
              const ast = await parseAstAsync(code);
              const exportDefault = ast.body.find(
                (node) =>
                  node.type === 'ExportDefaultDeclaration',
              );
              if (!exportDefault) {
                return;
              }
            } catch (error) {
              return;
            }
            // 现在路径减去ignorePath
            const relativePath = path.relative(
              ignorePath,
              currentPath,
            );
            r.push({
              path: currentPath,
              namespace:
                this.#transformPathToNamespace(
                  relativePath,
                ),
            });
          }
        }
      }),
    );
    return r;
  }
  #containerModelsDir(inputPath: string) {
    const pathSegments = inputPath.split(path.sep);
    // 检查是否包含名为models的目录,且不能为最后一级
    return (
      pathSegments.findIndex((v) => v === 'models') !==
      pathSegments.length - 1
    );
  }
  #isModelFile(basename: string) {
    return basename.split('.').slice(0, -1).join('');
  }
  #transformPathToNamespace(relativePath: string) {
    const removeSuffixPath = relativePath
      .split('.')
      .slice(0, -1)
      .join('');
    return removeSuffixPath
      .split(path.sep)
      .filter((path) => path !== 'models')
      .join('.');
  }
  setupViteServer(server: ViteDevServer) {
    if (this.#server === server) {
      return;
    }
    this.#server = server;
    this.setupWater(server.watcher);
  }
  setupWater(watcher: ViteDevServer['watcher']) {
    const searchNew = async (changePath: string) => {
      const actualPath = normalizePath(changePath);
      // 找到扫描的目录,只有在扫描目录中才添加文件
      const rootDirs = this.options.dirs.map((dir) =>
        normalizePath(path.resolve(this.root, dir)),
      );
      const father = rootDirs.find((v) =>
        actualPath.startsWith(v),
      );

      if (!father) {
        return;
      }
      const models = await this.#searchGlob(
        [path.relative(this.root, actualPath)],
        father,
      );
      if (models.length) {
        this.#models.push(models[0]);
        await this.#writeCode(true);
      } else {
        // 没查找到,且现在的model仍然存在残余,则删除
        const index = this.#models.findIndex(
          (v) => v.path === actualPath,
        );
        if (index !== -1) {
          this.#models.splice(index, 1);
          await this.#writeCode(true);
        }
      }
    };
    watcher.on('add', async (changePath) => {
      debug.search(`add ${changePath}`);
      await searchNew(changePath);
    });
    watcher.on('change', async (changePath) => {
      debug.search(`change ${changePath}`);
      // 若不存在,则判断下目前是否符合规范
      await searchNew(changePath);
    });
    watcher.on('unlink', (changePath) => {
      debug.search(`unlink ${changePath}`);

      const actualPath = normalizePath(changePath);
      const index = this.#models.findIndex(
        (v) => v.path === actualPath,
      );
      if (index !== -1) {
        this.#models.splice(index, 1);
        this.#writeCode(true);
      }
    });
  }
  get debug() {
    return debug;
  }
}
