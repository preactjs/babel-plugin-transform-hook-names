module.exports = function ({ types: t, template }) {
	const libs = ["preact/hooks", "preact/compat", "react"];
	const helper = template`addHookName(CALL, NAME)`;

	return {
		name: "transform-hook-names",
		visitor: {
			Program: {
				exit(path, state) {
					if (!state.helper) return;
					path.unshiftContainer(
						"body",
						template.ast`import { addHookName } from "preact/devtools";`,
					);
				},
			},
			CallExpression(path, state) {
				const callee = path.get("callee");

				if (!callee.isIdentifier()) return;
				if (!/^(useState|useReducer|useRef|useMemo)$/.test(callee.node.name))
					return;
				if (!libs.some(lib => callee.referencesImport(lib))) return;

				const p = path.parentPath.getOuterBindingIdentifierPaths();
				const pathKeys = Object.keys(p);
				if (!pathKeys.length) return;
				const firstBinding = p[pathKeys[0]];

				state.helper = true;
				path.replaceWith(
					helper({
						CALL: t.clone(path.node),
						NAME: t.stringLiteral(firstBinding.getSource()),
					}),
				);
			},
		},
	};
};
