const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit({ event: 'pull_requests' });

const GIT = 'git';
const ARGS = ['rev-list', '--simplify-by-decoration', '-2', 'HEAD'];

const commits = tools.runInWorkspace(GIT, ...ARGS);
const [to] = commits;
const [from] = commits.reverse();

tools.log('Lint commits:');
tools.log(`  - To: ${to}`);
tools.log(`  - From: ${from}`);
