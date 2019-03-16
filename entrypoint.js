const { Toolkit } = require('actions-toolkit');

const tools = new Toolkit();

async function lint(to, from, convention = '@commitlint/config-conventional') {
    const CMD = 'commitlint'
    const ARGS = ['-e', `-x ${convention}`]

    if (to) ARGS.push(`--to ${to}`);
    if (from) ARGS.push(`--from ${from}`);

    return tools.runInWorkspace(CMD, ARGS);
}

async function main() {
    const {after: from, before: to} = tools.context.payload;

    tools.log('Lint commits:');
    tools.log(`  - To: ${to}`);
    tools.log(`  - From: ${from}`);

    const linted = await lint(to, from);
}

main()
    .then(tools.exit.success)
    .catch(tools.log.fatal)
    .then(tools.exit.failure)
