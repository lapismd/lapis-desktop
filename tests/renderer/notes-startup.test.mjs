import { test } from "node:test";
import assert from "node:assert/strict";
import { pluginLoadOptions } from "../../src/lib/notes/plugin-policy.ts";

for (const [community, optional] of [
  [true, false],
  [false, true],
]) {
  test(`startup preserves independent Safe Mode choices: community=${community}, core=${optional}`, () => {
    const options = pluginLoadOptions({
      disableCommunityPlugins: community,
      disableOptionalCorePlugins: optional,
    });
    assert.equal(
      options.communityPlugins,
      community ? "disabled" : "configured",
    );
    assert.equal(
      options.optionalCorePlugins,
      optional ? "disabled" : "configured",
    );
  });
}
