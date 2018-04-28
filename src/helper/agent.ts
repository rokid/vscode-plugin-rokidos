"use strict";

import axios, { AxiosInstance, AxiosResponse } from "axios";

const fs = require("fs");
const ora = require("ora");
const crypto = require("crypto");
const path = require("path");

export class Agent {
  _configPath: string;
  _configFile: string;
  _config: any;
  $skillHttp: AxiosInstance;
  $rfsHttp: AxiosInstance;
  public constructor(configFile: string) {
    this._configPath = path.dirname(configFile);
    this._configFile = configFile;
    this._config = {
      account_endpoint: "https://account.rokid.com",
      skill_endpoint: "https://developer.rokid.com",
      rfs_endpoint: "https://developer-rfs.rokid.com",
      prefix: "/skill",
      user: {
        username: "",
        cookies: [],
        skill: {},
        rfs: {},
        intents: {}
      }
    };
    this.loadConfig();

    this.$skillHttp = axios.create({
      baseURL: this._config.skill_endpoint,
      withCredentials: true,
      headers: {
        cookie: this._config.user.cookies.join("; ")
      }
    });
    this.$rfsHttp = axios.create({
      baseURL: this._config.rfs_endpoint,
      withCredentials: true,
      headers: {
        cookie: this._config.user.cookies.join("; ")
      }
    });
  }
  public async login(username: string | null, password: string | null) {
    await this.execBefore();
    const body = {
      userName: username,
      password: crypto
        .createHash("md5")
        .update(password)
        .digest("hex")
    };
    const response = await axios.post(
      `${this._config.account_endpoint}/login.do`,
      body
    );
    this._config.user.username = username;
    await this.execAfter(response);
    return response;
  }
  public async listSkills() {
    await this.execBefore();
    const response = await this.$skillHttp.get(
      "/skill/apps.do?page_num=1&page_size=20"
    );
    await this.execAfter(response);
    return response.data;
  }
  public async listIntents(id: string | null) {
    const skill = await this.getSkillByAppId(id);
    const response = await this.$skillHttp.get(
      `${this._config.skill_endpoint}/skill/domains/${id}/${skill.domainId}.do`
    );
    return response.data;
  }
  public async getSkillByAppId(id: string | null) {
    const response = await this.$skillHttp.get(`/skill/apps/${id}.do`);
    return response.data;
  }
  public async uploadIntents(
    id: string | null,
    intents: object,
    autoCompile: boolean
  ) {
    const skill = await this.getSkillByAppId(id);
    await this.$skillHttp.post(
      `/skill/domains/${id}/${skill.appDetailId}/${skill.domainId}/intents.do`,
      intents
    );

    if (autoCompile) {
      await this.compile(skill.domainId);
    }
    return skill;
  }
  public async compile(domainId: string) {
    const spinner = ora("正在上传").start();
    await this.$skillHttp.get(`/skill/domains/${domainId}/compile.do`);
    return new Promise((resolve, reject) => {
      spinner.text = "编译中";
      const checker = setInterval(async () => {
        const pending = await this.$skillHttp.get(
          "/skill/apps/nlpsc/sc/query.do",
          {
            params: { domainId }
          }
        );
        if (pending.data.status === 2) {
          clearInterval(checker);
          spinner.succeed(pending.data.msg || "编译成功");
          resolve(true);
        }
      }, 2000);
    });
  }
  public async testIntents(appId: string | null, sentence: string | null) {
    const response = await this.$skillHttp.get(
      `/skill/integration-test/nlp/test.do`,
      {
        params: {
          appId,
          sentence
        }
      }
    );
    return response.data;
  }
  public async getServerInfo(appId: string | null) {
    const response = await this.$skillHttp.get(
      `/skill/apps/${appId}/server.do`
    );
    return response.data;
  }
  public async getJsGroupId(appId: string | null) {
    await this.execBefore();
    const data = await this.getServerInfo(appId);
    await this.execAfter();
    return data.jsGroupId; // ******-script-group
  }
  public async getBackService(appId: string | null) {
    const data = await this.getServerInfo(appId);
    return data.backService; // ******-script same with jsInfoId
  }
  // RFS
  // @id string|null appId|jsGroupID
  public async getJsGroupInfo(id: string | null) {
    await this.execBefore();
    let tmpID = id;
    if (tmpID === null) {
      tmpID = "";
    }
    let re = RegExp(".*-script-group$");
    if (!re.test(tmpID)) {
      id = await this.getJsGroupId(id);
    }
    const response = await this.$rfsHttp.get(
      `/skill/js/${id}/groupEditInfo.do`
    );
    await this.execAfter();
    return response.data;
  }
  // @id string|null BackServiceID|jsInfoID
  public async getTestCase(id: string | null) {
    const response = await this.$rfsHttp.get(
      `/skill/test/${id}/getTestCase.do`
    );
    return response.data;
  }
  public async setDefaultSkill(skillInfo: any) {
    await this.execBefore();
    this._config.user.skill = skillInfo;

    const intents = await this.listIntents(skillInfo.appId);
    const rfs = await this.getJsGroupInfo(skillInfo.appId);
    const testCase = await this.getTestCase(rfs.data.jsInfoVO.jsInfoId);

    this._config.user.rfs = {
      jsGroupId: rfs.data.jsInfoVO.jsGroupId,
      jsInfoId: rfs.data.jsInfoVO.jsInfoId,
      jsTestCaseId: testCase.data.jsTestCaseId
    };
    this._config.user.intents = intents;

    await this.execAfter();
  }
  // Helpers
  private async execBefore() {
    this.init();
    this.loadConfig();
  }
  private async execAfter(response?: AxiosResponse) {
    if (response) {
      this.addCookie(response.headers["set-cookie"]);
    }
    this.saveConfig();
  }
  private init() {
    const cookies = this._config.user.cookies
      ? this._config.user.cookies.join("; ")
      : "";
    this.$skillHttp = axios.create({
      baseURL: this._config.skill_endpoint,
      headers: {
        cookie: cookies
      }
    });
    this.$rfsHttp = axios.create({
      baseURL: this._config.rfs_endpoint,
      headers: {
        cookie: this._config.user.cookies.join("; ")
      }
    });
  }
  private addCookie(items: any) {
    var nullArray = function(arr: any) {
      if (Array.isArray(arr)) {
        if (arr.length === 0) {
          return false;
        }
        return true;
      }
      return false;
    };
    var arrayUnique = function(arr: any) {
      var result = [];
      var l = arr.length;
      if (nullArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
          var temp = arr.slice(i + 1, l);
          if (temp.indexOf(arr[i]) === -1) {
            result.push(arr[i]);
          } else {
            continue;
          }
        }
      }
      return result;
    };
    this._config.user.cookies = this._config.user.cookies.concat(
      items,
      this._config.user.cookies
    );
    this._config.user.cookies = arrayUnique(this._config.user.cookies);
    this.saveConfig();
    this.init();
  }
  private ensureConfigDir() {
    var exists = fs.existsSync(this._configPath);
    if (!exists) {
      fs.mkdirSync(this._configPath);
    }
    var profileExists = fs.existsSync(this._configFile);
    if (!profileExists) {
      fs.writeFileSync(this._configFile, "{}");
    }
  }
  private saveConfig() {
    fs.writeFileSync(
      this._configFile,
      JSON.stringify(this._config, null, "\t")
    );
  }
  private loadConfig() {
    this.ensureConfigDir();
    // require is async, so use readFileSync
    // var data = require(this._configFile);
    var dataStr = fs.readFileSync(this._configFile, "utf-8");
    var data = JSON.parse(dataStr);
    this._config = Object.assign({}, this._config, data);
  }
}
