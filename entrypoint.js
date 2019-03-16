const { Toolkit } = require('actions-toolkit');
const tools = new Toolkit();

async function lint(to, from, convention = '@commitlint/config-conventional') {
  return tools.runInWorkspace(
    'commitlint',
    ['-e', `-x ${convention}` , `--from ${from}`, `--to ${to}`]
  );
}

async function main() {
  const {after: to, before: from} = tools.context.payload;

  tools.log('Lint commits:');
  tools.log(`  - To: ${to}`);
  tools.log(`  - From: ${from}`);

  const linted = await lint(to, from);
  tools.log(`linted`);
}

main();
