import ora from "ora";
import chalk from "chalk";

export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function withSpinner<T>(
  message: string,
  fn: (spinner: ReturnType<typeof ora>) => Promise<T>
): Promise<T> {
  const spinner = ora(message).start();
  try {
    const result = await fn(spinner);
    return result;
  } catch (err) {
    spinner.fail(chalk.red(getErrorMessage(err, "Something went wrong")));
    process.exit(1);
  }
}
