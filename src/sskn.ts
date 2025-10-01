import * as THREE from "three";
import { Key, SceneKind, SceneUpdateContext, SceneUpdateResult } from "./engine";
import { Group, Sprite3D } from "./objects";
import { CursorLocation, SiteScene } from "./site";
import { Texture } from "./textures";
import { vec3 } from "./util";
import { NodeID, set_node_as_viewed } from "./node";

enum SSknItem {
    Ok,
    Cancel,
}

const PROGRESS_ORB_UPDATE_RATE_MS = 75;

const PROGRESS_ORB_TEXTURES = [
    Texture.Sskn_Progress_Bar_Indicator_1,
    Texture.Sskn_Progress_Bar_Indicator_2,
    Texture.Sskn_Progress_Bar_Indicator_3,
    Texture.Sskn_Progress_Bar_Indicator_4,
    Texture.Sskn_Progress_Bar_Indicator_5,
    Texture.Sskn_Progress_Bar_Indicator_6,
];

class SSknProgressBar extends Group {
    last_update_time: number;
    front_orb_texture_index: number;
    orbs: Sprite3D[];

    constructor() {
        const container = new Sprite3D(Texture.Sskn_Progress_Bar, {
            scale_factor: 4.2,
            position: vec3(0.26, -0.355, 0),
            render_order: 999,
        });

        super({
            visible: false,
            children: [container],
        });

        this.last_update_time = -1;
        this.front_orb_texture_index = 0;
        this.orbs = [];

        this.move_forward();
    }

    move_forward(): boolean {
        if (this.orbs.length < 6) {
            const new_orb_texture = PROGRESS_ORB_TEXTURES[6 - this.orbs.length];

            const new_orb = new Sprite3D(new_orb_texture, {
                scale_factor: 3.5,
                position: vec3(-0.1, -0.353, 0),
                render_order: 999,
            });

            this.orbs.push(new_orb);
            this.add(new_orb);
        } else {
            this.front_orb_texture_index = 0;
            this.orbs[0].set_texture(PROGRESS_ORB_TEXTURES[this.front_orb_texture_index]);
        }

        this.orbs.forEach((orb) => (orb.position.x += 0.03));

        return this.orbs[0].position.x >= 0.62;
    }

    update(time: number): boolean {
        let done = false;

        if (time >= this.last_update_time + PROGRESS_ORB_UPDATE_RATE_MS) {
            if (this.front_orb_texture_index === 5) {
                this.front_orb_texture_index = 0;
                done = this.move_forward();
            } else {
                this.front_orb_texture_index++;
            }

            this.orbs[0].set_texture(PROGRESS_ORB_TEXTURES[this.front_orb_texture_index]);

            this.last_update_time = time;
        }

        return done;
    }
}

export class SSknScene extends THREE.Scene {
    scene_kind: SceneKind.SSkn;
    active_item: SSknItem;
    loading: boolean;
    progress_bar: SSknProgressBar;
    icon: Sprite3D;
    enter_location: CursorLocation;
    icon_shadow: Sprite3D;
    pre_update_group: THREE.Group;
    ok: Sprite3D;
    ok_wrapper: Sprite3D;
    cancel: Sprite3D;
    cancel_wrapper: Sprite3D;
    node_id: NodeID;

    constructor(enter_location: CursorLocation, node_id: NodeID) {
        super();

        this.node_id = node_id;

        const icon_scale = 4.6;

        this.icon = new Sprite3D(Texture.Sskn_Icon, {
            scale_factor: icon_scale,
            position: vec3(-0.28, 0.15, 0),
            side: THREE.DoubleSide,
            depth_test: false,
            render_order: 999,
        });

        this.icon_shadow = new Sprite3D(Texture.Sskn_Icon, {
            scale_factor: icon_scale * 2,
            position: vec3(-0.2, -0.15, 0),
            depth_test: false,
            render_order: 998,
            side: THREE.DoubleSide,
            opacity: 0.6,
            color: 0x0,
        });

        this.ok = new Sprite3D(Texture.Sskn_Ok_Active, {
            scale_factor: 4.5,
            position: vec3(0.36, -0.27, 0),
        });

        this.ok_wrapper = new Sprite3D(Texture.Sskn_Text_Wrapper_Active, {
            scale_factor: 4.5,
            position: vec3(0.47, -0.295, 0),
            depth_test: false,
            render_order: 999,
        });

        this.cancel = new Sprite3D(Texture.Sskn_Cancel_Inactive, {
            scale_factor: 4.5,
            position: vec3(0.445, -0.38, 0),
        });

        this.cancel_wrapper = new Sprite3D(Texture.Sskn_Text_Wrapper_Inactive, {
            scale_factor: 4.5,
            position: vec3(0.47, -0.405, 0),
            depth_test: false,
            render_order: 999,
        });

        this.pre_update_group = new Group({
            children: [
                this.ok,
                this.ok_wrapper,
                this.cancel,
                this.cancel_wrapper,
                new Sprite3D(Texture.Sskn_Arrow, {
                    scale_factor: 4.5,
                    position: vec3(0.025, -0.345, 0),
                    render_order: 999,
                    depth_test: false,
                }),
                new Sprite3D(Texture.Sskn_Line, {
                    scale_factor: 4.5,
                    position: vec3(-0.64, -0.345, 0),
                    render_order: 999,
                }),
            ],
        });

        this.scene_kind = SceneKind.SSkn;
        this.active_item = SSknItem.Ok;
        this.loading = false;
        this.progress_bar = new SSknProgressBar();
        this.enter_location = enter_location;

        this.add(
            new Group({
                position: vec3(0, 0, -1),
                children: [
                    this.pre_update_group,
                    this.progress_bar,
                    new Sprite3D(Texture.Sskn_Upgrade, {
                        scale_factor: 4.5,
                        position: vec3(-0.36, -0.35, 0),
                        render_order: 999,
                        depth_test: false,
                    }),
                    new Sprite3D(Texture.Sskn_Top_Label, {
                        scale_factor: 4.4,
                        position: vec3(0.47, 0.42, 0),
                    }),
                    new Sprite3D(Texture.Sskn_Dango, {
                        scale_factor: 4.2,
                        opacity: 0.4,
                        position: vec3(-0.38, 0.43, 0),
                    }),
                    new Sprite3D(Texture.Sskn_Background_Text_1, {
                        scale_factor: 4.2,
                        opacity: 0.4,
                        position: vec3(0.26, 0.12, 0.1),
                    }),
                    new Sprite3D(Texture.Sskn_Background_Text_2, {
                        scale_factor: 4.2,
                        opacity: 0.4,
                        position: vec3(0.26, -0.08, 0.1),
                    }),
                    new Sprite3D(Texture.Sskn_Background, {
                        scale_factor: 4.2,
                        position: vec3(-0.035, -0.02, 0),
                    }),
                    this.icon,
                    this.icon_shadow,
                ],
            })
        );
    }
}

export function update_sskn_scene(sskn: SSknScene, ctx: SceneUpdateContext): SceneUpdateResult {
    const { key_states, time_ctx, game_state, camera } = ctx;
    const { progress } = game_state;

    if (key_states[Key.Up] && sskn.active_item !== SSknItem.Ok) {
        sskn.active_item = SSknItem.Ok;

        sskn.ok.set_texture(Texture.Sskn_Ok_Active);
        sskn.ok_wrapper.set_texture(Texture.Sskn_Text_Wrapper_Active);

        sskn.cancel.set_texture(Texture.Sskn_Cancel_Inactive);
        sskn.cancel_wrapper.set_texture(Texture.Sskn_Text_Wrapper_Inactive);
    } else if (key_states[Key.Down] && sskn.active_item !== SSknItem.Cancel) {
        sskn.active_item = SSknItem.Cancel;

        sskn.ok.set_texture(Texture.Sskn_Ok_Inactive);
        sskn.ok_wrapper.set_texture(Texture.Sskn_Text_Wrapper_Inactive);

        sskn.cancel.set_texture(Texture.Sskn_Cancel_Active);
        sskn.cancel_wrapper.set_texture(Texture.Sskn_Text_Wrapper_Active);
    } else if (key_states[Key.Circle] && !sskn.loading) {
        switch (sskn.active_item) {
            case SSknItem.Ok:
                sskn.pre_update_group.visible = false;

                sskn.loading = true;
                sskn.progress_bar.visible = true;
                break;
            case SSknItem.Cancel:
                return { new_scene: new SiteScene(progress, sskn.enter_location, time_ctx.time, camera) };
        }
    }

    sskn.icon.rotation.y += time_ctx.delta * 1.8;

    sskn.icon_shadow.rotation.y += time_ctx.delta * 1.8;
    sskn.icon_shadow.rotation.y = sskn.icon.rotation.y;

    if (sskn.loading) {
        const loading_done = sskn.progress_bar.update(time_ctx.time);
        if (loading_done) {
            progress.sskn_level++;

            set_node_as_viewed(sskn.node_id, game_state);

            return {
                new_scene: new SiteScene(progress, sskn.enter_location, time_ctx.time, camera),
            };
        }
    }

    return {};
}

// TODO: recreate the weird wobbly effect on the icon in the original game
