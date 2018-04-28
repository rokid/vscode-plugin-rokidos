import * as vscode from "vscode";

export function pickup(
  options: string[],
  placeHolder: string
): Promise<string | null> {
  return vscode.window.showQuickPick(options, {
    ignoreFocusOut: true,
    placeHolder
  }) as Promise<string | null>;
}

export function string(prompt: string): Promise<string | null> {
  return vscode.window.showInputBox({
    ignoreFocusOut: true,
    password: false,
    prompt
  }) as Promise<string | null>;
}

export function password(prompt: string): Promise<string | null> {
  return vscode.window.showInputBox({
    ignoreFocusOut: true,
    password: true,
    prompt
  }) as Promise<string | null>;
}

export default {
  pickup,
  string,
  password
};
