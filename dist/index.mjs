import { normalizePath, parseAstAsync, transformWithEsbuild } from 'vite';
import fs from 'fs/promises';
import MagicString from 'magic-string';
import path$1 from 'node:path';
import { exec } from 'child_process';
import Debug from 'debug';
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const debug = {
  hmr: Debug("vite-plugin-react-easy-model:hmr"),
  search: Debug("vite-plugin-react-easy-model:search")
};
function removeExt(path2) {
  const index = path2.lastIndexOf(".");
  if (index === -1 || index === 0)
    return path2;
  return path2.slice(0, index);
}
function toUniqueArray(arr, compare) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (!result.some((item) => compare(arr[i], item))) {
      result.push(arr[i]);
    }
  }
  return result;
}
const sleep = (time) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(true);
    }, time);
  });
};
async function ensure(condition, callback, time = 400) {
  const result = await condition();
  if (result) {
    callback?.();
  } else {
    await sleep(time);
    await ensure(condition, callback, time);
  }
}
async function checkFileAlive(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
async function createDeclarations(ctx) {
  const code = ctx.code;
  const buildFile = async (filePath) => {
    const isAlive = await checkFileAlive(filePath);
    if (!isAlive) {
      await sleep(100);
      return createDeclarations(ctx);
    }
    return new Promise((resolve, reject) => {
      const child = exec(
        `tsc ${filePath} --outDir ${path.resolve(
          __dirname,
          "./cache"
        )} --declaration --emitDeclarationOnly 
        `
      );
      child.addListener("close", () => {
        resolve(true);
      });
      child.addListener("error", (err) => {
        reject(err);
      });
    });
  };
  const fileUrl = path.resolve(
    __dirname,
    "./.cache.tsx"
  );
  await fs.writeFile(fileUrl, code, {
    // 不存在则创建
    flag: "w+",
    encoding: "utf-8"
  });
  await buildFile(fileUrl);
  const banners = ctx.getImportBanner();
  const cacheUrl = path.resolve(
    __dirname,
    Object.keys(banners.struct).length > 0 ? "../dist/cache/dist/.cache.d.ts" : "../dist/cache/.cache.d.ts"
  );
  debug.hmr("read cache........", cacheUrl);
  await ensure(() => checkFileAlive(cacheUrl));
  debug.hmr("read cache completed");
  let content = await fs.readFile(cacheUrl, {
    encoding: "utf-8"
  });
  content = content.replaceAll("declare", "");
  if (Object.keys(banners.struct).length > 0) {
    let destructions = "";
    const codeBody = Object.entries(banners.struct).reduce(
      (prev, [name, value]) => {
        const code2 = `${name}: (typeof import('${value}'))['default'];
`;
        destructions += `${name},`;
        return prev + code2;
      },
      ""
    );
    content = content.replaceAll(
      banners.result,
      `
      const {
        ${destructions}
      }:{
       ${codeBody}
      };
    `
    );
  }
  await fs.writeFile(
    path.resolve(__dirname, "../client.d.ts"),
    `
     declare module '~react-model' {
        // import React from 'react';
        ${content.replaceAll("declare", "")}
      }
    `,
    {
      encoding: "utf-8"
    }
  );
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _server, _models, _virtualModuleId, _importBanner, _resolveOptions, resolveOptions_fn, _sortAndUniqueModel, sortAndUniqueModel_fn, _writeCode, writeCode_fn, _update, update_fn, _searchGlob, searchGlob_fn, _containerModelsDir, containerModelsDir_fn, _isModelFile, isModelFile_fn, _transformPathToNamespace, transformPathToNamespace_fn;
class ModelContext {
  constructor(options, root, virtualModuleId) {
    __privateAdd(this, _resolveOptions);
    __privateAdd(this, _sortAndUniqueModel);
    __privateAdd(this, _writeCode);
    __privateAdd(this, _update);
    __privateAdd(this, _searchGlob);
    __privateAdd(this, _containerModelsDir);
    __privateAdd(this, _isModelFile);
    __privateAdd(this, _transformPathToNamespace);
    __publicField(this, "options");
    __publicField(this, "root");
    __privateAdd(this, _server, void 0);
    __privateAdd(this, _models, void 0);
    __publicField(this, "code");
    __privateAdd(this, _virtualModuleId, void 0);
    /** 存储的import 体,用于在类型生成时替换 */
    __privateAdd(this, _importBanner, {
      result: "",
      struct: {}
    });
    this.options = __privateMethod(this, _resolveOptions, resolveOptions_fn).call(this, options);
    __privateSet(this, _models, []);
    this.root = root;
    this.code = "export default {};";
    __privateSet(this, _virtualModuleId, virtualModuleId);
  }
  /** 存储的import 体,用于在类型生成时替换 */
  getImportBanner() {
    return __privateGet(this, _importBanner);
  }
  async start() {
    const searchResult = await __privateMethod(this, _searchGlob, searchGlob_fn).call(this);
    __privateSet(this, _models, searchResult);
    await __privateMethod(this, _writeCode, writeCode_fn).call(this);
  }
  setupViteServer(server) {
    if (__privateGet(this, _server) === server) {
      return;
    }
    __privateSet(this, _server, server);
    this.setupWater(server.watcher);
  }
  setupWater(watcher) {
    const searchNew = async (changePath) => {
      const actualPath = normalizePath(changePath);
      const rootDirs = this.options.dirs.map(
        (dir) => normalizePath(path$1.resolve(this.root, dir))
      );
      const father = rootDirs.find(
        (v) => actualPath.startsWith(v)
      );
      if (!father) {
        return;
      }
      const models = await __privateMethod(this, _searchGlob, searchGlob_fn).call(this, [path$1.relative(this.root, actualPath)], father);
      if (models.length) {
        __privateGet(this, _models).push(models[0]);
        await __privateMethod(this, _writeCode, writeCode_fn).call(this, true);
      } else {
        const index = __privateGet(this, _models).findIndex(
          (v) => v.path === actualPath
        );
        if (index !== -1) {
          __privateGet(this, _models).splice(index, 1);
          await __privateMethod(this, _writeCode, writeCode_fn).call(this, true);
        }
      }
    };
    watcher.on("add", async (changePath) => {
      debug.search(`add ${changePath}`);
      await searchNew(changePath);
    });
    watcher.on("change", async (changePath) => {
      debug.search(`change ${changePath}`);
      await searchNew(changePath);
    });
    watcher.on("unlink", (changePath) => {
      debug.search(`unlink ${changePath}`);
      const actualPath = normalizePath(changePath);
      const index = __privateGet(this, _models).findIndex(
        (v) => v.path === actualPath
      );
      if (index !== -1) {
        __privateGet(this, _models).splice(index, 1);
        __privateMethod(this, _writeCode, writeCode_fn).call(this, true);
      }
    });
  }
  get debug() {
    return debug;
  }
}
_server = new WeakMap();
_models = new WeakMap();
_virtualModuleId = new WeakMap();
_importBanner = new WeakMap();
_resolveOptions = new WeakSet();
resolveOptions_fn = function(options) {
  const { dirs = ["src/pages", "src/models"] } = options;
  return {
    ...options,
    dirs,
    root: this.root
  };
};
_sortAndUniqueModel = new WeakSet();
sortAndUniqueModel_fn = function() {
  __privateSet(this, _models, toUniqueArray(
    __privateGet(this, _models).sort((a, b) => {
      if (a.namespace < b.namespace)
        return -1;
      else if (a.namespace > b.namespace)
        return 1;
      return 0;
    }),
    (a, b) => a.namespace === b.namespace
  ));
};
_writeCode = new WeakSet();
writeCode_fn = async function(needUpdate = false) {
  __privateMethod(this, _sortAndUniqueModel, sortAndUniqueModel_fn).call(this);
  const template = await fs.readFile(
    new URL("./templates/index.tsx", import.meta.url),
    {
      encoding: "utf-8"
    }
  );
  const s = new MagicString(template);
  let importBanner = "";
  let modelsBody = "const models = {";
  __privateGet(this, _models).forEach((model, index) => {
    const transformPath = removeExt(model.path).split(path$1.sep).join("/");
    importBanner += `import model_${index} from '${transformPath}';
`;
    __privateGet(this, _importBanner).struct[`model_${index}`] = transformPath;
    modelsBody += `model_${index}: {namespace: '${model.namespace}', model: model_${index}}`;
    if (index !== __privateGet(this, _models).length - 1) {
      modelsBody += ",";
    } else {
      modelsBody += "} as const;";
    }
  });
  if (__privateGet(this, _models).length === 0) {
    modelsBody += "};";
  }
  s.prepend(modelsBody);
  s.prepend(importBanner);
  __privateGet(this, _importBanner).result = importBanner;
  this.code = s.toString();
  if (needUpdate) {
    __privateMethod(this, _update, update_fn).call(this);
  }
};
_update = new WeakSet();
update_fn = function() {
  debug.hmr("update model");
  __privateGet(this, _server)?.ws.send({
    type: "update",
    updates: [
      {
        type: "js-update",
        path: __privateGet(this, _virtualModuleId),
        acceptedPath: __privateGet(this, _virtualModuleId),
        timestamp: Date.now()
      }
    ]
  });
};
_searchGlob = new WeakSet();
searchGlob_fn = async function(dirs, rootDir) {
  const r = [];
  const actualDirs = dirs ?? this.options.dirs;
  await Promise.all(
    actualDirs.map(async (dir) => {
      debug.search(`search ${dir}...`);
      const currentPath = normalizePath(
        path$1.join(this.root, dir)
      );
      try {
        await fs.access(currentPath);
      } catch (error) {
        debug.search(`${currentPath} not found`);
        return;
      }
      const ignorePath = normalizePath(
        rootDir ?? path$1.join(this.root, dir)
      );
      const basename = path$1.basename(currentPath);
      const stat = await fs.stat(currentPath);
      if (stat.isDirectory()) {
        const children = await fs.readdir(currentPath);
        const childSearch = await __privateMethod(this, _searchGlob, searchGlob_fn).call(this, children.map((v) => path$1.join(dir, v)), ignorePath);
        r.push(...childSearch);
      } else {
        if (
          // 如果当前文件名为model，则直接返回
          __privateMethod(this, _isModelFile, isModelFile_fn).call(this, basename) || // 如果路径中包含models,则返回
          __privateMethod(this, _containerModelsDir, containerModelsDir_fn).call(this, currentPath)
        ) {
          const code = await fs.readFile(currentPath, {
            encoding: "utf-8"
          });
          try {
            const ast = await parseAstAsync(code);
            const exportDefault = ast.body.find(
              (node) => node.type === "ExportDefaultDeclaration"
            );
            if (!exportDefault) {
              return;
            }
          } catch (error) {
            return;
          }
          const relativePath = path$1.relative(
            ignorePath,
            currentPath
          );
          r.push({
            path: currentPath,
            namespace: __privateMethod(this, _transformPathToNamespace, transformPathToNamespace_fn).call(this, relativePath)
          });
        }
      }
    })
  );
  return r;
};
_containerModelsDir = new WeakSet();
containerModelsDir_fn = function(inputPath) {
  const pathSegments = inputPath.split(path$1.sep);
  return pathSegments.findIndex((v) => v === "models") !== pathSegments.length - 1;
};
_isModelFile = new WeakSet();
isModelFile_fn = function(basename) {
  return basename.split(".").slice(0, -1).join("");
};
_transformPathToNamespace = new WeakSet();
transformPathToNamespace_fn = function(relativePath) {
  const removeSuffixPath = relativePath.split(".").slice(0, -1).join("");
  return removeSuffixPath.split(path$1.sep).filter((path2) => path2 !== "models").join(".");
};

async function model(options = {}) {
  const virtualModuleId = "~react-model";
  let ctx;
  return {
    name: "vite-plugin-react-easy-model",
    enforce: "pre",
    async configResolved(config) {
      ctx = new ModelContext(
        options,
        config.root,
        virtualModuleId
      );
      await ctx.start();
    },
    configureServer(server) {
      ctx.setupViteServer(server);
    },
    resolveId(source, importer, options2) {
      if (source === virtualModuleId) {
        return source;
      }
    },
    async load(id, options2) {
      if (id === virtualModuleId) {
        try {
          createDeclarations(ctx);
        } catch (error) {
          ctx.debug.hmr(`\u521B\u5EFA\u7C7B\u578B\u6587\u4EF6\u5931\u8D25`);
        }
        const { code, map } = await transformWithEsbuild(
          ctx.code,
          "",
          {
            loader: "tsx"
          }
        );
        return {
          code,
          map
        };
      }
    }
  };
}

export { model };
