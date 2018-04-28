"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AgentController } from "./controllers/agentController";
import { DebugController } from "./controllers/debugController";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-plugin-rokidos" is now active!'
  );

  let agentController = new AgentController();
  context.subscriptions.push(
    vscode.commands.registerCommand("rokid.rfs.agent.login", () =>
      agentController.login()
    ),
    vscode.commands.registerCommand("rokid.rfs.agent.setDefaultSkill", () =>
      agentController.setDefaultSkill()
    ),
    vscode.commands.registerCommand("rokid.rfs.agent.getSkillByAppId", () =>
      agentController.getSkillByAppId()
    ),
    vscode.commands.registerCommand("rokid.rfs.agent.uploadIntents", () =>
      agentController.uploadIntents()
    ),
    vscode.commands.registerCommand("rokid.rfs.agent.sayPathInfo", () =>
      agentController.sayPathInfo()
    )
  );

  let debugController = new DebugController();
  context.subscriptions.push(
    vscode.commands.registerCommand("rokid.rfs.debug.testNlp", () =>
      debugController.testNlp()
    ),
    vscode.commands.registerCommand("rokid.rfs.debug.testIntents", () =>
      debugController.testIntents()
    ),
    vscode.commands.registerCommand("rokid.rfs.debug.sayRokidResponse", () =>
      debugController.sayRokidResponse()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
