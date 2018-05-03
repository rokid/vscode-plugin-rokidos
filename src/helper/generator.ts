"use strict";

import { ConfigStore } from "./configStore";

export class Generator {
  // for POST https://developer-rfs.rokid.com/skill/test/save.do
  public static testCaseSaveBody(nlp: any) {
    return {
      jsInfoId: ConfigStore._config.rfs.jsInfoId,
      jsTestCaseId: ConfigStore._config.rfs.jsTestCaseId,
      testCaseInfo: JSON.stringify(
        Object.assign(ConfigStore._config.test_case_skeleton, {
          context: {
            application: {
              applicationId: ConfigStore._config.rfs.jsInfoId
            },
            request: {
              content: nlp,
              reqId: ConfigStore._config.rfs.jsInfoId
            }
          }
        })
      )
    };
  }
}
