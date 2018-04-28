"use strict";

import * as vscode from "vscode";
import prompts from "../helper/prompts";
import { Agent } from "../helper/agent";
const path = require("path");
const fs = require("fs");

export class RequestController {
  _configAgent: string;
  _configSetting: string;
  _agent: Agent;
  public constructor() {
    this._configAgent = path.join(
      vscode.workspace.rootPath,
      ".vscode",
      "rokid.agent.json"
    );
    this._configSetting = path.join(
      vscode.workspace.rootPath,
      ".vscode",
      "rokid.setting.json"
    );

    var configSettingFileExists = fs.existsSync(this._configSetting);
    if (!configSettingFileExists) {
      fs.writeFileSync(
        this._configSetting,
        JSON.stringify(
          {
            sentences: []
          },
          null,
          "\t"
        )
      );
    }

    this._agent = new Agent(this._configAgent);
  }
  public async login() {
    let username = await prompts.string("Enter your usernmae");
    let password = await prompts.password("Enter your password");
    const response = await this._agent.login(username, password);
    vscode.window.showInformationMessage(
      response.status === 201 ? "Login Success!" : "Login Failure!"
    );
  }
  public async setDefaultSkill() {
    const skill = await this.pickupSkill();
    let msg = "Set Default Skill Failure";
    if (skill) {
      await this._agent.setDefaultSkill(skill);
      msg = "Set Default Skill Success";
    }
    vscode.window.showInformationMessage(msg);
  }
  public async testIntents() {
    const id = await this.pickupSkillID();
    const settingStr = fs.readFileSync(this._configSetting, "utf-8");
    const setting = JSON.parse(settingStr);
    const sentence = await prompts.pickup(
      setting.sentences,
      "Select your sentence"
    );
    const result = await this._agent.testIntents(id, sentence);
    console.log(JSON.stringify(JSON.parse(result.nlp), null, "\t"));
    vscode.window.showInformationMessage(result);
  }
  public async getSkillByAppId() {
    const skill = await this.pickupSkill();
    console.log(skill);
    vscode.window.showInformationMessage(skill);
    return skill;
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
    const result = await this._agent.compile(skill.domainId);
    vscode.window.showInformationMessage(result ? "Success" : "Failure");
  }
  public async sayHello() {
    if (vscode.window.activeTextEditor !== undefined) {
      console.log(vscode.window.activeTextEditor.document.uri);
    }
    console.log(path.join(vscode.workspace.rootPath, ".vscode", "rokid.setting.json"));
    console.log(
      vscode.workspace.getConfiguration(
        "main",
        path.join(vscode.workspace.rootPath, ".vscode", "rokid.setting.json")
      )
    );
    vscode.window.showInformationMessage("Hello World!");
  }
  private async pickupSkillID() {
    const skills = await this._agent.listSkills();
    const pickupRes = await prompts.pickup(
      skills.list.map((skill: any) => {
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
  private async pickupSkill() {
    const id = await this.pickupSkillID();
    return await this._agent.getSkillByAppId(id);
  }
}
