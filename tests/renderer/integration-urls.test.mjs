import { test } from "node:test";
import assert from "node:assert/strict";
import { DesktopUrlDelivery } from "../../src/lib/native/integration-urls.ts";

function fixture(
  urls = ["lapis://open?file=First", "lapis://open?file=Second"],
) {
  const pending = urls.map((url, index) => ({
    id: String(index),
    url,
    error: null,
  }));
  const acknowledgements = [],
    failures = [];
  const invoke = async (command, payload) => {
    if (command === "desktop_url_next") return pending[0] ?? null;
    assert.equal(command, "desktop_url_ack");
    assert.equal(payload.id, pending[0].id);
    acknowledgements.push(pending.shift().id);
  };
  return {
    pending,
    acknowledgements,
    failures,
    invoke,
    delivery: new DesktopUrlDelivery(invoke, (error) => failures.push(error)),
  };
}

test("requests remain native-owned until a ready target delivers and acknowledges them in order", async () => {
  const { delivery, pending, acknowledgements, failures } = fixture();
  await delivery.flush();
  assert.equal(pending.length, 2);
  const handled = [];
  delivery.attach(async (request, acknowledge) => {
    handled.push(request.url);
    await acknowledge();
  });
  await delivery.flush();
  assert.deepEqual(handled, [
    "lapis://open?file=First",
    "lapis://open?file=Second",
  ]);
  assert.deepEqual(acknowledgements, ["0", "1"]);
  assert.deepEqual(failures, []);
});

test("a retired App cannot consume a native response that arrives after its target changes", async () => {
  const { invoke, pending, acknowledgements } = fixture([
    "lapis://open?file=Note",
  ]);
  const release = Promise.withResolvers();
  const delivered = Promise.withResolvers();
  const delivery = new DesktopUrlDelivery(
    async (command, payload) => {
      if (command === "desktop_url_next") await release.promise;
      return invoke(command, payload);
    },
    (error) => delivered.reject(error),
  );
  const old = [];
  const stop = delivery.attach(async (request) => {
    old.push(request);
  });
  stop();
  delivery.attach(async (request, acknowledge) => {
    await acknowledge();
    delivered.resolve(request.url);
  });
  release.resolve();
  assert.equal(await delivered.promise, "lapis://open?file=Note");
  assert.deepEqual(old, []);
  assert.deepEqual(acknowledgements, ["0"]);
  assert.equal(pending.length, 0);
});

test("already admitted delivery drains its acknowledgement before the next App receives another request", async () => {
  const { delivery, acknowledgements } = fixture();
  const admitted = Promise.withResolvers(),
    release = Promise.withResolvers(),
    next = Promise.withResolvers();
  const stop = delivery.attach(async (_, acknowledge) => {
    admitted.resolve();
    await release.promise;
    await acknowledge();
  });
  await admitted.promise;
  stop();
  delivery.attach(async (request, acknowledge) => {
    await acknowledge();
    next.resolve(request.url);
  });
  release.resolve();
  assert.equal(await next.promise, "lapis://open?file=Second");
  assert.deepEqual(acknowledgements, ["0", "1"]);
});

test("failed delivery remains queued and reports its owner failure before explicit retry", async () => {
  const { delivery, pending, failures, acknowledgements } = fixture([
    "lapis://open?file=Note",
  ]);
  const stop = delivery.attach(async () => {
    throw new Error("Retained note conflict");
  });
  await delivery.flush();
  assert.equal(failures.length, 1);
  assert.equal(pending.length, 1);
  assert.deepEqual(acknowledgements, []);
  stop();
  delivery.attach(async (_, acknowledge) => acknowledge());
  await delivery.flush();
  assert.equal(pending.length, 0);
  delivery.dispose();
});
