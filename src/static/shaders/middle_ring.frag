uniform sampler2D atlas;
uniform vec2 tex_repeat;
uniform vec2 tex_offset;
uniform float gap_size;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    float slice_count = 32.0;
    
    float slice_position = vUv.x * slice_count;
    float slice_index = floor(slice_position);
    float position_in_slice = fract(slice_position);
    
    if (position_in_slice < gap_size * 0.5 || 
        position_in_slice > (1.0 - gap_size * 0.5)) {
        discard;
    }
    
    gl_FragColor = texture2D(atlas, vUv * tex_repeat + tex_offset);
    gl_FragColor.a *= 0.5;
    
    if (gl_FragColor.a == 0.0) {
        discard;
    }
}