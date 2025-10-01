
class Console {
        constructor() {
                this.modal = document.getElementById("console-modal")
                this.messages = []

                this.bind_events();
        }

        open() {
                const elem = document.getElementById("console-export-fail-msg")
                elem.style.display = "none"

                this.modal.classList.add('show');
                document.body.style.overflow = "hidden";

                this.update_modal_content()
        }

        close() {
                this.modal.classList.remove("show");
                document.body.style.overflow = "auto";
        }

        update_console_button() {
                const badge = document.getElementById('console-badge');

                const count = this.messages.length;
                if (count > 0) {
                        badge.textContent = count;
                        badge.style.display = 'inline-block';
                } else {
                        badge.style.display = 'none';
                }
        }

        bind_events() {
                document.addEventListener("click", (e) => {
                        if (e.target.closest("#console-button")) {
                                this.open();
                        }

                        if (e.target === this.modal) {
                                this.close();
                        }

                        if (e.target.closest("#console-clear-button")) {
                                this.clear_log()
                        }

                        if (e.target.closest("#console-export-button")) {
                                this.export_logs()
                        }
                })

                const o_error = console.error;
                const o_warn = console.warn;

                console.error = (...args) => {
                        o_error.apply(console, args);

                        const message = args.map(arg =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' ');

                        this.messages.push({
                                type: 'error',
                                message: message,
                                timestamp: new Date()
                        });

                        this.update_console_button();
                        this.update_modal_content();
                };

                console.warn = (...args) => {
                        o_warn.apply(console, args);

                        const message = args.map(arg =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' ');

                        this.messages.push({
                                type: 'warn',
                                message: message,
                                timestamp: new Date()
                        });

                        this.update_console_button();
                        this.update_modal_content();
                };

                window.addEventListener('error', (event) => {
                        let message = `${event.message}`;
                        if (event.filename) {
                                message += `\n  at ${event.filename}:${event.lineno}:${event.colno}`;
                        }
                        if (event.error && event.error.stack) {
                                message += `\n${event.error.stack}`;
                        }

                        this.messages.push({
                                type: 'error',
                                message: `[Uncaught Error] ${message}`,
                                timestamp: new Date()
                        });

                        this.update_console_button();
                        this.update_modal_content();
                });

                window.addEventListener('unhandledrejection', (event) => {
                        let message = 'Unhandled Promise Rejection';
                        if (event.reason) {
                                if (event.reason instanceof Error) {
                                        message += `\n${event.reason.message}`;
                                        if (event.reason.stack) {
                                                message += `\n${event.reason.stack}`;
                                        }
                                } else {
                                        message += `\n${String(event.reason)}`;
                                }
                        }

                        this.messages.push({
                                type: 'error',
                                message: `[Promise Rejection] ${message}`,
                                timestamp: new Date()
                        });

                        this.update_console_button();
                        this.update_modal_content();
                });
        }

        export_logs() {
                if (this.messages.length === 0) {
                        const elem = document.getElementById("console-export-fail-msg")
                        elem.style.display = "block"
                        elem.innerText = "ERROR: no logs found"
                        return;
                }

                const log_text = this.messages.map(msg => {
                        const timestamp = msg.timestamp.toLocaleString();
                        const type = msg.type.toUpperCase();
                        return `[${timestamp}] ${type}: ${msg.message}`;
                }).join('\n\n');

                const blob = new Blob([log_text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `console-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
        }

        update_modal_content() {
                const content = document.getElementById('console-modal-content');

                if (this.messages.length === 0) {
                        content.innerHTML = '<div class="empty-state">No console messages yet.</div>';
                        return;
                }

                const html = this.messages.map(msg => `
            <div class="console-log-entry ${msg.type}">
                <div class="console-log-timestamp">${msg.timestamp.toLocaleString()}</div>
                <span class="console-log-type ${msg.type}">${msg.type.toUpperCase()}</span>
                <div class="console-log-message">${this.escape_html(msg.message)}</div>
            </div>
        `).join('');

                content.innerHTML = html;
                content.scrollTop = content.scrollHeight;
        }

        escape_html(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
        }

        clear_log() {
                this.messages = [];
                this.update_console_button();
                this.update_modal_content();
        }
}

if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => new Console());
} else {
        new Console();
}