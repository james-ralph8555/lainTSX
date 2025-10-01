varying vec2 vUv;
uniform sampler2D atlas;
uniform vec2 lof_repeat;
uniform vec2 lof_offset;
uniform vec2 life_repeat;
uniform vec2 life_offset;
uniform vec2 sides_repeat;
uniform vec2 sides_offset;

// lights
varying vec3 vPos;
varying vec3 vNormal;

struct PointLight {
  vec3 position;
  vec3 color;
  float distance;
};

uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

// transform coordinates to uniform within segment
float tolocal(float x, int segments, float step) {
  float period = 1.0/step*float(segments);
  return mod(x, period) / period;
}

// check if coordinate is within the given height
bool isheight(float y, float thin) {
    return y > 0.5-thin/2.0 && y < 0.5+thin/2.0;
}

// sloping function
float slope(float x, float thin) {
  return x*(1.0-thin)/2.0;
}

// frag color / texture
// #424252 hex in original textures
vec4 color(vec2 vUv, int quadnum, bool textureexists, int thinperiod, int quadlen, float step) {
  if (!textureexists) {
    return vec4(0.259,0.259,0.322, 1);
  } else if (mod(float(quadnum), 2.0) == 1.0) {
      vec4 result = texture2D(atlas, vec2(tolocal(vUv.x, quadlen-thinperiod, step), vUv.y) * sides_repeat + sides_offset);
      if (result.a < 1.0) {
        discard;
      } else {
         return result;
      }
  } else if (quadnum == 0) {
    return texture2D(atlas, vec2(tolocal(vUv.x, quadlen-thinperiod, step), vUv.y) * lof_repeat + lof_offset);
  } else {
    return texture2D(atlas, vec2(tolocal(vUv.x, quadlen-thinperiod, step), vUv.y) * life_repeat + life_offset);
  }
}

void main() {

  //lights
  vec4 addedLights = vec4(0.0,
                    0.0,
                    0.0,
                    1.0);
                        
  for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
      vec3 lightDirection = normalize(vPos
                            - pointLights[l].position);
      addedLights.rgb += clamp(dot(-lightDirection,
                               vNormal), 0.0, 1.0)
                         * pointLights[l].color
                         * 30.0;
  }


  // number of segments
  float step = 64.0;
  
  // thin line height
  float thin = 0.3;
  
  // segment within circle
  int segment = int(floor(vUv.x * step));
  
  int quadlen = int(step)/4;
  
  // segment within circle's quad
  int quadel = int(mod(float(segment), float(quadlen)));
  
  // which quad
  int quadnum = int(int(segment) / int(quadlen));
 
 // how big thin part is
 int thinperiod = 8;
 
  if (quadel < thinperiod && isheight(vUv.y, thin)) {
      // thin line
      gl_FragColor = color(vUv, quadnum, false, thinperiod, quadlen, step) * addedLights;
  } else if (quadel == thinperiod) {
      // slope up
      float dist = tolocal(vUv.x, 1, step);
      if (vUv.y > slope(1.0-dist, thin) && vUv.y < 1.0-slope(1.0-dist, thin)) {
          gl_FragColor = color(vUv, quadnum, true, thinperiod, quadlen, step) * addedLights;
      } else {
         discard;
      }
  } else if (quadel == quadlen-1) {
      // slope down
      float dist = tolocal(vUv.x, 1, step);
      if (vUv.y > slope(dist, thin) && vUv.y < 1.0-slope(dist, thin)) {
         gl_FragColor = color(vUv, quadnum, true, thinperiod, quadlen, step) * addedLights;
      } else {
         discard;
      }
  } else if (quadel > thinperiod) {
        gl_FragColor = color(vUv, quadnum, true, thinperiod, quadlen, step) * addedLights;
  } else {
         discard;
  }
}
