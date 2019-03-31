const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();

const HEAD = 'HEAD';
const BASE_BRANCH = 'master';
const DEFAULT_CONVENTION = '@commitlint/config-conventional';

async function lint(to = HEAD, from = HEAD, convention = DEFAULT_CONVENTION) {
    const args = [`-x ${convention}`, `--to ${to}`, `--from ${from}`];

    try {
        return await tools.runInWorkspace('commitlint', args);
    } catch (err) {
        tools.log.fatal(err);
        tools.exit.failure(err.message);
    }
}

async function getCommitsFromGitLog() {
    const args = ['log', `${BASE_BRANCH}..${HEAD}`, '--format=%H'];
    let commits = [];

    try {
        commits = await tools.runInWorkspace('git', args);
    } catch (err) {
        tools.log.fatal(err);
    }

    return commits
        .split('\n')
        .map(commit => commit.trim())
        .filter(Boolean);
}

async function getCommitsFromPushEvent() {
    const { commits } = tools.context.payload;

    return commits.filter(Boolean).map(commit => commit.sha);
}

async function getCommits() {
    let commits = getCommitsFromGitLog();

    if (!commits.length) {
        commits = getCommitsFromPushEvent();
    }

    return commits;
}

async function main() {
    let count = 0;

    const commits = await getCommits();
    if (commits.length) {
        const [to] = commits;
        const [from] = commits.reverse();
        count = commits.length;

        await lint(to, from);
    } else {
        count = 1;

        await lint();
    }

    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

main();
