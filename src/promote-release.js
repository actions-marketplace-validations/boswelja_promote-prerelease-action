import { setOutput, setFailed, info, debug, warn } from '@actions/core';
import { GitHub, context } from '@actions/github';

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);
  
    // Get owner and repo from context of payload that triggered the action
    const { owner: currentOwner, repo: currentRepo } = context.repo;

    // Get the latest release
    info('Getting latest release');
    const latestRelease = await github.repos.getlatestRelease({
      currentOwner,
      currentRepo
    });
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

    const result = await github.repos.updateRelease({
      currentOwner,
      currentRepo,
      releaseId,
      prerelease: false
    });

    if (!result) {
      setFailed('Failed to update the latest release');
      return;
    }

    setOutput('releaseId', releaseId);
  } catch (error) {
    setFailed(error);
    return;
  }
}

module.exports = run;
