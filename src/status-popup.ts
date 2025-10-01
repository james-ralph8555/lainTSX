import { SceneKind } from "./engine";
import { Group, Sprite3D } from "./objects";
import { Texture } from "./textures";
import { secs_to_ms, vec3 } from "./util";

export enum Status {
    None,
    LoadFail,
    LoadSuccess,
    SaveSuccess,
}

export class LoadStatusPopup extends Group {
    status: Status;
    load_success: Sprite3D;
    load_fail: Sprite3D;
    save_success: Sprite3D;
    status_change_time: number;

    constructor(scene: SceneKind) {
        const scale_factor = 4;

        const container = new Sprite3D(Texture.Status_Container, { scale_factor });

        const load_success = new Sprite3D(Texture.Load_Success, { scale_factor, visible: false });
        const load_fail = new Sprite3D(Texture.Load_Fail, { scale_factor, visible: false });
        const save_success = new Sprite3D(Texture.Save_Success, { scale_factor, visible: false });

        if (scene === SceneKind.Site) {
            super({
                children: [container, load_success, load_fail, save_success],
                position: vec3(0, -0.2, -1.5),
            });
        } else {
            super({
                children: [container, load_success, load_fail, save_success],
                position: vec3(0, -0.25, 0),
            });
        }

        this.children.forEach((c) => (c.renderOrder = 99999999999));

        this.load_success = load_success;
        this.load_fail = load_fail;
        this.save_success = save_success;
        this.status_change_time = -1;

        this.visible = false;

        this.status = Status.None;
    }

    fail_load(time: number): void {
        this.visible = true;
        this.load_success.visible = false;
        this.load_fail.visible = true;
        this.save_success.visible = false;

        this.status_change_time = time;
        this.status = Status.LoadFail;
    }

    succeed_load(time: number): void {
        this.visible = true;
        this.load_success.visible = true;
        this.load_fail.visible = false;
        this.save_success.visible = false;

        this.status_change_time = time;
        this.status = Status.LoadSuccess;
    }

    succeed_save(time: number): void {
        this.visible = true;
        this.load_success.visible = false;
        this.load_fail.visible = false;
        this.save_success.visible = true;

        this.status_change_time = time;
        this.status = Status.SaveSuccess;
    }

    close(): void {
        this.status = Status.None;
        this.visible = false;
    }

    has_status_to_handle(time: number): boolean {
        return this.visible && time >= this.status_change_time + secs_to_ms(1);
    }
}
