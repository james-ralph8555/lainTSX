uniform vec3 color1;
uniform vec3 color2;
uniform float alpha;

varying vec2 vUv;

void main() {
  vec3 mixedColor = mix(color1, color2, vUv.x);
  
  float fadeStart = 0.4;
  float normalizedPosition = clamp((vUv.x - fadeStart) / (1.0 - fadeStart), 0.0, 1.0);
  
  gl_FragColor = vec4(mixedColor, alpha * (1.0 - normalizedPosition));
}