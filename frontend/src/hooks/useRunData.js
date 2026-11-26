import { datasetsApi, promptsApi, testRunsApi, versionsApi } from '../services/endpoints'
import { useAsync } from './useAsync'

// Loads runs plus the lookups needed to label them (prompt, dataset and version numbers).
export function useRunData() {
  return useAsync(async () => {
    const [runs, prompts, datasets] = await Promise.all([testRunsApi.list(), promptsApi.list(), datasetsApi.list()])
    const promptIds = [...new Set(runs.map((run) => run.prompt_id))]
    const versionLists = await Promise.all(promptIds.map((id) => versionsApi.list(id).catch(() => [])))
    const versionNo = {}
    versionLists.flat().forEach((version) => { versionNo[version.id] = version.version_number })
    return {
      runs,
      prompts,
      datasets,
      versionNo,
      promptName: Object.fromEntries(prompts.map((p) => [p.id, p.name])),
      datasetName: Object.fromEntries(datasets.map((d) => [d.id, d.name])),
    }
  }, [])
}
