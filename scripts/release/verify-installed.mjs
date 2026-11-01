import assert from "node:assert/strict";
import { lstatSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  identifier,
  productName,
  helpers,
  validateManifest,
} from "./contract.mjs";
import { verifyOrdinary } from "./ordinary.mjs";
export function verifyInstalled(app, manifest) {
  validateManifest(manifest);
  if (!lstatSync(app).isDirectory() || lstatSync(app).isSymbolicLink())
    throw Error("Expected a regular app bundle");
  const plist = JSON.parse(
    execFileSync(
      "/usr/bin/plutil",
      ["-convert", "json", "-o", "-", join(app, "Contents/Info.plist")],
      { encoding: "utf8" },
    ),
  );
  assert.equal(plist.CFBundleIdentifier, identifier);
  assert.equal(plist.CFBundleName, productName);
  assert.equal(plist.CFBundleShortVersionString, manifest.version);
  assert.equal(plist.CFBundleVersion, manifest.version.split("-rc.")[0]);
  assert.equal(plist.LSMinimumSystemVersion, "15.0");
  assert.ok(
    !plist.CFBundleURLTypes?.length,
    "Preview must not claim stable URL handlers",
  );
  assert.equal(plist.CFBundleExecutable, "lapis-desktop");
  const executable = join(app, "Contents/MacOS", plist.CFBundleExecutable);
  assert.equal(
    execFileSync("/usr/bin/lipo", ["-archs", executable], {
      encoding: "utf8",
    }).trim(),
    "arm64",
  );
  const signature = spawnSync("/usr/bin/codesign", ["-d", "--verbose=4", app], {
    encoding: "utf8",
  });
  assert.equal(signature.status, 0);
  assert.match(signature.stderr, /Signature=adhoc/);
  execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", app]);
  assert.doesNotMatch(
    execFileSync("/usr/bin/xattr", ["-r", app], { encoding: "utf8" }),
    /com.apple.quarantine/,
  );
  const files = verifyOrdinary(app, executable);
  for (const name of helpers) {
    const helper = join(app, "Contents/Resources/lapis-ai", name);
    assert.ok(lstatSync(helper).isFile());
    assert.equal(
      execFileSync("/usr/bin/lipo", ["-archs", helper], {
        encoding: "utf8",
      }).trim(),
      "arm64",
    );
    execFileSync("/usr/bin/codesign", ["--verify", "--strict", helper]);
  }
  return {
    identifier,
    version: manifest.version,
    architecture: "arm64",
    minimumMacOS: "15.0",
    signature: "verified",
    ordinaryBundle: "verified",
    bundledFiles: files.length,
  };
}
