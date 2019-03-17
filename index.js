const { Toolkit } = require('actions-toolkit');
const get = require('lodash.get');
const tools = new Toolkit();

const DEFAULT_CONVENTION = '@commitlint/config-conventional';
const COMMITLINT = 'commitlint';
const COMMITS_PAGE_PATH = 'repository.pullRequest.commits.pageInfo';
const COMMITS_PATH = 'repository.pullRequest.commits.nodes';
const GET_PR_COMMITS = /* GraphQL */ `
    query(
        $owner: String!
        $repo: String!
        $number: Int!
        $cursor: String
        $pageSize: Int = 2
    ) {
        repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
                commits(first: $pageSize, after: $cursor) {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    nodes {
                        commit {
                            message
                            sha: oid
                            shortSha: abbreviatedOid
                        }
                    }
                }
            }
        }
    }
`;

async function lint(to, from, convention = DEFAULT_CONVENTION) {
    if (!to || !from) {
        throw new Error('No commit found');
    }

    const args = [`-x ${convention}`];

    if (to) args.push(`--to ${to}`);
    if (from) args.push(`--from ${from}`);

    return tools.runInWorkspace(COMMITLINT, args);
}

async function getCommits({ owner, repo, number }) {
    const commits = [];
    let hasNextPage = false;
    let cursor = '';

    do {
        try {
            const response = await tools.github.graphql(GET_PR_COMMITS, {
                owner,
                repo,
                number,
                cursor,
            });

            const pageInfo = get(response, COMMITS_PAGE_PATH);
            const nodes = get(response, COMMITS_PATH);

            cursor = pageInfo.endCursor;
            hasNextPage = pageInfo.hasNextPage;
            commits.push(...nodes.map(c => c.commit).filter(Boolean));
        } catch (err) {
            tools.log.fatal(err);
            hasNextPage = false;
        }
    } while (hasNextPage);

    return commits;
}

async function main() {
    const context = tools.context.issue();
    const commits = await getCommits(context);
    const [to] = commits;
    const [from] = commits.reverse();

    tools.log('Lint commits:');
    tools.log(`  - To: ${to.shortSha} - ${to.message}`);
    tools.log(`  - From: ${from.shortSha} - ${from.message}`);

    try {
        const linted = await lint(to.sha, from.sha);
    } catch (err) {
        tools.log.fatal(err);
        tools.exit.failure(err.message);
    }

    const count = 2;
    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

main();
