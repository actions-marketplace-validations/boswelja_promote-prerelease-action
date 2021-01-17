import { setOutput, setFailed, info, debug, warn, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';

export async function run() {
  try {
    const token = getInput('repo-token', { required: true });
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = getOctokit(token);

    debug(`${context.repo.owner}/${context.repo.repo}`);

    // Get the latest release
    info('Getting latest release');
    const latestReleaseResult = await octokit.repos.listReleases({
      ...context.repo,
      per_page: 1,
      page: 1
    })
    debug(`Latest release:\n${JSON.stringify(latestReleaseResult)}`)
    const { name: releaseName, id: releaseId, isPrerelease: isPrerelease } = latestReleaseResult.repository.releases.nodes[0];

    // If the latest release is null (i.e. there are no releases), fail the action.
    if (!releaseId) {
      setFailed('No releases found');
      return;
    }
    // If the latest release is not a prerelease, warn the user and skip the run.
    if (!isPrerelease) {
      warn('Latest release is not a prerelease, skipping.');
      return;
    }


    info(`Promoting ${releaseName} to production`);
    const { data: result } = await octokit.repos.updateRelease({
      ...context.repo,
      release_id: releaseId,
      prerelease: false
    });

    if (!result) {
      setFailed('Failed to update the latest release');
      return;
    }
    debug(`Updated release:\n${JSON.stringify(result)}`);

    setOutput('releaseId', releaseId);
  } catch (error) {
    setFailed(error);
    return;
  }
}
