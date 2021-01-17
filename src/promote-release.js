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
    const latestReleaseResult = await octokit.graphql(
      `query($owner: String!, $repo: String!){
        repository(owner: $owner, name: $repo) {
          releases(last: 1) {
            nodes {
              id
              isPrerelease
              name
            }
          }
        }
      }`,
      {
        ...context.repo
      }
    )
    const { name: releaseName, id: releaseId, isPrerelease: isPrerelease } = latestReleaseResult.data.releases.nodes[0];
    debug(`Latest release:\n${releaseName}`)

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
