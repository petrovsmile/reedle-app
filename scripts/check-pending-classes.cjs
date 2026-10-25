const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
function changedSourceFiles() {
  const paths = ['app', 'scripts', 'index.web.js', 'webpack.config.js'];
  const changed = execFileSync(
    'git',
    ['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '--', ...paths],
    {
      encoding: 'utf8',
    },
  );
  const added = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '--', ...paths],
    {
      encoding: 'utf8',
    },
  );
  return [...new Set((changed + '\n' + added).split('\n'))].filter(
    file => /\.(js|cjs)$/.test(file) && fs.existsSync(file),
  );
}
function countClasses(node) {
  if (!node || typeof node !== 'object') return 0;
  let count = ['ClassDeclaration', 'ClassExpression'].includes(node.type)
    ? 1
    : 0;
  for (const value of Object.values(node)) {
    if (Array.isArray(value))
      count += value.reduce((sum, child) => sum + countClasses(child), 0);
    else if (value && typeof value === 'object') count += countClasses(value);
  }
  return count;
}
function checkLocalVariableNames(ast, file) {
  const refactored_files = [
    'app/services/notifications/user_device_registration.js',
    'app/services/notifications/push_notification_service.js',
    'app/services/notifications/web_push_messaging_client.js',
    'app/screens/profile/notifications.js',
    'app/screens/profile/profile_details.js',
    'app/screens/profile/profile_memory.js',
    'app/screens/profile/profile_password.js',
  ];
  if (!refactored_files.includes(file)) return;
  traverse(ast, {
    Scopable(scope_path) {
      for (const binding of Object.values(scope_path.scope.bindings)) {
        if (binding.scope.block.type === 'Program') continue;
        if (binding.path.isClassDeclaration() || binding.path.isClassExpression() || binding.path.isFunctionDeclaration()) continue;
        assert(
          !/[A-Z]/.test(binding.identifier.name),
          `${file}: local variable ${binding.identifier.name} must use snake_case`,
        );
      }
    },
  });
}

const files = changedSourceFiles();
for (const file of files) {
  const ast = parser.parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'flow'],
  });
  checkLocalVariableNames(ast, file);
  assert(
    countClasses(ast.program) <= 1,
    `${file}: only one class is allowed per source file`,
  );
}
const generated_app = parser.parse(fs.readFileSync('App.js', 'utf8'), {
  sourceType: 'module', plugins: ['jsx', 'flow'],
});
traverse(generated_app, {
  NewExpression(constructor_path) {
    if (constructor_path.getFunctionParent()) return;
    const constructor = constructor_path.node.callee;
    if (constructor.type !== 'Identifier') return;
    const binding = constructor_path.scope.getBinding(constructor.name);
    if (!binding || binding.kind === 'module') return;
    assert(
      binding.path.node.start < constructor_path.node.start,
      `${constructor.name} must be declared before its first instance is created`,
    );
  },
  JSXOpeningElement(component_path) {
    const name = component_path.node.name;
    if (name.type === 'JSXIdentifier' && /^[A-Z]/.test(name.name)) {
      assert(component_path.scope.hasBinding(name.name), `Unresolved component: ${name.name}`);
    }
  },
});

console.log(
  `PASS: syntax, variable naming and one-class-per-file rule for ${files.length} changed source files`,
);
