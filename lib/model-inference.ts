import { spawn } from "node:child_process";
import path from "node:path";

export type ModelRow = Record<string, string | number | null>;

export type ModelResult = {
  distress_probability: number;
  prediction: number;
  top_factors: Array<{ feature: string; impact: number }>;
};

export async function runSentinelModel(rows: ModelRow[]): Promise<ModelResult> {
  const projectRoot = process.cwd();
  const script = path.join(projectRoot, "scripts", "predict_financial_distress.py");
  const modelDirectory = path.join(projectRoot, "models", "financial_distress");
  return new Promise((resolve, reject) => {
    const process = spawn("python", [script, "--model-dir", modelDirectory], {
      cwd: projectRoot,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    process.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    process.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    process.on("error", reject);
    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Model process exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as ModelResult);
      } catch {
        reject(new Error("Model returned invalid JSON"));
      }
    });
    process.stdin.end(JSON.stringify(rows));
  });
}