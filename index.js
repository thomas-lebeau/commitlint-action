const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();

const DEFAULT_CONVENTION = '@commitlint/config-conventional';
const COMMITLINT = 'commitlint';
const GET_PR_COMMITS = /* GraphQL */ `
    query prCommits(
        $owner: String!
        $repo: String!
        $number: Int!
        $cursor: String
        $pageSize: Int = 1
    ) {
        repository(owner: $owner, name: $repo) {
            name
            pullRequest(number: $number) {
                id
                commits(first: $pageSize, after: $cursor) {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    nodes {
                        commit {
                            message
                            oid
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
            const a = await tools.github.graphql(GET_PR_COMMITS, {
                owner,
                repo,
                number,
                cursor,
            });

            tools.log(a);
        } catch (err) {
            tools.log.fatal(err);
            hasNextPage = false;
        }
    } while (hasNextPage);

    return commits;
}

async function main() {
    let to, from;

    // const context = tools.context.issue();
    const context = {
        owner: 'vadimdemedes',
        repo: 'ink-text-input',
        number: 22,
    };
    const commits = await getCommits(context);
    tools.log(commits);

    // tools.log('Lint commits:');
    // tools.log(`  - To: ${to}`);
    // tools.log(`  - From: ${from}`);

    try {
        const linted = await lint(to, from);
    } catch (err) {
        tools.log.fatal(err);
        tools.exit.failure(err.message);
    }

    const count = 2;
    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

main();
