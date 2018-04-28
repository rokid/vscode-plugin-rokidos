"use strict";

import * as vscode from "vscode";
import prompts from "../helper/prompts";
import { ResponseStore } from "../helper/responseStore";
import { ConfigStore } from "../helper/configStore";
import * as Constants from "../constants";
import { BaseController } from "./baseController";

export class DebugController extends BaseController {
  public constructor() {
    super();
  }
  public async testIntents() {
    this._agent.execBefore();
    if (!this.statusLoginAndSetDefault()) {
      return;
    }
    const sentence = await prompts.pickup(
      ConfigStore._config.sentences,
      "Select your sentence"
    );
    if (sentence) {
      const intentsResp = await this._agent.testIntents(
        ConfigStore._config.skill.appId,
        sentence
      );
      const intents = intentsResp.data;
      let previewUri = this.generatePreviewUri();
      ResponseStore.add(previewUri.toString(), {
        resp: intentsResp,
        data: {
          nlp: JSON.parse(intents["nlp"])
        }
      });
      this.quickPreviewResponse(previewUri);
    }
  }
  public async testNlp() {
    this._agent.execBefore();
    if (!this.statusLoginAndSetDefault()) {
      return;
    }
    const sentence = await prompts.pickup(
      ConfigStore._config.sentences,
      "Select your sentence"
    );
    if (sentence) {
      const nlpResp = await this._agent.testNlp(
        ConfigStore._config.skill.appId,
        sentence
      );
      const nlp = nlpResp.data;
      let previewUri = this.generatePreviewUri();
      ResponseStore.add(previewUri.toString(), {
        resp: nlpResp,
        data: {
          request: JSON.parse(nlp["request"]),
          response: JSON.parse(nlp["response"])
        }
      });
      this.quickPreviewResponse(previewUri);
    }
  }
  // Just for playground
  public async sayRokidResponse() {
    return vscode.commands
      .executeCommand(
        "vscode.previewHtml",
        vscode.Uri.parse(Constants.RokidResponsePreviewUrl),
        vscode.ViewColumn.Two,
        Constants.RokidResponsePreviewTitle
      )
      .then(
        success => {},
        reason => {
          vscode.window.showErrorMessage(reason);
        }
      );
  }
}
