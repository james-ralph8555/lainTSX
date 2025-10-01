precision highp float;
varying vec2 vUv;
// lights
varying vec3 vPos;
varying vec3 vNormal;
struct PointLight {
  vec3 position;
  vec3 color;
  float distance;
};
uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
void main() {
  vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);
  
  for (int l = 0; l < NUM_POINT_LIGHTS; l++) {
    vec3 lightDirection = normalize(vPos - pointLights[l].position);
    addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) *
                       pointLights[l].color * 5.0;
  }
  
  vec3 baseLighting = vec3(0.1);
  vec3 totalLighting = baseLighting + addedLights.rgb;
  
  vec3 baseColor = vec3(0.02, 0.98, 0.82);
  
  vec3 finalColor = baseColor * totalLighting;
  
  gl_FragColor = vec4(finalColor, 1.0);
}