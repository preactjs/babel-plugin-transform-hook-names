import { expect } from "chai";

import { transformAsync } from "@babel/core";

import plugin from "../src";

describe("transform", () => {
	it("should transform preact code", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  const [text, setText] = useState('hello');
  const [counter, increment] = useReducer(c => c + 1, 0);
  const rootElement = useRef();
  const memo = useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to
			.equal(`import { addHookName } from "preact/devtools";
import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  const [text, setText] = addHookName(useState('hello'), "text");
  const [counter, increment] = addHookName(useReducer(c => c + 1, 0), "counter");
  const rootElement = addHookName(useRef(), "rootElement");
  const memo = addHookName(useMemo(() => text.toUpperCase(), ['text']), "memo");
}`);
	});

	it("should transform with react import", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef, useMemo } from 'react';

function Foo() {
  const [text, setText] = useState('hello');
  const [counter, increment] = useReducer(c => c + 1, 0);
  const rootElement = useRef();
  const memo = useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to
			.equal(`import { addHookName } from "preact/devtools";
import { useState, useReducer, useRef, useMemo } from 'react';

function Foo() {
  const [text, setText] = addHookName(useState('hello'), "text");
  const [counter, increment] = addHookName(useReducer(c => c + 1, 0), "counter");
  const rootElement = addHookName(useRef(), "rootElement");
  const memo = addHookName(useMemo(() => text.toUpperCase(), ['text']), "memo");
}`);
	});

	it("should transform with compat import", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef, useMemo } from 'preact/compat';

function Foo() {
  const [text, setText] = useState('hello');
  const [counter, increment] = useReducer(c => c + 1, 0);
  const rootElement = useRef();
  const memo = useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to
			.equal(`import { addHookName } from "preact/devtools";
import { useState, useReducer, useRef, useMemo } from 'preact/compat';

function Foo() {
  const [text, setText] = addHookName(useState('hello'), "text");
  const [counter, increment] = addHookName(useReducer(c => c + 1, 0), "counter");
  const rootElement = addHookName(useRef(), "rootElement");
  const memo = addHookName(useMemo(() => text.toUpperCase(), ['text']), "memo");
}`);
	});

	it("should only transform when hooks are present", async () => {
		const output = await transformAsync(
			`function Foo() {
  const [text, setText] = State('hello');
  const [counter, increment] = Reducer(c => c + 1, 0);
  const rootElement = Ref();
  const memo = useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to.equal(`function Foo() {
  const [text, setText] = State('hello');
  const [counter, increment] = Reducer(c => c + 1, 0);
  const rootElement = Ref();
  const memo = useMemo(() => text.toUpperCase(), ['text']);
}`);
	});

	it("should not throw if not destructured", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  const foo = useState('hello');
  const bar = useReducer(c => c + 1, 0);
  const bob = useRef();
  const baz = useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to
			.equal(`import { addHookName } from "preact/devtools";
import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  const foo = addHookName(useState('hello'), "foo");
  const bar = addHookName(useReducer(c => c + 1, 0), "bar");
  const bob = addHookName(useRef(), "bob");
  const baz = addHookName(useMemo(() => text.toUpperCase(), ['text']), "baz");
}`);
	});

	it("should not throw if not used", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  useState('hello');
  useReducer(c => c + 1, 0);
  useRef();
  useMemo(() => text.toUpperCase(), ['text']);
}
		`,
			{ plugins: [plugin] },
		);

		expect(output!.code).to
			.equal(`import { useState, useReducer, useRef, useMemo } from 'preact/hooks';

function Foo() {
  useState('hello');
  useReducer(c => c + 1, 0);
  useRef();
  useMemo(() => text.toUpperCase(), ['text']);
}`);
	});

	it("should let other plugins traverse wrapped hook", async () => {
		const output = await transformAsync(
			`import { useState, useReducer, useRef } from 'preact/hooks';

function Foo() {
  const date = useState<number>(Date.now());
}
		`,
			{
				filename: "foo.tsx",
				plugins: [plugin],
				presets: [require.resolve("@babel/preset-typescript")],
			},
		);

		expect(output!.code).to
			.equal(`import { addHookName } from "preact/devtools";
import { useState } from 'preact/hooks';

function Foo() {
  const date = addHookName(useState(Date.now()), "date");
}`);
	});
});
