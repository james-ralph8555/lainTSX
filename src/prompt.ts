import { Group, Sprite3D, Vec3 } from "./objects";
import { Texture } from "./textures";
import { Key, play_audio, SceneKind, SFX } from "./engine";
import { vec3 } from "./util";
import { BigFontColors, BigFontText } from "./text";
import * as THREE from "three";

const YES_CONTAINER_POSITION = vec3(-0.425, -0.15, 0);
const NO_CONTAINER_POSITION = vec3(0.425, -0.15, 0);

export enum PromptComponent {
    Yes,
    No,
}

export enum PromptAction {
    None,
    Yes,
    No,
}

export class Prompt extends Group {
    active_component: PromptComponent;
    answer_container: Sprite3D;

    constructor(scene: SceneKind) {
        const answer_container = new Sprite3D(Texture.Prompt_Answer_Container, {
            scale_factor: 4.35,
            position: YES_CONTAINER_POSITION,
            opacity: 0.5,
        });

        let pos: Vec3;
        let text_scale: number;
        let are_you_sure_pos: Vec3;
        let yes_pos: Vec3;
        let no_pos: Vec3;

        // the issue here is that the site scene has a different FOV setting than the rest of the game,
        // so reusing components between it and other scenes directly is not possible - they look different.
        // very clunky workaround but this happens very infrequently so it's tolerable.
        if (scene === SceneKind.Site) {
            pos = vec3(0, 0, 5.4);
            text_scale = 6;
            are_you_sure_pos = new THREE.Vector3(-0.4, 0, -1);
            yes_pos = new THREE.Vector3(-0.75, -0.25, -1);
            no_pos = new THREE.Vector3(0.65, -0.25, -1);
        } else {
            pos = vec3(0, 0.05, 0);
            text_scale = 7;
            are_you_sure_pos = new THREE.Vector3(-0.4, 0.055, -1);
            yes_pos = new THREE.Vector3(-0.92, -0.25, -1);
            no_pos = new THREE.Vector3(0.815, -0.25, -1);
        }

        super({
            position: pos,
            visible: false,
            children: [
                new BigFontText("Are you sure?", {
                    scale_factor: text_scale,
                    position: are_you_sure_pos,
                    color: BigFontColors.AllOrange,
                }),
                new BigFontText("Yes", {
                    scale_factor: text_scale,
                    position: yes_pos,
                    color: BigFontColors.AllOrange,
                }),
                new BigFontText("No", {
                    scale_factor: text_scale,
                    position: no_pos,
                    color: BigFontColors.AllOrange,
                }),
                answer_container,
                new Sprite3D(Texture.Prompt_Question_Container, { scale_factor: 4.35, opacity: 0.5 }),
            ],
        });

        this.children.forEach((c) => (c.renderOrder = 99999999999));

        this.answer_container = answer_container;
        this.active_component = PromptComponent.Yes;
    }

    handle_keys(key_states: boolean[]): PromptAction {
        if (key_states[Key.Circle]) {
            switch (this.active_component) {
                case PromptComponent.No:
                    this.close();
                    this.answer_container.position.copy(YES_CONTAINER_POSITION);
                    this.active_component = PromptComponent.Yes;
                    return PromptAction.No;
                case PromptComponent.Yes:
                    play_audio(SFX.SND_28);
                    return PromptAction.Yes;
            }
        } else if (key_states[Key.Left] && this.active_component === PromptComponent.No) {
            play_audio(SFX.SND_1);
            this.answer_container.position.copy(YES_CONTAINER_POSITION);
            this.active_component = PromptComponent.Yes;
        } else if (key_states[Key.Right] && this.active_component === PromptComponent.Yes) {
            play_audio(SFX.SND_1);
            this.answer_container.position.copy(NO_CONTAINER_POSITION);
            this.active_component = PromptComponent.No;
        }

        return PromptAction.None;
    }

    is_open(): boolean {
        return this.visible;
    }

    open(): void {
        this.visible = true;
    }

    close(): void {
        play_audio(SFX.SND_28);
        this.visible = false;
    }
}
