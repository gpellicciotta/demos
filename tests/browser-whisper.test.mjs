import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext, Script } from 'node:vm';

const html = readFileSync(new URL('../web-speech-api-voice-to-text-demo.html', import.meta.url), 'utf8');

function setup(gpu, pipeline) {
  const source = html.match(/async function createBrowserWhisperPipeline\([\s\S]*?\n      }/);
  assert.ok(source, 'Whisper must initialize through an adapter-aware fallback helper');
  const badge = { textContent: '' };
  const create = runInNewContext(`(${source[0]})`, {
    navigator: { gpu }, webgpuStatusBadge: badge,
  });
  return { create: () => create(pipeline, 'onnx-community/whisper-tiny', () => {}), badge };
}

for (const [name, gpu] of [
  ['missing API', undefined],
  ['null adapter', { requestAdapter: async () => null }],
  ['rejected adapter', { requestAdapter: async () => { throw new Error('blocked'); } }],
]) {
  test(`uses WASM with ${name}`, async () => {
    const calls = [];
    const { create, badge } = setup(gpu, async (...args) => { calls.push(args); return 'cpu'; });
    assert.equal(await create(), 'cpu');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][2].device, 'wasm');
    assert.equal(calls[0][2].dtype, 'q8');
    assert.match(badge.textContent, /WASM/);
  });
}

test('keeps a working WebGPU pipeline', async () => {
  const { create, badge } = setup({ requestAdapter: async () => ({}) }, async (task, model, options) => {
    assert.equal(options.device, 'webgpu');
    return 'gpu';
  });
  assert.equal(await create(), 'gpu');
  assert.match(badge.textContent, /WebGPU/);
});

test('retries failed GPU initialization through WASM', async () => {
  const devices = [];
  const { create } = setup({ requestAdapter: async () => ({}) }, async (task, model, options) => {
    devices.push(options.device);
    if (options.device === 'webgpu') {
      throw new Error('Failed to get GPU adapter');
    }
    return 'cpu';
  });
  assert.equal(await create(), 'cpu');
  assert.deepEqual(devices, ['webgpu', 'wasm']);
});

test('propagates WASM failures for the existing error alert', async () => {
  const { create } = setup(undefined, async () => { throw new Error('WASM unavailable'); });
  await assert.rejects(create(), /WASM unavailable/);
});

test('transcription uses and caches the fallback pipeline', () => {
  assert.match(html, /loadedPipelines\[modelId\] = await createBrowserWhisperPipeline\(/);
  assert.match(html, /const transcriber = loadedPipelines\[modelId\]/);
});

test('the complete application script parses', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, source] of scripts) {
    new Script(source);
  }
});
