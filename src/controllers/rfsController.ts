"use strict";

import prompts from "../helper/prompts";
import { ResponseStore } from "../helper/responseStore";
import { ConfigStore } from "../helper/configStore";
import { Generator } from "../helper/generator";
import { BaseController } from "./baseController";

export class RfsController extends BaseController {
  public constructor() {
    super();
  }
  public async saveTestCase() {
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
      const testCase = Generator.testCaseSaveBody(JSON.parse(intents["nlp"]));
      const saveResp = await this._agent.saveTestCase(testCase);
      const previewUriSave = this.generatePreviewUri();
      ResponseStore.add(previewUriSave.toString(), {
        resp: saveResp
      });
      this.quickPreviewResponse(previewUriSave);
    }
  }
}
