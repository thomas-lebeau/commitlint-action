const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();
const load = require('@commitlint/load');
const read = require('@commitlint/read');
const _lint = require('@commitlint/lint');
const format = require('@commitlint/format');

const HEAD = 'HEAD';
const BASE_BRANCH = 'master';
const DEFAULT_CONVENTION = '@commitlint/config-conventional';

async function lint(range, { rules }) {
    const messages = await read(range);
    const results = [];

    for await (const message of messages) {
        const report = await _lint(message, rules);

        results.push(report);
    }

    return results;
}

async function getCommitsFromGitLog() {
    try {
        const result = await tools.runInWorkspace('git', [
            'log',
            `${BASE_BRANCH}..${HEAD}`,
            '--format=%H',
        ]);
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
    let commits = await getCommitsFromGitLog();

    if (!commits.length) {
        commits = getCommitsFromPushEvent();
    }

    const lastSha = commits[commits.length - 1];
    const { stdout } = await tools.runInWorkspace('git', [
        'log',
        '--format=%P',
        lastSha,
    ]);
    const [parentSha] = stdout.split('\n');

    commits.push(parentSha);

    return commits;
}

async function main() {
    const commits = await getCommits();

    let results;

    if (!commits.length) {
        tools.exit.failure('No commit found, abord.');
    }

    const [to] = commits;
    const [from] = commits.reverse();
    const config = await load({ extends: [DEFAULT_CONVENTION] });

    results = await lint({ from, to }, config);

    const count = results.length;
    const hasErrors = results.some(({ valid }) => !valid);

    if (hasErrors) {
        const report = format({ results });

        tools.exit.failure(report);
    }

    tools.exit.success(`Linted ${count} commit${count > 1 ? 's' : ''}`);
}

main();
