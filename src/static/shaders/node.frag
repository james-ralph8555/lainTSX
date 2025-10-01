precision highp float;

uniform sampler2D atlas;
uniform vec2 active_tex_repeat;
uniform vec2 active_tex_offset;
uniform vec2 normal_tex_repeat;
uniform vec2 normal_tex_offset;
uniform vec2 gold_tex_repeat;
uniform vec2 gold_tex_offset;
uniform bool is_active;
uniform bool is_gold;
uniform float bias;

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
                       pointLights[l].color;
  }

  if (is_gold) {
    gl_FragColor = texture2D(atlas, vUv * gold_tex_repeat + gold_tex_offset);
  } else if (is_active) {
    vec4 t1 = texture2D(atlas, vUv * active_tex_repeat + active_tex_offset);
    vec4 t2 = texture2D(atlas, vUv * normal_tex_repeat + normal_tex_offset);

    gl_FragColor = mix(t2, t1, bias);
  } else {
    gl_FragColor = texture2D(atlas, vUv * normal_tex_repeat + normal_tex_offset);
  }

  gl_FragColor *= addedLights;
}
