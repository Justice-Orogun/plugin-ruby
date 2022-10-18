import { atLeastVersion, long, ruby } from "../../utils.js";

describe("method", () => {
  describe("definitions", () => {
    test("shorthand for empty methods", () => {
      expect("def foo; end").toChangeFormat("def foo\nend");
    });

    test("shorthand for empty methods with parens", () => {
      expect("def foo(); end").toChangeFormat("def foo()\nend");
    });

    test("single arg, no parens", () => {
      expect("def foo bar\nend").toChangeFormat("def foo(bar)\nend");
    });

    test("single arg, with parens", () => {
      expect("def foo(bar)\nend").toMatchFormat();
    });

    test("shorthand for empty singleton methods", () => {
      expect("def self.foo; end").toChangeFormat("def self.foo\nend");
    });

    test("shorthand for empty singleton methods with parens", () => {
      expect("def self.foo(); end").toChangeFormat("def self.foo()\nend");
    });

    test("singleton, single arg, no parens", () => {
      expect("def self.foo bar\nend").toChangeFormat("def self.foo(bar)\nend");
    });

    test("singleton, single arg, with parens", () => {
      expect("def self.foo(bar)\nend").toMatchFormat();
    });

    test("shorthand with a body", () => {
      expect("def foo(alpha); 1; end").toChangeFormat(
        "def foo(alpha)\n  1\nend"
      );
    });

    test("single splat arg with no name", () => {
      expect("def foo(*); end").toChangeFormat("def foo(*)\nend");
    });

    test("double splat arg with no name", () => {
      expect("def foo(**); end").toChangeFormat("def foo(**)\nend");
    });

    test("with helper method", () => {
      const content = ruby(`
        private def foo
          "bar"
        end
      `);

      expect(content).toMatchFormat();
    });

    test("with helper method on defs", () => {
      const content = ruby(`
        private def self.foo
          "bar"
        end
      `);

      expect(content).toMatchFormat();
    });

    test("every single arg type", () => {
      const content = ruby(`
        def method(req, *rest, post, kwarg:, kwarg_opt: 1, **kwarg_rest, &block)
          "foo"
        end
      `);

      expect(content).toMatchFormat();
    });

    test("breaking", () => {
      const content = `def foo(${long}:, a${long}:); end`;
      const expected = ruby(`
        def foo(
          ${long}:,
          a${long}:
        )
        end
      `);

      expect(content).toChangeFormat(expected);
    });

    test("with comments on method definition", () => {
      const content = ruby(`
        def foo( # bar
          ${long}:
        )
          ${long}
        end
      `);

      expect(content).toMatchFormat();
    });

    test("with comments on params", () => {
      const content = ruby(`
        def method(
          req, # req comment
          *rest, # rest comment
          post, # post comment
          kwarg:, # kwarg comment
          kwarg_opt: 1, # kwarg_opt comment
          **kwarg_rest, # kwarg_rest comment
          &block # block comment
        )
          "foo"
        end
      `);

      expect(content).toMatchFormat();
    });

    test("with comments on optional params", () => {
      const content = ruby(`
        def method(
          optl = "value" # comment
        )
          "foo"
        end
      `);

      expect(content).toMatchFormat();
    });

    if (atLeastVersion("2.7")) {
      test("nokw_param", () => {
        expect("def foo(**nil); end").toChangeFormat("def foo(**nil)\nend");
      });

      test("args_forward", () => {
        const content = ruby(`
          def foo(...)
            bar(...)
          end
        `);

        expect(content).toMatchFormat();
      });
    }

    if (atLeastVersion("3.0")) {
      test("args_forward with other arguments", () => {
        const content = ruby(`
          def get(...)
            request(:get, ...)
          end
        `);

        expect(content).toMatchFormat();
      });

      test("single-line methods", () => {
        expect("def foo = bar").toMatchFormat();
      });

      test("single-line methods with empty params", () => {
        expect("def foo() = bar").toChangeFormat("def foo = bar");
      });

      test("single-line methods with params", () => {
        expect("def foo(name) = bar").toMatchFormat();
      });
    }

    test("comments on kwargs", () => {
      const content = ruby(`
        def foo(
          bar:, # hello
          baz:
        )
          bar
        end
      `);

      expect(content).toMatchFormat();
    });
  });

  describe("method calls", () => {
    test("empty parens", () => {
      expect("foo()").toChangeFormat("foo");
    });

    test("single args", () => {
      expect("foo(1)").toMatchFormat();
    });

    test("multi arg", () => {
      expect("foo(1, 2)").toMatchFormat();
    });

    test("just block", () => {
      expect("foo(&block)").toMatchFormat();
    });

    describe("commands", () => {
      test("alignment", () => {
        const content = ruby(`
          command.call some_method(
                         ${long}
                       )
        `);

        expect(content).toMatchFormat();
      });

      test("alignment for `to`", () => {
        const content = ruby(`
          expect(value).to matcher(
            ${long}
          )
        `);

        expect(content).toMatchFormat();
      });

      test("alignment for `not_to`", () => {
        const content = ruby(`
          expect(value).not_to matcher(
            ${long}
          )
        `);

        expect(content).toMatchFormat();
      });

      test("alignment for `to_not`", () => {
        const content = ruby(`
          expect(value).to_not matcher(
            ${long}
          )
        `);

        expect(content).toMatchFormat();
      });

      test("just block", () => {
        const content = ruby(`
          def curry(&block)
            new &block
          end
        `);

        expect(content).toMatchFormat();
      });
    });

    describe("single splat", () => {
      test("plain", () => {
        expect("foo(*bar)").toMatchFormat();
      });

      test("with multi args", () => {
        expect("foo(1, 2, *abc)").toMatchFormat();
      });

      test("between multi args", () => {
        expect("foo(1, 2, *abc, 3, 4)").toMatchFormat();
      });

      test("with comments", () => {
        const content = ruby(`
          foo(
            # comment
            # another comment
            # even more comment
            *values
          )
        `);

        expect(content).toMatchFormat();
      });

      test("with trailing comments", () => {
        const content = ruby(`
          foo(
            # comment
            # another comment
            *values # a trailing comment
            # a whole other comment
          )
        `);

        expect(content).toMatchFormat();
      });

      test("with block", () => {
        expect("foo(*bar, &block)").toMatchFormat();
      });

      test("with comments and block", () => {
        const content = ruby(`
          foo(
            # comment
            &block
          )
        `);

        expect(content).toMatchFormat();
      });
    });

    describe("double splat", () => {
      test("plain", () => {
        expect("foo(**bar)").toMatchFormat();
      });

      test("with block", () => {
        expect("foo(**bar, &block)").toMatchFormat();
      });

      test("with splat and block", () => {
        expect("foo(*bar, **baz, &block)").toMatchFormat();
      });

      test("after kwarg", () => {
        expect("foo(kwarg: 1, **splat)").toMatchFormat();
      });

      test("before kwarg", () => {
        expect("foo(**splat, kwarg: 1)").toMatchFormat();
      });

      test("before kwargs", () => {
        expect("foo(before: 1, **splat, after: 1)").toMatchFormat();
      });
    });

    describe("different operators", () => {
      test("double colon gets changed", () => {
        expect("Foo::foo").toChangeFormat("Foo.foo");
      });

      test("lonely operator", () => {
        expect("foo&.foo").toMatchFormat();
      });
    });

    describe("breaking", () => {
      describe("without trailing commas", () => {
        test("starting with no trailing comma stays", () => {
          expect(`foo(${long}, a${long})`).toChangeFormat(
            `foo(\n  ${long},\n  a${long}\n)`
          );
        });

        test("with breaking ternary as first argument", () => {
          expect(`foo bar ? ${long} : a${long}`).toChangeFormat(
            `foo(\n  if bar\n    ${long}\n  else\n    a${long}\n  end\n)`
          );
        });

        test("starting with trailing comma changes", () => {
          expect(`foo(${long}, a${long},)`).toChangeFormat(
            `foo(\n  ${long},\n  a${long}\n)`
          );
        });

        test("with block on the end", () => {
          expect(`foo(${long}, &block)`).toChangeFormat(
            `foo(\n  ${long},\n  &block\n)`
          );
        });

        test("on commands", () => {
          expect(`command ${long}, a${long}`).toChangeFormat(
            ruby(`
              command ${long},
                      a${long}
            `)
          );
        });

        test("on command calls", () => {
          expect(`command.call ${long}, a${long}`).toChangeFormat(
            ruby(`
              command.call ${long},
                           a${long}
            `)
          );
        });
      });
    });
  });
});
