const TOGGLE_KEY = "t"

class EmoteWheel {
        constructor() {
                this.wheel = document.getElementById('emote-wheel');
                this.is_open = false;
                this.cursor_x = 0;
                this.cursor_y = 0;
                this.init_buttons();
                this.bind_events();
        }


        init_buttons() {
                const radius = 35;
                const center_x = 50;
                const center_y = 42;
                const start_angle = -90;

                this.emote_slots = document.querySelectorAll('.emote-slot');
                const total_emotes = this.emote_slots.length;

                this.emote_slots.forEach((emote, index) => {
                        const angle_in_degrees = start_angle + (index * 360 / total_emotes);
                        const angle_in_radians = (angle_in_degrees * Math.PI) / 180;

                        const x = center_x + radius * Math.cos(angle_in_radians);
                        const y = center_y + radius * Math.sin(angle_in_radians);

                        emote.style.top = `${y}%`;
                        emote.style.left = `${x}%`;
                });
        }

        bind_events() {
                document.addEventListener("keydown", (e) => {
                        if (!this.is_open && e.key.toLowerCase() === TOGGLE_KEY) {
                                this.open()
                        }
                });

                document.addEventListener("keyup", (e) => {
                        if (this.is_open && e.key.toLowerCase() === TOGGLE_KEY) {
                                this.close()
                        }
                });

                document.addEventListener('mousemove', (e) => this.handle_mouse_move(e));
        }

        clear_selection() {
                this.emote_slots.forEach(s => s.classList.remove('active'));
                this.active_emote = null
        }

        handle_mouse_move(e) {
                this.cursor_x = e.clientX;
                this.cursor_y = e.clientY;

                if (!this.is_open) return;

                const mouse_x = e.clientX;
                const mouse_y = e.clientY;

                const delta_x = mouse_x - this.center_x;
                const delta_y = mouse_y - this.center_y;
                const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y);

                if (distance < 40) {
                        this.clear_selection();
                        return;
                }

                let angle = Math.atan2(delta_y, delta_x) * (180 / Math.PI);
                angle = (angle + 90) % 360;
                if (angle < 0) angle += 360;

                const sector_size = 360 / 8;
                const sector_index = Math.floor((angle + sector_size / 2) % 360 / sector_size);

                this.clear_selection();

                const target_emote = this.emote_slots[sector_index];

                if (target_emote) {
                        target_emote.classList.add('active');
                }

                this.active_emote = target_emote;
        }

        open() {
                this.is_open = true;

                const wheel_size = 300;
                const half_size = wheel_size / 2;

                const vw_w = window.innerWidth;
                const vw_h = window.innerHeight;

                let wheel_x = this.cursor_x;
                let wheel_y = this.cursor_y;

                if (wheel_x - half_size < 0) wheel_x = half_size;
                if (wheel_x + half_size > vw_w) wheel_x = vw_w - half_size;
                if (wheel_y - half_size < 0) wheel_y = half_size;
                if (wheel_y + half_size > vw_h) wheel_y = vw_h - half_size;

                this.wheel.classList.add('active');

                this.wheel.style.left = wheel_x + 'px';
                this.wheel.style.top = wheel_y + 'px';

                const rect = this.wheel.getBoundingClientRect();

                this.center_x = rect.left + rect.width / 2;
                this.center_y = rect.top + rect.height / 2;
        }

        close() {
                this.is_open = false;

                this.wheel.classList.remove('active');

                if (this.active_emote) {
                        window.dispatchEvent(new CustomEvent('doidle', {
                                detail: {
                                        id: this.active_emote.dataset.id
                                }
                        }));
                }

                this.clear_selection();
        }
}

if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => new EmoteWheel());
} else {
        new EmoteWheel();
}