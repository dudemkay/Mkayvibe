import { describe, expect, it } from 'vitest';
import GoogleVertexProvider, { buildGoogleVertexBaseUrl } from './google-vertex';

describe('GoogleVertexProvider', () => {
  it('builds the current global Vertex OpenAI-compatible endpoint', () => {
    expect(buildGoogleVertexBaseUrl(undefined, 'my-project', 'global')).toBe(
      'https://aiplatform.googleapis.com/v1/projects/my-project/locations/global/endpoints/openapi',
    );
  });

  it('defaults to the global Vertex location', () => {
    expect(buildGoogleVertexBaseUrl(undefined, 'my-project')).toBe(
      'https://aiplatform.googleapis.com/v1/projects/my-project/locations/global/endpoints/openapi',
    );
  });

  it('prefers an explicit Vertex base URL for regional or custom endpoints', () => {
    expect(buildGoogleVertexBaseUrl('https://us-central1-aiplatform.googleapis.com/v1beta1/custom/', 'my-project')).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1beta1/custom',
    );
  });

  it('ships documented Vertex OpenAI-compatible Gemini defaults', () => {
    const provider = new GoogleVertexProvider();
    const models = provider.staticModels.map((model) => model.name);

    expect(models[0]).toBe('google/gemini-2.5-flash');
    expect(models).toContain('google/gemini-2.5-pro');
  });

  it('uses configured Vertex model ids', async () => {
    const provider = new GoogleVertexProvider();
    const models = await provider.getDynamicModels(undefined, { models: 'google/model-a; google/model-b' }, {});

    expect(models.map((model) => model.name)).toEqual(['google/model-a', 'google/model-b']);
    expect(models.every((model) => model.provider === 'GoogleVertex')).toBe(true);
  });
});
