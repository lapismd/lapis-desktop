if (process.platform === "darwin") await import("./build.mjs");
else if (process.platform === "linux") await import("./build-linux.mjs");
else throw Error("Unsupported preview build platform");
