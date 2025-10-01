import { spawnSync } from "child_process";

export function try_spawn_process(cmd, process_args, spawn_args = {}) {
        // ffmpeg outputs all logs to `stderr`, which makes it impossible
        // for us to determine whether or not the command failed.
        // this makes it so that ffmpeg only logs errors.
        if (cmd === "ffmpeg") {
                process_args = ["-y", "-loglevel", "error", ...process_args];
        }

        console.log(`Running command: "${cmd} ${process_args.join(" ")}"`);

        const result = spawnSync(
                cmd,
                process_args,
                { ...spawn_args, stdio: ["inherit", "inherit", "pipe"], encoding: "utf-8" }
        );

        if (result.stderr) {
                console.log(result.stderr);
                process.exit();
        }

        if (result.error) {
                console.log(result.error);
                process.exit();
        }

        console.log("\n================ Success ==================\n");
}
