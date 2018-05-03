"use strict";

import * as vscode from "vscode";
import { AxiosResponse } from "axios";
const fs = require("fs");
const path = require("path");

let getConfigFilePath = function(): string {
  return path.join(vscode.workspace.rootPath, ".vscode", "rokid.setting.json");
};

export class ConfigStore {
  public static _file = getConfigFilePath();
  public static _config = {
    account_endpoint: "https://account.rokid.com",
    skill_endpoint: "https://developer.rokid.com",
    rfs_endpoint: "https://developer-rfs.rokid.com",
    sentences: new Array<string>(),
    files: {
      rfs: "dist/rfs.js",
      intents: "src/intents.json"
    },
    test_case_skeleton: {
      context: {
        application: {
          applicationId: ""
        },
        device: {
          location: {},
          media: {},
          timestamp: 0
        },
        user: {}
      },
      request: {
        content: {},
        reqId: "",
        reqType: "INTENT"
      },
      session: {
        attributes: {},
        newSession: true
      },
      version: "2.0.0"
    },
    user: {
      username: "",
      cookies: new Array<string>()
    },
    skill: {
      appId: ""
    },
    rfs: {
      jsGroupId: "",
      jsInfoId: "",
      jsTestCaseId: ""
    },
    intents: {}
  };

  public static reload() {
    var exists = fs.existsSync(path.dirname(this._file));
    if (!exists) {
      fs.mkdirSync(path.dirname(this._file));
    }
    var profileExists = fs.existsSync(this._file);
    if (!profileExists) {
      fs.writeFileSync(this._file, "{}");
    }
    var dataStr = fs.readFileSync(this._file, "utf-8");
    var data = JSON.parse(dataStr);
    this._config = Object.assign({}, this._config, data);
  }

  public static save() {
    fs.writeFileSync(this._file, JSON.stringify(this._config, null, "\t"));
  }

  public static procResponse(response?: AxiosResponse) {
    if (response) {
      console.log(response);
      this._config.user.cookies = this._config.user.cookies.concat(
        this._config.user.cookies,
        response.headers["set-cookie"]
      );

      let cookieObj = new Map<string, string>();
      if (this._config.user.cookies instanceof Array) {
        this._config.user.cookies.map(val => {
          if (val) {
            let curlSplit = val.split("=").reduce((pre, cur) => {
              if (cur.length > 0) {
                pre.push(cur);
              }
              return pre;
            }, new Array<string>());
            if (curlSplit.length >= 2) {
              cookieObj.set(curlSplit[0], curlSplit.slice(1).join("="));
            }
          }
        });
      }
      let cookieRes = new Array<string>();
      cookieObj.forEach((val, key) => {
        cookieRes.push([key, val].join("="));
      });
      this._config.user.cookies = cookieRes;
    }
    this.save();
  }

  public static getCookies() {
    return this._config.user.cookies
      ? this._config.user.cookies.join("; ")
      : "";
  }
}
