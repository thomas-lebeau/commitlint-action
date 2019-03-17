const { Toolkit } = require('actions-toolkit');
const get = require('lodash.get');
const tools = new Toolkit();

const HEAD = 'HEAD';
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

function isPullRequest({ number } = tools.context.issue()) {
    return Number.isInteger(number);
}

async function lint(to = HEAD, from = HEAD, convention = DEFAULT_CONVENTION) {
    const args = [`-x ${convention}`, `--to ${to}`, `--from ${from}`];

    try {
        return await tools.runInWorkspace(COMMITLINT, args);
    } catch (err) {
        tools.log.fatal(err);
        tools.exit.failure(err.message);
    }
}

async function getCommits({ owner, repo, number } = tools.context.issue()) {
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
            tools.exit.failure(err.message);
        }
    } while (hasNextPage);

    return commits;
}

async function main() {
    let count = 1;
    // TO do fallback to current commit
    if (isPullRequest()) {
        const commits = await getCommits();
        const [to] = commits;
        const [from] = commits.reverse();
        count = commits.length;

        await lint(to.sha, from.sha);
    } else {
        await lint();
    }

    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

tools.log(tools.context.issue());
tools.log(tools.context.payload);
main();
