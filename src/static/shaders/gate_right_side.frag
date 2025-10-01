uniform sampler2D atlas;
uniform vec2 tex_repeat;
uniform vec2 tex_offset;

varying vec2 vUv;

void main() {
	float alpha = smoothstep(0.0, 1.0, vUv.x);

        vec2 uv = mod(vUv * 5.0, 1.0);
        uv = uv * tex_repeat + tex_offset;
        
	vec4 tex = texture2D(atlas, uv);

	gl_FragColor = mix(vec4(0,0,0,0), tex, alpha);
}
