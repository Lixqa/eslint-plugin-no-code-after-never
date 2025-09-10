import { TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'unreachableCode';

const rule: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unreachable code after functions that return never (TypeScript type-based detection only)',
    },
    schema: [],
    messages: {
      unreachableCode:
        'Unreachable code after function that returns never: {{ functionName }}',
    },
  },
  defaultOptions: [],
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.program || !services.esTreeNodeToTSNodeMap) {
      return {};
    }

    const checker = services.program.getTypeChecker();

    function getFunctionName(node: TSESTree.CallExpression): string {
      if (node.callee.type === 'Identifier') return node.callee.name;
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier'
      ) {
        return node.callee.property.name;
      }
      return 'unknown function';
    }

    function isNeverFunction(node: TSESTree.Expression): boolean {
      if (node.type !== 'CallExpression') return false;
      try {
        const tsNode = services!.esTreeNodeToTSNodeMap!.get(node);
        const signature = checker.getResolvedSignature(tsNode);
        if (!signature) return false;
        const returnType = checker.getReturnTypeOfSignature(signature);
        return checker.typeToString(returnType) === 'never';
      } catch {
        return false;
      }
    }

    function checkForUnreachableCode(
      statements: TSESTree.Statement[],
      startIndex: number,
      functionName: string,
    ) {
      for (let i = startIndex; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.type === 'EmptyStatement') continue;
        context.report({
          node: stmt,
          messageId: 'unreachableCode',
          data: { functionName },
        });
      }
    }

    function analyzeBlock(statements: TSESTree.Statement[]) {
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        // Expression statements
        if (
          stmt.type === 'ExpressionStatement' &&
          isNeverFunction(stmt.expression)
        ) {
          const fnName = getFunctionName(
            stmt.expression as TSESTree.CallExpression,
          );
          checkForUnreachableCode(statements, i + 1, fnName);
          break;
        }

        // Return statements
        if (
          stmt.type === 'ReturnStatement' &&
          stmt.argument &&
          isNeverFunction(stmt.argument)
        ) {
          const fnName = getFunctionName(
            stmt.argument as TSESTree.CallExpression,
          );
          checkForUnreachableCode(statements, i + 1, fnName);
          break;
        }

        // Throw
        if (stmt.type === 'ThrowStatement') {
          checkForUnreachableCode(statements, i + 1, 'throw');
          break;
        }

        // Recursion into nested constructs
        if (stmt.type === 'BlockStatement') analyzeBlock(stmt.body);
        if (stmt.type === 'IfStatement') {
          if (stmt.consequent.type === 'BlockStatement')
            analyzeBlock(stmt.consequent.body);
          if (stmt.alternate && stmt.alternate.type === 'BlockStatement')
            analyzeBlock(stmt.alternate.body);
        }
        if (stmt.type === 'TryStatement') {
          if (stmt.block) analyzeBlock(stmt.block.body);
          if (stmt.handler) analyzeBlock(stmt.handler.body.body);
          if (stmt.finalizer) analyzeBlock(stmt.finalizer.body);
        }
        if (stmt.type === 'SwitchStatement') {
          stmt.cases.forEach((c) => analyzeBlock(c.consequent));
        }
        if (
          stmt.type === 'WhileStatement' ||
          stmt.type === 'ForStatement' ||
          stmt.type === 'ForInStatement' ||
          stmt.type === 'ForOfStatement'
        ) {
          if (stmt.body.type === 'BlockStatement') analyzeBlock(stmt.body.body);
        }
      }
    }

    return {
      BlockStatement(node: TSESTree.BlockStatement) {
        analyzeBlock(node.body);
      },
      Program(node: TSESTree.Program) {
        analyzeBlock(node.body);
      },
    };
  },
};

export default rule;
