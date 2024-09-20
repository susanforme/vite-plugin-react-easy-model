/*
 * @Author: 冉志诚
 * @Date: 2024-08-07 14:43:56
 * @LastEditTime: 2024-08-07 16:33:24
 * @FilePath: \vite-plugin-react-easy-model\packages\model\src\type.ts
 * @Description:
 */
export type UserOptions = {
  /**
   * Paths to the directory to search for model
   * @default 'src/pages' 'src/models'
   */
  dirs?: string[];
  // /**
  //  *  Ignore paths from the directory to generate for model
  //  */
  // rootPathToIgnore?: string;
};

export interface ResolvedOptions
  extends Required<UserOptions> {
  /**
   * Resolves to the `root` value from Vite config.
   * @default config.root
   */
  root: string;
}
