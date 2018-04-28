"use strict";

import * as vscode from "vscode";
import prompts from "../helper/prompts";
import { Agent } from "../helper/agent";
import { ConfigStore } from "../helper/configStore";
import { RokidResponseDocumentContentProvider } from "../views/rokidResponseDocumentContentProvider";
import * as Constants from "../constants";
const path = require("path");

export class BaseController {
  private _registration: vscode.Disposable;
  protected _agent: Agent;
  public constructor() {
    this._registration = vscode.workspace.registerTextDocumentContentProvider(
      "rokid-response",
      new RokidResponseDocumentContentProvider()
    );
    this._agent = new Agent();
  }
  public dispose() {
    this._registration.dispose();
  }
  // ensure
  protected statusLoginAndSetDefault() {
    if (
      !ConfigStore._config.user.username ||
      ConfigStore._config.user.username.length <= 0
    ) {
      vscode.window.showInformationMessage("Please login rokid.");
      return false;
    }
    if (
      !ConfigStore._config.skill.appId ||
      ConfigStore._config.skill.appId.length <= 0
    ) {
      vscode.window.showInformationMessage("Please set default skill.");
      return false;
    }
    return true;
  }
  // businesses
  protected async pickupSkillID() {
    const skills = await this._agent.listSkills();
    const pickupRes = await prompts.pickup(
      skills.data.list.map((skill: any) => {
        return [skill.name, skill.appId].join(" - ");
      }),
      "Select your skill id"
    );
    if (pickupRes === null) {
      return null;
    } else {
      const skillID = pickupRes.split(" - ").pop();
      return skillID === undefined ? null : skillID;
    }
  }
  protected async pickupSkill() {
    const id = await this.pickupSkillID();
    return await this._agent.getSkillByAppId(id);
  }
  // helpers
  protected generatePreviewUri(): vscode.Uri {
    let uriString = Constants.RokidResponsePreviewUrl;
    uriString += `/${Date.now()}`;
    uriString += ".html";
    return vscode.Uri.parse(uriString);
  }
  protected quickPreviewResponse(uri: vscode.Uri) {
    vscode.commands
      .executeCommand(
        "vscode.previewHtml",
        uri,
        vscode.ViewColumn.Two,
        "Rokid Result Preview"
      )
      .then(
        success => {},
        reason => {
          vscode.window.showErrorMessage(reason);
        }
      );
  }
  // Helpers
  // just for test
  public async sayPathInfo() {
    if (vscode.window.activeTextEditor !== undefined) {
      console.log(vscode.window.activeTextEditor.document.uri);
    }
    console.log(
      path.join(vscode.workspace.rootPath, ".vscode", "rokid.setting.json")
    );
    console.log(
      vscode.workspace.getConfiguration(
        "main",
        path.join(vscode.workspace.rootPath, ".vscode", "rokid.setting.json")
      )
    );
    vscode.window.showInformationMessage("Hello World!");
    // const file = "rokid-response://authority/rokid-response";
    console.log(vscode.Uri.parse(Constants.RokidResponsePreviewUrl));
    console.log("[extensions]", vscode.extensions.all);
  }
}
