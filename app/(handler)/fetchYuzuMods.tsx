import { FileEntry } from '@tauri-apps/api/fs'
import * as yaml from 'yaml'
import { LocalMod } from '@/app/types'
import { ModContext, useModContext } from '@/app/yuzu/modContext'

export default async function fetchYuzuMods(
    yuzuDir: string
): Promise<LocalMod[]> {
    const { fs, path } = await import('@tauri-apps/api')
    try {
        const yuzuModDir = await path.resolve(
            yuzuDir,
            'load',
            '0100F2C0115B6000'
        )
        await fs.exists(yuzuModDir)
        const localMods = await fs.readDir(yuzuModDir, {
            dir: path.BaseDirectory.Data,
            recursive: true,
        })
        let promises: Promise<FileEntry | undefined>[] = []
        for (const localMod of localMods) {
            promises.push(
                (async (): Promise<
                    ({ config?: {} } & FileEntry) | undefined
                > => {
                    const configPath = await path.resolve(
                        localMod.path,
                        'config.yaml'
                    )
                    const exists = await fs.exists(configPath)
                    if (exists) {
                        return {
                            ...localMod,
                            config: yaml.parse(
                                await fs.readTextFile(configPath)
                            ),
                        }
                    } else {
                        return { ...localMod }
                    }
                })()
            )
        }
        // @ts-ignore
        return (await Promise.all(promises)).filter((mod) => mod !== undefined)
    } catch (e) {
        console.error(e)
        throw new Error('Could not fetch local mods')
    }
}
