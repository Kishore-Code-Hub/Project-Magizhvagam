import * as THREE from 'three';

// Create a character sprite atlas texture containing character sets
export function createMatrixAtlasTexture(characterMode: string = 'binary'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let charList: string[] = ['0', '1'];
    if (characterMode === 'katakana') {
      charList = ['ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', '0', '1'];
    } else if (characterMode === 'hex') {
      charList = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    } else if (characterMode === 'cyber') {
      charList = ['0', '1', '⚡', '⚙', '⌘', '⌥', '⎇', '⌬', '⏣', '∅'];
    } else if (characterMode === 'mixed') {
      charList = ['0', '1', 'X', 'Y', 'Z', '7', '9', 'A', 'F', 'ｱ', 'ｼ', '⌬'];
    }

    const cols = 4;
    const rows = 4;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 16; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;

      const char = charList[i % charList.length];

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#00FF66';
      ctx.shadowBlur = 12;
      ctx.fillText(char, x, y);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export const MatrixShader = {
  uniforms: {
    uTime: { value: 0 },
    uAtlas: { value: null },
    uGlowIntensity: { value: 0.8 },
    uBloomThreshold: { value: 0.4 },
    uColor: { value: new THREE.Color('#00ff66') },
    uHeadColor: { value: new THREE.Color('#ffffff') },
  },
  vertexShader: `
    attribute float aCharIndex;
    attribute float aOpacity;
    attribute float aIsHead;

    varying vec2 vUv;
    varying float vOpacity;
    varying float vIsHead;
    varying float vCharIndex;

    void main() {
      vUv = uv;
      vOpacity = aOpacity;
      vIsHead = aIsHead;
      vCharIndex = aCharIndex;

      vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
      vec4 modelViewPosition = modelViewMatrix * instancePosition;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D uAtlas;
    uniform float uGlowIntensity;
    uniform vec3 uColor;
    uniform vec3 uHeadColor;

    varying vec2 vUv;
    varying float vOpacity;
    varying float vIsHead;
    varying float vCharIndex;

    void main() {
      // Atlas grid (4x4)
      float col = mod(vCharIndex, 4.0);
      float row = floor(vCharIndex / 4.0);
      vec2 tileUv = (vUv + vec2(col, 3.0 - row)) * 0.25;

      vec4 texColor = texture2D(uAtlas, tileUv);
      if (texColor.a < 0.1) discard;

      vec3 finalColor = mix(uColor, uHeadColor, vIsHead);
      float alpha = texColor.a * vOpacity * (vIsHead > 0.5 ? 1.0 : uGlowIntensity);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};
