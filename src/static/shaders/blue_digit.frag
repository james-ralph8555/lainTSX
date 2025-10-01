uniform sampler2D atlas;
uniform vec2 tex_repeat;
uniform vec2 tex_offset;
uniform float brightness;
varying vec2 vUv;

void main() {
        gl_FragColor = texture2D(atlas, vUv * tex_repeat + tex_offset) * brightness;
}
