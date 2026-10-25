import { readFile, mkdir, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { root, localRoot } from "./paths.mjs";
import { hash, imageKey, label } from "./model.mjs";
import { dockerOutput as output, sendDirectory } from "./docker.mjs";
export async function imageInputs(directory, arch, target) {
  const inputs = {};
  for (const file of [
    "scripts/validation/Dockerfile",
    "scripts/validation/install-tools.mjs",
    "rust-toolchain.toml",
  ])
    inputs[file] = hash(await readFile(join(directory, file)));
  const { packageManager } = JSON.parse(
    await readFile(join(directory, "package.json"), "utf8"),
  );
  return { ...inputs, packageManager, arch, target };
}
export async function image(config, target, rebuild = false) {
  const arch = output(config, ["info", "--format", "{{.Architecture}}"]);
  const inputs = await imageInputs(root, arch, target);
  const tag = `lapis-desktop-validation:${target}-${imageKey(inputs)}`;
  try {
    if (!rebuild) {
      const id = output(config, [
        "image",
        "inspect",
        tag,
        "--format",
        "{{.Id}}",
      ]);
      return { tag, id, target };
    }
  } catch {
    /* Build the missing fingerprint. */
  }
  const context = join(localRoot, "images", randomUUID());
  await mkdir(context, { recursive: true });
  try {
    await copyFile(
      join(root, "scripts/validation/Dockerfile"),
      join(context, "Dockerfile"),
    );
    await copyFile(
      join(root, "scripts/validation/install-tools.mjs"),
      join(context, "install-tools.mjs"),
    );
    await sendDirectory(
      config,
      [
        "build",
        "--label",
        `${label}=image`,
        "--target",
        target,
        "-t",
        tag,
        ...(rebuild ? ["--no-cache"] : []),
        "-",
      ],
      context,
    );
  } finally {
    await rm(context, { recursive: true, force: true });
  }
  return {
    tag,
    id: output(config, ["image", "inspect", tag, "--format", "{{.Id}}"]),
    target,
  };
}
