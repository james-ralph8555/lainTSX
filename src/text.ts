import * as THREE from "three";
import font_attributes_untyped from "./static/json/fonts.json";
import { get_bounding_box, vec3 } from "./util";
import { TimeContext, get_texture } from "./engine";
import { Texture } from "./textures";
import { Group, Mesh, Vec3 } from "./objects";

enum Font {
    Big = 0,
    Medium = 1,
    Jp = 2,
}

type FontAttributes = {
    glyphs: Record<string, number[] | undefined>;
};

const DEFAULT_GLYPH_RENDER_ORDER = 99999;

const FONT_ATTRIBUTES = font_attributes_untyped as FontAttributes[];

export class Glyph extends Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
    value: string;
    baseline_offset: number;
    width: number;

    constructor(
        character: string,
        scale: number,
        font_attributes: FontAttributes,
        atlas: THREE.Texture,
        atlas_w: number,
        atlas_h: number,
        color: THREE.ColorRepresentation = 0xffffff,
        render_order = DEFAULT_GLYPH_RENDER_ORDER
    ) {
        scale /= 1000;

        if (character === " ") {
            super(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ depthTest: false }), {});

            this.visible = false;
            this.scale.set(8 * scale, 8 * scale, 0);

            this.baseline_offset = 0;

            const bbox = get_bounding_box(this);
            this.width = bbox.max.x - bbox.min.x;

            this.value = " ";

            return;
        }

        const material = new THREE.MeshBasicMaterial({
            map: atlas,
            transparent: true,
            depthTest: false,
            color,
        });

        const glyph_attrs = font_attributes.glyphs[character];

        if (!glyph_attrs) {
            super(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ depthTest: false }), {
                render_order,
            });

            this.baseline_offset = 0;
            this.width = 0;
            this.value = "";

            console.error(`unable to find glyph attributes for "${character}"`);
            return;
        }

        const [x, y, w, h, baseline_offset] = glyph_attrs;

        const geometry = new THREE.PlaneGeometry();

        const uv_attr = geometry.attributes.uv;

        for (let i = 0; i < uv_attr.count; i++) {
            let u = uv_attr.getX(i);
            let v = uv_attr.getY(i);

            u = (u * w) / atlas_w + x / atlas_w;

            v = (v * h) / atlas_h + (1 - h / atlas_h - y / atlas_h);

            uv_attr.setXY(i, u, v);
        }

        super(geometry, material, { scale: vec3(w * scale, h * scale, 0), render_order });

        this.baseline_offset = -(h / 2) * scale + baseline_offset * scale;

        const bbox = get_bounding_box(this);
        this.width = bbox.max.x - bbox.min.x;

        this.value = character;
    }
}

class Text<T extends Glyph> extends Group {
    glyphs: T[];
    scale_factor: number;
    is_japanese: boolean;
    starting_position: Vec3;
    extra_gap: number;

    constructor(
        glyphs: T[],
        scale_factor: number,
        position: Vec3,
        is_japanese: boolean = false,
        extra_gap: number = 0
    ) {
        super({});

        this.glyphs = glyphs;
        this.scale_factor = scale_factor;
        this.is_japanese = is_japanese;
        this.starting_position = position;
        this.extra_gap = extra_gap;

        this.set_position(position);

        if (glyphs.length > 0) {
            this.add(...this.glyphs);
        }
    }

    get_aligned_glyph_positions(starting_position: Vec3): Vec3[] {
        if (this.glyphs.length === 0) {
            return [];
        }

        const direction = this.is_japanese ? -1 : 1;
        const position = vec3(
            starting_position.x,
            starting_position.y - this.glyphs[0].baseline_offset,
            starting_position.z
        );
        const positions: Vec3[] = [position];

        let curr_x = starting_position.x + (this.glyphs[0].width / 2) * direction;

        this.glyphs.slice(1).forEach((glyph) => {
            positions.push(
                vec3(
                    curr_x + (glyph.width / 2) * direction,
                    starting_position.y - glyph.baseline_offset,
                    starting_position.z
                )
            );
            curr_x += glyph.width * direction;
        });

        // VERY clunky but it works
        for (let i = 0; i < positions.length; i++) {
            positions[i].y += this.glyphs[0].baseline_offset;
        }

        for (let i = 1; i < positions.length; i++) {
            positions[i].x += this.extra_gap * i;
        }

        return this.is_japanese ? positions.reverse() : positions;
    }

    get_str_value(): string {
        return this.glyphs.map((g) => g.value).join("");
    }

    get_length(): number {
        return this.glyphs.length;
    }

    clear_glyphs(): void {
        this.glyphs.forEach((g) => this.remove(g));
    }

    set_position(position: Vec3): void {
        const aligned_positions = this.get_aligned_glyph_positions(position);

        this.glyphs.forEach((glyph, i) => {
            glyph.position.copy(aligned_positions[i]);
        });

        this.starting_position = position;
    }

    set_position_unaligned(position: Vec3): void {
        this.glyphs.forEach((glyph) => {
            glyph.position.copy(position);
        });

        this.starting_position = position;
    }

    set_glyphs(glyphs: T[], new_position: Vec3 = this.starting_position): void {
        this.clear_glyphs();

        this.glyphs = glyphs;

        this.set_position(new_position);

        if (this.glyphs.length > 0) {
            this.add(...this.glyphs);
        }
    }

    set_glyphs_unaligned(glyphs: T[]) {
        this.clear_glyphs();

        this.glyphs = glyphs;

        this.set_position_unaligned(this.starting_position);

        if (this.glyphs.length > 0) {
            this.add(...this.glyphs);
        }
    }
}

export class OrangeGlyph extends Glyph {
    constructor(character: string, scale: number, render_order: number = DEFAULT_GLYPH_RENDER_ORDER) {
        super(
            character,
            scale,
            FONT_ATTRIBUTES[Font.Big],
            get_texture(Texture.Font_2),
            256,
            136,
            0xffffff,
            render_order
        );
    }
}

export class YellowGlyph extends Glyph {
    constructor(character: string, scale: number, render_order: number = DEFAULT_GLYPH_RENDER_ORDER) {
        super(
            character,
            scale,
            FONT_ATTRIBUTES[Font.Big],
            get_texture(Texture.Font_1),
            256,
            136,
            0xffffff,
            render_order
        );
    }
}

export class WhiteGlyph extends Glyph {
    constructor(character: string, scale: number) {
        super(character, scale, FONT_ATTRIBUTES[Font.Big], get_texture(Texture.Font_3), 256, 136);
    }
}

enum BigFontTextAnimationState {
    MovingAsGroup,
    Moving,
    FinishedMoving,
    Expanding,
}

export enum BigFontColors {
    FirstOrange,
    AllOrange,
}

type BigFontTextAnimationContext = {
    state: BigFontTextAnimationState;
    colors?: BigFontColors;
    new_text?: string;
    callbacks?: {
        on_expand?: () => void;
        on_complete?: (time: number) => void;
    };
};

type BigFontTextParams = {
    position?: Vec3;
    speed?: number;
    color?: BigFontColors;
    extra_gap?: number;
    scale_factor?: number;
    render_order?: number;
};

const BIG_FONT_GLYPH_DELAY = 70;
export class BigFontText extends Text<OrangeGlyph | YellowGlyph> {
    speed: number;
    animation_context: BigFontTextAnimationContext | null = null;

    constructor(
        str: string,
        {
            speed = 1,
            color = BigFontColors.FirstOrange,
            extra_gap = 0,
            position = vec3(0, 0, 0),
            scale_factor = 1,
            render_order = DEFAULT_GLYPH_RENDER_ORDER,
        }: BigFontTextParams
    ) {
        const glyphs = [];

        if (color === BigFontColors.AllOrange) {
            for (const character of str) {
                glyphs.push(new OrangeGlyph(character, scale_factor, render_order));
            }
        } else {
            glyphs.push(new OrangeGlyph(str[0], scale_factor));
            for (const character of str.slice(1)) {
                glyphs.push(new YellowGlyph(character, scale_factor, render_order));
            }
        }

        super(glyphs, scale_factor, position, false, extra_gap);

        this.speed = speed;
    }

    set_instant(new_text: string, position: Vec3, colors: BigFontColors): void {
        const glyphs = [];

        if (colors === BigFontColors.AllOrange) {
            for (const character of new_text) {
                glyphs.push(new OrangeGlyph(character, this.scale_factor));
            }
        } else {
            glyphs.push(new OrangeGlyph(new_text[0], this.scale_factor));

            for (const character of new_text.slice(1)) {
                glyphs.push(new YellowGlyph(character, this.scale_factor));
            }
        }

        this.set_glyphs(glyphs, position);
    }

    set(
        new_text: string,
        target_position: Vec3,
        colors: BigFontColors,
        callbacks?: {
            on_expand?: () => void;
            on_complete?: (time: number) => void;
        }
    ): void {
        if (new_text.length === 0) {
            console.warn("attempted to set text animation with empty string");
            return;
        }

        this.glyphs.forEach((g, i) => {
            g.add_position_animation(target_position, this.speed, {
                delay: i * BIG_FONT_GLYPH_DELAY,
                start_cb: () => {
                    g.position.copy(this.starting_position);
                },
            });
        });

        this.animation_context = {
            state: BigFontTextAnimationState.Moving,
            new_text,
            colors,
            callbacks,
        };
    }

    move_as_group_vertical(y: number, speed: number, delay: number): void {
        this.glyphs.forEach((g) => {
            const current_position = g.position.clone();
            const new_position = vec3(current_position.x, y, current_position.z);
            g.add_position_animation(new_position, speed, { delay });
        });

        this.animation_context = {
            state: BigFontTextAnimationState.MovingAsGroup,
        };
    }

    move_as_group_horizontal(x: number, speed: number, delay: number): void {
        this.glyphs.forEach((g) => {
            const current_position = g.position.clone();
            const new_position = vec3(current_position.x + x, current_position.y, current_position.z);
            g.add_position_animation(new_position, speed, { delay });
        });

        this.animation_context = {
            state: BigFontTextAnimationState.MovingAsGroup,
        };
    }

    is_animating(): boolean {
        return this.animation_context !== null;
    }

    all_in_place(): boolean {
        return this.glyphs.every((g) => g.animation_controller.queue_empty());
    }

    update(time_ctx: TimeContext): void {
        if (this.animation_context === null) {
            return;
        }

        switch (this.animation_context.state) {
            case BigFontTextAnimationState.MovingAsGroup:
                this.glyphs.forEach((g) => g.process_animation_queue(time_ctx));

                if (this.all_in_place()) {
                    this.starting_position = this.glyphs[0].position.clone();
                    this.animation_context = null;
                }

                break;
            case BigFontTextAnimationState.Moving:
                this.glyphs.forEach((g) => g.process_animation_queue(time_ctx));

                if (this.all_in_place()) {
                    this.starting_position = this.glyphs[0].position.clone();
                    this.animation_context.state = BigFontTextAnimationState.FinishedMoving;
                }

                break;
            case BigFontTextAnimationState.FinishedMoving:
                let { new_text, colors } = this.animation_context;

                const glyphs = [];
                if (colors === BigFontColors.AllOrange) {
                    for (const character of new_text!) {
                        glyphs.push(new OrangeGlyph(character, this.scale_factor));
                    }
                } else {
                    glyphs.push(new OrangeGlyph(new_text![0], this.scale_factor));

                    for (const character of new_text!.slice(1)) {
                        glyphs.push(new YellowGlyph(character, this.scale_factor));
                    }
                }

                // ensure the first glyph stays on top
                const max_render_order = Math.max(...glyphs.map((g) => g.renderOrder));
                glyphs[0].renderOrder = max_render_order + 1;

                this.set_glyphs_unaligned(glyphs);

                const target_positions = this.get_aligned_glyph_positions(this.starting_position);

                this.glyphs.forEach((g, i) =>
                    g.add_position_animation(target_positions[i], this.speed, {
                        delay: i * BIG_FONT_GLYPH_DELAY,
                    })
                );

                if (this.animation_context.callbacks?.on_expand) {
                    this.animation_context.callbacks.on_expand();
                }

                this.animation_context.state = BigFontTextAnimationState.Expanding;

                break;
            case BigFontTextAnimationState.Expanding:
                this.glyphs.forEach((g) => {
                    g.process_animation_queue(time_ctx);
                });

                if (this.all_in_place()) {
                    if (this.animation_context.callbacks?.on_complete) {
                        this.animation_context.callbacks.on_complete(time_ctx.time);
                    }

                    this.animation_context = null;
                }
                break;
        }
    }
}

class MediumGlyph extends Glyph {
    constructor(character: string, scale: number, color?: THREE.ColorRepresentation) {
        if (color === undefined) {
            super(character, scale, FONT_ATTRIBUTES[Font.Medium], get_texture(Texture.Font_3), 256, 136);
        } else {
            super(
                character,
                scale,
                FONT_ATTRIBUTES[Font.Medium],
                get_texture(Texture.Font_1),
                256,
                136,
                color
            );
        }
    }
}

export class MediumFontText extends Text<MediumGlyph> {
    color?: THREE.ColorRepresentation;

    constructor(str: string, scale_factor: number, position: Vec3, color?: THREE.ColorRepresentation) {
        const glyphs = str.split("").map((c) => new MediumGlyph(c, scale_factor, color));
        super(glyphs, scale_factor, position);

        this.color = color;
    }

    set_color(color: THREE.ColorRepresentation): void {
        // NOTE: this assumes that we initially passed a color to the constructor
        // (always the case when we have to use this function so that's fine).
        this.glyphs.forEach((g) => g.material.color.set(color));
    }

    set_text(str: string): void {
        const glyphs = str.split("").map((c) => new MediumGlyph(c, this.scale_factor, this.color));
        this.set_glyphs(glyphs);
    }
}

// Huge thanks to oo for help with this!
function append_japanese_character(current: string, new_char: string): string {
    // characters that cannot be first
    const cant_be_first = ["ン", "ァ", "ィ", "ゥ", "ェ", "ォ", "ャ", "ュ", "ョ", "ッ", "゛", "゜", "ー"];
    if (current.length === 0 && cant_be_first.includes(new_char)) {
        return current;
    }

    const last_char = current.slice(-1);

    //「ー」 cannot be added to 「ッ」 and 「ン」
    if (new_char === "ー") {
        if (last_char === "ッ" || last_char === "ン" || last_char === "ー") {
            return current;
        } else {
            return current.concat(new_char);
        }
    }

    // characters that can be followed by the lowercase characters
    if (["ャ", "ュ", "ョ"].includes(new_char)) {
        const appendable = [
            "キ",
            "シ",
            "チ",
            "ニ",
            "ヒ",
            "ミ",
            "リ",

            // dakuten
            "ギ",
            "ジ",
            "ヂ",
            "ビ",

            // handakuten
            "ピ",
        ];

        if (appendable.includes(last_char)) {
            return current.concat(new_char);
        } else {
            return current;
        }
    } else if (["ァ", "ィ", "ｩ", "ェ", "ォ"].includes(new_char)) {
        const appendable = ["フ"];
        if (appendable.includes(last_char)) {
            return current.concat(new_char);
        } else {
            return current;
        }
    }

    // for 「ッ」, it can added to any character except itself
    if (new_char === "ッ") {
        if (last_char !== "ッ") {
            return current.concat(new_char);
        } else {
            return current;
        }
    }

    // prettier-ignore
    // characters that can be modified with dakuten
    if (new_char === "゛") {
        const without_last_char = current.slice(0, -1);
        switch (last_char) {
            case "カ": return without_last_char + "ガ";
            case "キ": return without_last_char + "ギ";
            case "ク": return without_last_char + "グ";
            case "ケ": return without_last_char + "ゲ";
            case "コ": return without_last_char + "ゴ";
            case "サ": return without_last_char + "ザ";
            case "シ": return without_last_char + "ジ";
            case "ス": return without_last_char + "ズ";
            case "セ": return without_last_char + "ゼ";
            case "ソ": return without_last_char + "ゾ";
            case "タ": return without_last_char + "ダ";
            case "チ": return without_last_char + "ヂ";
            case "ツ": return without_last_char + "ヅ";
            case "テ": return without_last_char + "デ";
            case "ト": return without_last_char + "ド";
            case "ハ": return without_last_char + "バ";
            case "ヒ": return without_last_char + "ビ";
            case "フ": return without_last_char + "ブ";
            case "ヘ": return without_last_char + "ベ";
            case "ホ": return without_last_char + "ボ";
            default: return current;
        }
    }

    // will look into this
    //*Although 「ヂ、ヅ」 are included in the character table that  Ad posted, I couldn't select them.

    // prettier-ignore
    // characters that can be modified with handakuten
    if (new_char === "゜") {
        const without_last_char = current.slice(0, -1);
        switch (last_char) {
            case 'ハ': return without_last_char + 'パ';
            case 'ヒ': return without_last_char + 'ピ';
            case 'フ': return without_last_char + 'プ';
            case 'ヘ': return without_last_char + 'ペ';
            case 'ホ': return without_last_char + 'ポ';
            default: return current;
        }
    }

    return current + new_char;
}

class JapaneseGlyph extends Glyph {
    constructor(character: string, scale: number) {
        super(character, scale, FONT_ATTRIBUTES[Font.Jp], get_texture(Texture.Jp_Font), 240, 96);
    }
}

export class JapaneseText extends Text<JapaneseGlyph> {
    constructor(scale_factor: number, position: Vec3) {
        super([], scale_factor, position, true);
    }

    set_text(str: string): void {
        const glyphs = str.split("").map((char) => new JapaneseGlyph(char, this.scale_factor));
        this.set_glyphs(glyphs);
    }

    pop(): void {
        const str = this.get_str_value();

        if (str.length === 0) {
            return;
        }

        this.set_text(str.substring(0, str.length - 1));
    }

    append(c: string): void {
        const str = this.get_str_value();
        const new_str = append_japanese_character(str, c);

        if (new_str !== str) {
            this.set_text(new_str);
        }
    }

    shift_right(): void {
        const target_position = this.starting_position.clone();
        target_position.x += this.glyphs[0].width;

        this.set_position(target_position);
    }

    shift_left(): void {
        const target_position = this.starting_position.clone();
        target_position.x -= this.glyphs[0].width;

        this.set_position(target_position);
    }
}
