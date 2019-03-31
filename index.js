const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();
const load = require('@commitlint/load');
const read = require('@commitlint/read');
const lint = require('@commitlint/lint');
const format = require('@commitlint/format');

const HEAD = 'HEAD';
const BASE_BRANCH = 'master';
const DEFAULT_CONVENTION = '@commitlint/config-conventional';

async function _lint(from = 'HEAD~1', to = 'HEAD') {
    const { rules } = await load({ extends: [DEFAULT_CONVENTION] });
    const messages = await read({ from, to });
    const results = [];

    for await (const message of messages) {
        const report = await lint(message, rules);

        results.push(report);
    }

    return results;
}

async function getCommitsFromGitLog() {
    try {
        const args = ['log', `${BASE_BRANCH}..${HEAD}`, '--format=%H'];
        const result = await tools.runInWorkspace('git', args);
        const commits = result.stdout || '';

        return commits
            .split('\n')
            .map(commit => commit.trim())
            .filter(Boolean);
    } catch (err) {
        tools.log.fatal(err);
    }
}

async function getCommitsFromPushEvent() {
    const { commits = [] } = tools.context.payload;

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
    const commits = await getCommits();
    let results;

    if (commits.length) {
        const [to] = commits;
        const [from] = commits.reverse();

        results = await _lint(from, to);
    } else {
        results = await _lint();
    }

    const count = results.length;
    const hasErrors = results.some(({ valid }) => !valid);

    if (hasErrors) {
        const report = format({ results });

        tools.exit.failure(report);
    }

    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

main();
