import { setOutput, setFailed, info, debug, warn, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';

export async function run() {
  try {
    const token = getInput('repo-token', { required: true });
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = getOctokit({ auth: token });

    debug(`${context.repo.owner}/${context.repo.repo}`);

    // Get the latest release
    info('Getting latest release');
    const { data: latestRelease } = await octokit.repos.getLatestRelease({
      ...context.repo
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
