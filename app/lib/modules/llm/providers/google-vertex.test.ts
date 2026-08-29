import { describe, expect, it } from 'vitest';
import GoogleVertexProvider, { buildGoogleVertexBaseUrl } from './google-vertex';

describe('GoogleVertexProvider', () => {
  it('builds the official Vertex OpenAI-compatible endpoint', () => {
    expect(buildGoogleVertexBaseUrl(undefined, 'my-project', 'us-central1')).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/my-project/locations/us-central1/endpoints/openapi',
    );
  });

  it('prefers an explicit Vertex base URL', () => {
    expect(buildGoogleVertexBaseUrl('https://example.com/vertex/', 'my-project', 'us-central1')).toBe(
      'https://example.com/vertex',
    );
  });

  it('uses configured Vertex model ids', async () => {
    const provider = new GoogleVertexProvider();
    const models = await provider.getDynamicModels(undefined, { models: 'google/model-a; google/model-b' }, {});

    expect(models.map((model) => model.name)).toEqual(['google/model-a', 'google/model-b']);
    expect(models.every((model) => model.provider === 'GoogleVertex')).toBe(true);
  });
});
