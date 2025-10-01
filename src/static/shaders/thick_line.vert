varying vec2 vUv;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  float taperThreshold = 0.8;
  float taperFactor = 1.0;
  
  if (uv.x > taperThreshold) {
    float pastThreshold = (uv.x - taperThreshold) / (1.0 - taperThreshold);
    
    taperFactor = 1.0 - pastThreshold;
    
    pos.y *= taperFactor;
  }
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}