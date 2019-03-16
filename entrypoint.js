const { Toolkit } = require('actions-toolkit');

const tools = new Toolkit();

async function lint(to, from, convention = '@commitlint/config-conventional') {
    const CMD = 'commitlint'
    const ARGS = [`-x ${convention}`]

    if (to) ARGS.push(`--to ${to}`);
    if (from) ARGS.push(`--from ${from}`);
    if (!to && !from) ARGS.push('-e');

    return tools.runInWorkspace(CMD, ARGS);
}

async function main() {
    const {after: to, before: from} = tools.context.payload;

    tools.log('Lint commits:');
    tools.log(`  - To: ${to}`);
    tools.log(`  - From: ${from}`);

    const linted = await lint(to, from);
}

main()
    .catch(tools.log.fatal)
    .then(tools.exit.failure)
