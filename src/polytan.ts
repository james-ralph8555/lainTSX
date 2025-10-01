import { SceneKind, SceneUpdateContext, SceneUpdateResult } from "./engine";
import * as THREE from "three";
import { Group, Sprite3D } from "./objects";
import { CursorLocation, SiteScene } from "./site";
import { Texture } from "./textures";
import { MediumFontText } from "./text";
import { secs_to_ms, vec3 } from "./util";
import { PolytanPartProgress } from "./save";
import { Node, set_node_as_viewed } from "./node";

export enum PolytanPart {
    Head,
    RightArm,
    LeftArm,
    RightLeg,
    LeftLeg,
    Body,
}

export function get_polytan_part_from_node_name(node_name: string): PolytanPart {
    switch (node_name.slice(-1)) {
        case "6":
            return PolytanPart.Head;
        case "5":
            return PolytanPart.RightArm;
        case "4":
            return PolytanPart.LeftArm;
        case "3":
            return PolytanPart.RightLeg;
        case "2":
            return PolytanPart.LeftLeg;
        case "1":
            return PolytanPart.Body;
    }

    console.warn("failed to convert node name to polytan part ", node_name);
    return PolytanPart.Body;
}

export function are_all_polytan_parts_unlocked(polytan_part_progress: PolytanPartProgress): boolean {
    return Object.values(polytan_part_progress).every((v) => v);
}

export function update_polytan_scene(polytan: PolytanScene, ctx: SceneUpdateContext): SceneUpdateResult {
    const { time_ctx, key_states, game_state, camera } = ctx;
    const { progress } = game_state;
    const { time } = time_ctx;

    if (time >= polytan.keypress_unlock_time) {
        for (const k of key_states) {
            if (k) {
                set_node_as_viewed(polytan.node.id, game_state);

                return {
                    new_scene: new SiteScene(progress, polytan.enter_location, time, camera),
                };
            }
        }

        if (time >= polytan.last_press_any_button_text_blink_time + secs_to_ms(0.5)) {
            polytan.press_any_button_text.visible = !polytan.press_any_button_text.visible;
            polytan.last_press_any_button_text_blink_time = time;
        }
    }

    return {};
}

export class PolytanScene extends THREE.Scene {
    scene_kind: SceneKind.Polytan;
    last_press_any_button_text_blink_time: number;
    press_any_button_text: MediumFontText;
    keypress_unlock_time: number;
    enter_location: CursorLocation;
    node: Node;

    constructor(
        polytan_parts: PolytanPartProgress,
        enter_time: number,
        enter_location: CursorLocation,
        node: Node
    ) {
        super();

        this.node = node;

        this.scene_kind = SceneKind.Polytan;

        this.enter_location = enter_location;

        this.keypress_unlock_time = enter_time + secs_to_ms(1);

        this.press_any_button_text = new MediumFontText("press ANY button", 4.8, vec3(-0.26, -0.45, 0));

        this.press_any_button_text.visible = false;

        this.last_press_any_button_text_blink_time = this.keypress_unlock_time;

        this.add(
            new Group({
                position: vec3(0, 0, -1),
                children: [
                    this.press_any_button_text,
                    new Sprite3D(Texture.Polytan_Bg_Head, {
                        scale_factor: 5,
                        position: vec3(-0.43, -0.3, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Bg_Leg, {
                        scale_factor: 5,
                        position: vec3(0.43, 0.3, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Skeleton, {
                        scale_factor: 4,
                        position: vec3(0, -0.05, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Left_Arm, {
                        scale_factor: 4.1,
                        position: vec3(0.15, -0.045, 0),
                        visible: polytan_parts.left_arm,
                    }),
                    new Sprite3D(Texture.Polytan_Right_Arm, {
                        scale_factor: 4,
                        position: vec3(-0.16, -0.16, 0),
                        visible: polytan_parts.right_arm,
                    }),
                    new Sprite3D(Texture.Polytan_Left_Leg, {
                        scale_factor: 4,
                        position: vec3(0.136, -0.285, 0),
                        visible: polytan_parts.left_leg,
                    }),
                    new Sprite3D(Texture.Polytan_Right_Leg, {
                        scale_factor: 4,
                        position: vec3(-0.14, -0.285, 0),
                        visible: polytan_parts.right_leg,
                    }),
                    new Sprite3D(Texture.Polytan_Body, {
                        scale_factor: 4.1,
                        position: vec3(-0.01, -0.14, 0),
                        visible: polytan_parts.body,
                    }),
                    new Sprite3D(Texture.Polytan_Head, {
                        scale_factor: 4.1,
                        position: vec3(-0.01, 0.1, 0),
                        visible: polytan_parts.head,
                    }),
                    new Sprite3D(Texture.Polytan_Right_Arm_Hud, {
                        scale_factor: 4,
                        position: vec3(-0.38, -0.1, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Right_Leg_Hud, {
                        scale_factor: 4,
                        position: vec3(-0.37, -0.35, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Left_Leg_Hud, {
                        scale_factor: 4,
                        position: vec3(0.34, -0.18, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Left_Arm_Hud, {
                        scale_factor: 4,
                        position: vec3(0.38, 0.04, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Body_Hud, {
                        scale_factor: 4,
                        position: vec3(0.2, -0.29, 0),
                    }),
                    new Sprite3D(Texture.Polytan_Head_Hud, {
                        scale_factor: 4,
                        position: vec3(-0.28, 0.27, 0),
                    }),
                ],
            })
        );
    }
}
