const { cwd } = Deno;
import { Buffer } from "@std/io/buffer";
import { copy } from "@std/io/copy";
import { assertEquals, assertRejects } from "@std/assert";
import { readAll } from "@std/io/read-all";
import * as dejs from "./mod.ts";
import { escape } from "@es-toolkit/es-toolkit";

const decoder = new TextDecoder("utf-8");

// renderTest
(() => {
  interface testCase {
    name: string;
    body: string;
    //deno-lint-ignore no-explicit-any
    param?: any;
    expected: string;
    error?: { new (): Error };
  }

  const testCases: Array<testCase> = [
    {
      name: "Normal",
      body: "normal test",
      expected: "normal test",
    },
    {
      name: "Escaped",
      body: "<%= param %>",
      param: "<div>test</div>",
      expected: escape("<div>test</div>"),
    },
    {
      name: "Raw",
      body: "<%- param %>",
      param: "<div>test</div>",
      expected: "<div>test</div>",
    },
    {
      name: "Comment",
      body: "<%# param %>",
      param: "<div>test</div>",
      expected: "",
    },
    {
      name: "Evaluate if true",
      body: "<% if (param) { %>test<% } %>",
      param: true,
      expected: "test",
    },
    {
      name: "Evaluate if false",
      body: "<% if (param) { %>test<% } %>",
      param: false,
      expected: "",
    },
    {
      name: "Evaluate for",
      body: "<% for (let i = 0; i < 3; i++) { %>Test<% } %>",
      expected: "TestTestTest",
    },
    {
      name: "Evaluate nested for",
      body:
        "<% for (let i = 0; i < 2; i++) { %><% for (let j = 0; j < 2; j++) { %>Test<% } %><% } %>",
      expected: "TestTestTestTest",
    },
    {
      name: "Evaluate if true",
      body: "<% if (param) { %>test<% } %>",
      param: true,
      expected: "test",
    },
    {
      name: "Escaped without spacing",
      body: "<%=param%>",
      param: "<div>test</div>",
      expected: escape("<div>test</div>"),
    },
    {
      name: "Raw without spacing",
      body: "<%-param%>",
      param: "<div>test</div>",
      expected: "<div>test</div>",
    },
    {
      name: "Comment without spacing",
      body: "<%#param%>",
      param: "<div>test</div>",
      expected: "",
    },
    {
      name: "Escaped with semi",
      body: "<%= param; %>",
      param: "<div>test</div>",
      expected: escape("<div>test</div>"),
    },
    {
      name: "Raw with semi",
      body: "<%- param; %>",
      param: "<div>test</div>",
      expected: "<div>test</div>",
    },
    {
      name: "Security: Includes JavaScript",
      body: "<%= param %>console.log(`${param}`)\\\\",
      param: "test",
      expected: "testconsole.log(`${param}`)", // Trims backslashes at line end.
    },
    {
      name: "Error: ReferenceError rejects promise instead of killing process",
      body: "<%= unknown %>",
      param: "",
      expected: "unknown is not defined",
      error: ReferenceError,
    },
  ];

  for (const tc of testCases) {
    Deno.test({
      name: tc.name,
      fn: async () => {
        const buf = new Buffer();
        if (tc.error) {
          assertRejects(
            async () => await dejs.render(tc.body, { param: tc.param }),
            tc.error,
            tc.expected,
          );
          return;
        }
        await copy(await dejs.render(tc.body, { param: tc.param }), buf);
        const actual = decoder.decode(await readAll(buf));
        assertEquals(actual, tc.expected);
      },
    });
  }
})();

// renderFileTest
(() => {
  interface testCase {
    name: string;
    fileName: string;
    //deno-lint-ignore no-explicit-any
    param?: any;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      name: "Normal",
      fileName: "normal",
      expected: "normal test",
    },
    {
      name: "Raw",
      fileName: "raw",
      param: "<div>test</div>",
      expected: "<div>test</div>",
    },
    {
      name: "Raw Include",
      fileName: "raw-include",
      param: "<div>test</div>",
      expected: "<div>test</div>",
    },
    {
      name: "Escaped Include",
      fileName: "escaped-include",
      param: "<div>test</div>",
      expected: escape("<div>test</div>"),
    },
  ];

  for (const tc of testCases) {
    Deno.test({
      name: tc.name,
      fn: async () => {
        const buf = new Buffer();
        await copy(
          await dejs.renderFile(`${cwd()}/testdata/${tc.fileName}.ejs`, {
            param: tc.param,
          }),
          buf,
        );
        const actual = decoder.decode(await readAll(buf));
        assertEquals(actual, tc.expected);
      },
    });
  }
})();

Deno.test({
  name: "override include",
  fn: async () => {
    const buf = new Buffer();
    const overriddenInclude = () => "overridden";
    await copy(
      await dejs.renderFile(`${cwd()}/testdata/raw-include.ejs`, {
        param: {},
        include: overriddenInclude,
      }),
      buf,
    );
    const actual = decoder.decode(await readAll(buf));
    const expected = "overridden";
    assertEquals(actual, expected);
  },
});
