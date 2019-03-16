const { Toolkit } = require('actions-toolkit');

const tools = new Toolkit();

async function lint(to, from, convention = '@commitlint/config-conventional') {
    const CMD = 'commitlint'
    const ARGS = [`-x ${convention}`]

    if (to) ARGS.push(`--to ${to}`);
    if (from) ARGS.push(`--from ${from}`);

    return tools.runInWorkspace(CMD, ARGS);
}

async function main() {
    const {after: to, before: from} = {after: '73b82b0840b9a8744910f11037e86cd705a8f49c', before: '10300c5d2882b826675fa89c3c26dd8e8234a126'}
    if (!to || !from) {
        tools.log.error('No commit found')
        tools.exit.failure();
    }

    tools.log('Lint commits:');
    tools.log(`  - To: ${to}`);
    tools.log(`  - From: ${from}`);

    try {
        const linted = await lint(to, from);
    } catch (err) {
        tools.log.fatal(err)
        tools.exit.failure()
    }

    tools.log(linted)
    tools.exit.success(linted)
}

main()
