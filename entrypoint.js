const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();

const GIT = 'git';
const GIT_ARGS = ['rev-list', '--simplify-by-decoration', '-2 HEAD'];
const COMMITLINT = 'commitling'
const COMMITLINT_ARGS = ['-e', '-x @commitlint/config-conventional']

const commits = tools.runInWorkspace(GIT, ...ARGS);
const [to] = commits;
const [from] = commits.reverse();

tools.log('Lint commits:');
tools.log(`  - To: ${to}`);
tools.log(`  - From: ${from}`);

tools.runInWorkspace(COMMIT_LINT, [...COMMITLINT_ARGS, `--from ${from}`, `--to ${to}`]);

tools.log('Done!');
