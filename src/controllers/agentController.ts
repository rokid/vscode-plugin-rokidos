"use strict";

import * as vscode from "vscode";
import prompts from "../helper/prompts";
import { BaseController } from "./baseController";
import { ResponseStore } from "../helper/responseStore";
const fs = require("fs");

export class AgentController extends BaseController {
  public constructor() {
    super();
  }
  public async login() {
    let username = await prompts.string("Enter your usernmae");
    let password = await prompts.password("Enter your password");
    let status = null;
    if (username && password) {
      const response = await this._agent.login(username, password);
      status = response.status;
    }
    vscode.window.showInformationMessage(
      status === 201 ? "Login Success!" : "Login Failure!"
    );
  }
  public async setDefaultSkill() {
    const skillResp = await this.pickupSkill();
    const skill = skillResp.data;
    let msg = "Set Default Skill Failure";
    if (skill) {
      await this._agent.setDefaultSkill(skill);
      msg = "Set Default Skill Success";
    }
    vscode.window.showInformationMessage(msg);
  }
  public async getSkillByAppId() {
    const skillResp = await this.pickupSkill();
    let previewUri = this.generatePreviewUri();
    ResponseStore.add(previewUri.toString(), { resp: skillResp });
    this.quickPreviewResponse(previewUri);
  }
  public async uploadIntents() {
    let curFilePath = "";
    if (vscode.window.activeTextEditor !== undefined) {
      curFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
    }
    const curFileContent = fs.readFileSync(curFilePath, "utf-8");

    const id = await this.pickupSkillID();
    const autoCompile = await prompts.pickup(
      ["No", "Yes"],
      "Select your skill id"
    );
    await this._agent.uploadIntents(
      id,
      curFileContent,
      autoCompile === "Yes" ? true : false
    );
    vscode.window.showInformationMessage(curFileContent);
    return curFileContent;
  }
  public async compile() {
    const skill = await this.pickupSkill();
    const result = await this._agent.compile(skill.data.domainId);
    vscode.window.showInformationMessage(result ? "Success" : "Failure");
  }
}
