"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { RequestController } from "./controllers/requestController";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-plugin-rokidos" is now active!'
  );

  let requestController = new RequestController();
  context.subscriptions.push(
    vscode.commands.registerCommand("rokid.rfs.login", () =>
      requestController.login()
    ),
    vscode.commands.registerCommand("rokid.rfs.setDefaultSkill", () =>
      requestController.setDefaultSkill()
    ),
    vscode.commands.registerCommand("rokid.rfs.getSkillByAppId", () =>
      requestController.getSkillByAppId()
    ),
    vscode.commands.registerCommand("rokid.rfs.uploadIntents", () =>
      requestController.uploadIntents()
    ),
    vscode.commands.registerCommand("rokid.rfs.testIntents", () =>
      requestController.testIntents()
    ),
    vscode.commands.registerCommand("rokid.rfs.sayHello", () =>
      requestController.sayHello()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
