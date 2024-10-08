import { Plugin } from 'vite';

type UserOptions = {
    /**
     * Paths to the directory to search for model
     * @default 'src/pages' 'src/models'
     */
    dirs?: string[];
};

declare function model(options?: UserOptions): Promise<Plugin>;

export { model };
