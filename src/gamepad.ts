import { Key } from "./engine";

const BUTTON = {
    SOUTH: 0,
    EAST: 1,
    WEST: 2,
    NORTH: 3,
    L1: 4,
    R1: 5,
    L2: 6,
    R2: 7,
    SELECT: 8,
    START: 9,
    L3: 10,
    R3: 11,
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15,
};

export interface gamepad_layout {
    name: string;
    mappings: Record<number, Key>;
}

export const default_gamepad_layouts: gamepad_layout[] = [
    {
        name: "Official",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.EAST]: Key.Circle,
            [BUTTON.SOUTH]: Key.Cross,
            [BUTTON.NORTH]: Key.Triangle,
            [BUTTON.WEST]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    },
    {
        name: "Alternative",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.SOUTH]: Key.Circle,
            [BUTTON.EAST]: Key.Cross,
            [BUTTON.WEST]: Key.Triangle,
            [BUTTON.NORTH]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    },
    {
        name: "Classic",
        mappings: {
            [BUTTON.DPAD_DOWN]: Key.Down,
            [BUTTON.DPAD_LEFT]: Key.Left,
            [BUTTON.DPAD_UP]: Key.Up,
            [BUTTON.DPAD_RIGHT]: Key.Right,
            [BUTTON.WEST]: Key.Circle,
            [BUTTON.EAST]: Key.Cross,
            [BUTTON.NORTH]: Key.Triangle,
            [BUTTON.SOUTH]: Key.Square,
            [BUTTON.R2]: Key.R2,
            [BUTTON.L2]: Key.L2,
            [BUTTON.L1]: Key.L1,
            [BUTTON.R1]: Key.R1,
            [BUTTON.START]: Key.Start,
            [BUTTON.SELECT]: Key.Select,
        }
    }
];

const GAMEPAD_LAYOUT_KEY = "lainTSX-gamepad-layout";

const DEADZONE = 0.1;
const DEBOUNCE_TIME = 150;

export class gamepad_manager {
    private previous_button_states: boolean[][] = [];
    private button_debounce_times: number[][] = [];
    private connected_gamepads: Set<number> = new Set();
    private digital_dpad_states: boolean[] = [];
    private current_layout: gamepad_layout;
    private last_discovery_poll: number = 0;
    private readonly discovery_poll_interval: number = 1000;

    constructor() {
        this.setup_event_listeners();
        this.current_layout = this.load_layout();
        this.digital_dpad_states = [];
        for (const _ in Key) {
            this.digital_dpad_states.push(false);
        }
    }

    private load_layout(): gamepad_layout {
        const stored_layout = localStorage.getItem(GAMEPAD_LAYOUT_KEY);
        if (stored_layout) {
            try {
                const parsed = JSON.parse(stored_layout);
                const mappings: Record<number, Key> = {};
                if (parsed && parsed.mappings) {
                    for (const [btn, val] of Object.entries(parsed.mappings as Record<string, string | number>)) {
                        const idx = Number(btn);
                        if (typeof val === "string" && val in Key) {
                            mappings[idx] = (Key as any)[val as keyof typeof Key] as Key;
                        } else {
                            mappings[idx] = val as Key;
                        }
                    }
                }
                return { name: parsed.name, mappings } as gamepad_layout;
            } catch (e) {
                console.error("Failed to parse gamepad layout:", e);
            }
        }
        return default_gamepad_layouts[0];
    }

    public save_layout(layout: gamepad_layout): void {
        const mappings: Record<number, Key> = {};
        for (const [btn, val] of Object.entries(layout.mappings as Record<string, string | number>)) {
            const idx = Number(btn);
            if (typeof val === "string" && val in Key) {
                mappings[idx] = (Key as any)[val as keyof typeof Key] as Key;
            } else {
                mappings[idx] = val as Key;
            }
        }
        this.current_layout = { name: layout.name, mappings };
        localStorage.setItem(GAMEPAD_LAYOUT_KEY, JSON.stringify(this.current_layout));
    }

    public get_current_layout(): gamepad_layout {
        return this.current_layout;
    }

    public get_available_layouts(): gamepad_layout[] {
        return default_gamepad_layouts;
    }

    private setup_event_listeners(): void {
        window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
            console.log(`Gamepad connected: ${e.gamepad.id}`);
            this.connected_gamepads.add(e.gamepad.index);
        });

        window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
            console.log(`Gamepad disconnected: ${e.gamepad.id}`);
            this.connected_gamepads.delete(e.gamepad.index);
        });
    }

    private translate_button(button_index: number): Key | null {
        return this.current_layout.mappings[button_index] || null;
    }

    private handle_analog_triggers(gamepad: Gamepad, key_states: boolean[], gamepad_index: number, current_time: number): void {
        const l2Button = gamepad.buttons[BUTTON.L2];
        const r2Button = gamepad.buttons[BUTTON.R2];

        if (l2Button) {
            const is_pressed = l2Button.value > 0.5;
            const was_pressed = this.previous_button_states[gamepad_index][BUTTON.L2];

            if (is_pressed && !was_pressed) {
                const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][BUTTON.L2];
                if (time_since_last_press >= DEBOUNCE_TIME) {
                    key_states[Key.L2] = true;
                    this.button_debounce_times[gamepad_index][BUTTON.L2] = current_time;
                } else {
                    key_states[Key.L2] = false;
                }
            } else if (is_pressed) {
                key_states[Key.L2] = true;
            } else {
                key_states[Key.L2] = false;
            }
        }

        if (r2Button) {
            const is_pressed = r2Button.value > 0.5;
            const was_pressed = this.previous_button_states[gamepad_index][BUTTON.R2];

            if (is_pressed && !was_pressed) {
                const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][BUTTON.R2];
                if (time_since_last_press >= DEBOUNCE_TIME) {
                    key_states[Key.R2] = true;
                    this.button_debounce_times[gamepad_index][BUTTON.R2] = current_time;
                } else {
                    key_states[Key.R2] = false;
                }
            } else if (is_pressed) {
                key_states[Key.R2] = true;
            } else {
                key_states[Key.R2] = false;
            }
        }
    }

    private handle_analog_sticks(gamepad: Gamepad, key_states: boolean[], gamepad_index: number, current_time: number): void {
        const left_x = gamepad.axes[0];
        const left_y = gamepad.axes[1];

        const is_up = left_y < -DEADZONE;
        const is_down = left_y > DEADZONE;
        const is_left = left_x < -DEADZONE;
        const is_right = left_x > DEADZONE;

        const DPAD_UP_STATE = 16;
        const DPAD_DOWN_STATE = 17;
        const DPAD_LEFT_STATE = 18;
        const DPAD_RIGHT_STATE = 19;

        const prev_up = this.previous_button_states[gamepad_index][DPAD_UP_STATE];
        const prev_down = this.previous_button_states[gamepad_index][DPAD_DOWN_STATE];
        const prev_left = this.previous_button_states[gamepad_index][DPAD_LEFT_STATE];
        const prev_right = this.previous_button_states[gamepad_index][DPAD_RIGHT_STATE];

        if (is_up && !prev_up) {
            const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][DPAD_UP_STATE];
            key_states[Key.Up] = time_since_last_press >= DEBOUNCE_TIME;
            if (time_since_last_press >= DEBOUNCE_TIME) {
                this.button_debounce_times[gamepad_index][DPAD_UP_STATE] = current_time;
            }
        } else {
            key_states[Key.Up] = false;
        }

        if (is_down && !prev_down) {
            const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][DPAD_DOWN_STATE];
            key_states[Key.Down] = time_since_last_press >= DEBOUNCE_TIME;
            if (time_since_last_press >= DEBOUNCE_TIME) {
                this.button_debounce_times[gamepad_index][DPAD_DOWN_STATE] = current_time;
            }
        } else {
            key_states[Key.Down] = false;
        }

        if (is_left && !prev_left) {
            const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][DPAD_LEFT_STATE];
            key_states[Key.Left] = time_since_last_press >= DEBOUNCE_TIME;
            if (time_since_last_press >= DEBOUNCE_TIME) {
                this.button_debounce_times[gamepad_index][DPAD_LEFT_STATE] = current_time;
            }
        } else {
            key_states[Key.Left] = false;
        }

        if (is_right && !prev_right) {
            const time_since_last_press = current_time - this.button_debounce_times[gamepad_index][DPAD_RIGHT_STATE];
            key_states[Key.Right] = time_since_last_press >= DEBOUNCE_TIME;
            if (time_since_last_press >= DEBOUNCE_TIME) {
                this.button_debounce_times[gamepad_index][DPAD_RIGHT_STATE] = current_time;
            }
        } else {
            key_states[Key.Right] = false;
        }

        this.previous_button_states[gamepad_index][DPAD_UP_STATE] = is_up;
        this.previous_button_states[gamepad_index][DPAD_DOWN_STATE] = is_down;
        this.previous_button_states[gamepad_index][DPAD_LEFT_STATE] = is_left;
        this.previous_button_states[gamepad_index][DPAD_RIGHT_STATE] = is_right;
    }

    public update(key_states: boolean[]): void {
        const current_time = performance.now();

        if (this.connected_gamepads.size === 0) {
            if (current_time - this.last_discovery_poll < this.discovery_poll_interval) {
                return;
            }
            this.last_discovery_poll = current_time;

            const probe = navigator.getGamepads();
            for (let i = 0; i < probe.length; i++) {
                const gp = probe[i];
                if (gp && gp.connected) {
                    this.connected_gamepads.add(gp.index);
                }
            }

            if (this.connected_gamepads.size === 0) {
                return;
            }
        }

        const gamepads = navigator.getGamepads();

        this.digital_dpad_states.fill(false);

        for (const i of Array.from(this.connected_gamepads)) {
            const gamepad = gamepads[i];
            if (!gamepad || !gamepad.connected) {
                this.connected_gamepads.delete(i);
                continue;
            }

            if (!this.previous_button_states[i]) this.previous_button_states[i] = [];
            if (!this.button_debounce_times[i]) this.button_debounce_times[i] = [];

            while (this.previous_button_states[i].length < gamepad.buttons.length) {
                this.previous_button_states[i].push(false);
                this.button_debounce_times[i].push(0);
            }

            while (this.previous_button_states[i].length < 20) {
                this.previous_button_states[i].push(false);
                this.button_debounce_times[i].push(0);
            }

            for (let button_index = 0; button_index < gamepad.buttons.length; button_index++) {
                const button = gamepad.buttons[button_index];
                const key = this.translate_button(button_index);

                if (key !== null) {
                    const is_pressed = button.pressed;
                    const was_pressed = this.previous_button_states[i][button_index];

                    const is_dpad_button =
                        button_index === BUTTON.DPAD_UP ||
                        button_index === BUTTON.DPAD_DOWN ||
                        button_index === BUTTON.DPAD_LEFT ||
                        button_index === BUTTON.DPAD_RIGHT;

                    if (is_dpad_button) {
                        if (is_pressed && !was_pressed) {
                            const time_since_last_press = current_time - this.button_debounce_times[i][button_index];

                            if (time_since_last_press >= DEBOUNCE_TIME) {
                                this.digital_dpad_states[key] = true;
                                this.button_debounce_times[i][button_index] = current_time;
                            } else {
                                this.digital_dpad_states[key] = false;
                            }
                        } else {
                            this.digital_dpad_states[key] = false;
                        }
                    } else {
                        if (is_pressed && !was_pressed) {
                            const time_since_last_press = current_time - this.button_debounce_times[i][button_index];

                            if (time_since_last_press >= DEBOUNCE_TIME) {
                                key_states[key] = true;
                                this.button_debounce_times[i][button_index] = current_time;
                            } else {
                                key_states[key] = false;
                            }
                        } else {
                            key_states[key] = false;
                        }
                    }

                    this.previous_button_states[i][button_index] = is_pressed;
                }
            }

            this.handle_analog_triggers(gamepad, key_states, i, current_time);

            this.handle_analog_sticks(gamepad, key_states, i, current_time);
        }

        key_states[Key.Up] = this.digital_dpad_states[Key.Up] || key_states[Key.Up];
        key_states[Key.Down] = this.digital_dpad_states[Key.Down] || key_states[Key.Down];
        key_states[Key.Left] = this.digital_dpad_states[Key.Left] || key_states[Key.Left];
        key_states[Key.Right] = this.digital_dpad_states[Key.Right] || key_states[Key.Right];
    }

    public is_any_gamepad_connected(): boolean {
        return this.connected_gamepads.size > 0;
    }

    public get_connected_gamepad_count(): number {
        return this.connected_gamepads.size;
    }

    public get_current_gamepad_info(): { id: string } | null {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && gamepad.connected) {
                return { id: gamepad.id };
            }
        }
        return null;
    }

    public get_current_button_states(): boolean[] {
        const gamepads = navigator.getGamepads();
        const button_states: boolean[] = [];
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad || !gamepad.connected) continue;
            
            for (let button_index = 0; button_index < gamepad.buttons.length; button_index++) {
                button_states[button_index] = gamepad.buttons[button_index].pressed;
            }
            
            const left_x = gamepad.axes[0];
            const left_y = gamepad.axes[1];
            button_states[16] = left_y < -DEADZONE;
            button_states[17] = left_y > DEADZONE;
            button_states[18] = left_x < -DEADZONE;
            button_states[19] = left_x > DEADZONE;
            
            break;
        }
        
        return button_states;
    }
}

export const gamepad_manager_instance = new gamepad_manager();