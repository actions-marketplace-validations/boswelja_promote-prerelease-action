import { setOutput, setFailed, info, debug, warn, error } from '@actions/core';
import { getOctokit, context } from '@actions/github';

export async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      setFailed('Pasing GITHUB_TOKEN env is required');
      return;
    }
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = getOctokit(process.env.GITHUB_TOKEN);
  
    // Get the latest release
    info('Getting latest release');
    const { data: latestRelease } = await octokit.repos.getLatestRelease({
      ...context.repo
    }).catch((error) => {
      error('Failed to get latest release info');
      setFailed(error);
      return;
    });
    debug(`Latest release:\n${latestRelease.toString()}`)

    // If the latest release is null (i.e. there are no releases), fail the action.
    if (!latestRelease) {
      setFailed('No releases found');
      return;
    }
    // If the latest release is not a prerelease, warn the user and skip the run.
    if (!latestRelease.prerelease) {
      warn('Latest release is not a prerelease, skipping.');
      return;
    }

    const { id: releaseId } = latestRelease;

    info("Promoting latest release to production");
    const { data: result } = await octokit.repos.updateRelease({
      ...context.repo,
      release_id: releaseId,
      prerelease: false
    });

    if (!result) {
      setFailed('Failed to update the latest release');
      return;
    }
    debug(`Updated release:\n${result.toString()}`);

    setOutput('releaseId', releaseId);
  } catch (error) {
    setFailed(error);
    return;
  }
}
