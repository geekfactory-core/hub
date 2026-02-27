import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import license from 'rollup-plugin-license';
import {defineConfig} from 'vite';
import checker from 'vite-plugin-checker';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

const localReplicaPort = 8080;
const basePathToRoot = './..';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = `${basePathToRoot}/release/frontend`;

export default defineConfig(({mode}) => {
    const isDev = mode === 'development';
    const isTest = mode === 'test';
    const isProd = mode === 'production';
    const projectRootFolderPath = path.resolve(__dirname, basePathToRoot);

    const tsconfigPath = isProd ? 'tsconfig.production.json' : isTest ? 'tsconfig.test.json' : 'tsconfig.dev.json';
    return {
        logLevel: 'info',
        build: {
            target: 'es2020',
            outDir,
            emptyOutDir: true,
            sourcemap: false,
            assetsInlineLimit: 1024 * 4,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    }
                },
                plugins: [
                    license({
                        thirdParty: {
                            includePrivate: false,
                            output: path.join(outDir, `licenses.txt`)
                        }
                    })
                ]
            }
        },
        esbuild: {
            minify: !isDev,
            legalComments: 'none',
            drop: isDev ? [] : ['debugger']
        },
        envDir: `${basePathToRoot}`,
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis'
                }
            }
        },
        server: isDev
            ? {
                  proxy: {
                      '/api': {
                          target: `http://127.0.0.1:${localReplicaPort}`,
                          changeOrigin: true
                      },
                      '/get_canister_id': {
                          target: `http://127.0.0.1:${localReplicaPort}`,
                          changeOrigin: true
                      }
                  }
              }
            : undefined,
        plugins: [react(), nodePolyfills(), checker({typescript: {tsconfigPath}})],
        resolve: {
            alias: [
                {
                    find: `frontend`,
                    replacement: path.resolve(projectRootFolderPath, `frontend`)
                },
                {
                    find: 'src/declarations',
                    replacement: path.resolve(`${basePathToRoot}/src/declarations`)
                }
            ]
        }
    };
});
