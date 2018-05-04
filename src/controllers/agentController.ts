"use strict";

import * as vscode from "vscode";
import prompts from "../helper/prompts";
import { BaseController } from "./baseController";
import { ResponseStore } from "../helper/responseStore";
import { ConfigStore } from "../helper/configStore";
const fs = require("fs");
const path = require("path");

export class AgentController extends BaseController {
  public constructor() {
    super();
  }
  public async login() {
    let username = await prompts.string("Enter your username");
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
    this._agent.execBefore();
    if (!this.statusLoginAndSetDefault()) {
      return;
    }
    const intentsFile = path.join(
      vscode.workspace.rootPath,
      ConfigStore._config.files.intents
    );
    const exists = fs.existsSync(intentsFile);
    if (!exists) {
      vscode.window.showErrorMessage("Intents file does not exist.");
      return;
    }
    const curFileContent = fs.readFileSync(intentsFile, "utf-8");
    const curFile = JSON.parse(curFileContent);
    const autoCompile = await prompts.pickup(
      ["No", "Yes"],
      "Do you want auto complie?"
    );
    const intentsUploadResp = await this._agent.uploadIntents(
      ConfigStore._config.skill.appId,
      curFile,
      autoCompile === "Yes" ? true : false
    );
    vscode.window.showInformationMessage(
      intentsUploadResp.status === 201 ? "Success" : "Failure"
    );
  }
  public async compile() {
    const skill = await this.pickupSkill();
    const result = await this._agent.compile(skill.data.domainId);
    vscode.window.showInformationMessage(result ? "Success" : "Failure");
  }
}
