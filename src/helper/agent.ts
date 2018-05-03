"use strict";

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ConfigStore } from "./configStore";

const ora = require("ora");
const crypto = require("crypto");

export class Agent {
  _config: any;
  $skillHttp: AxiosInstance;
  $rfsHttp: AxiosInstance;
  public constructor() {
    const cookies = ConfigStore.getCookies();
    this.$skillHttp = axios.create({
      baseURL: ConfigStore._config.skill_endpoint,
      headers: {
        cookie: cookies
      }
    });
    this.$rfsHttp = axios.create({
      baseURL: ConfigStore._config.rfs_endpoint,
      headers: {
        cookie: cookies
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
      `${ConfigStore._config.account_endpoint}/login.do`,
      body
    );
    if (username !== null) {
      ConfigStore._config.user.username = username;
    }
    await this.execAfter(response);
    return response;
  }
  public async listSkills() {
    await this.execBefore();
    const response = await this.$skillHttp.get(
      "/skill/apps.do?page_num=1&page_size=20"
    );
    await this.execAfter(response);
    return response;
  }
  public async listIntents(id: string | null) {
    const skill = await this.getSkillByAppId(id);
    const response = await this.$skillHttp.get(
      `${ConfigStore._config.skill_endpoint}/skill/domains/${id}/${
        skill.data.domainId
      }.do`
    );
    return response;
  }
  public async getSkillByAppId(id: string | null) {
    const response = await this.$skillHttp.get(`/skill/apps/${id}.do`);
    return response;
  }
  public async uploadIntents(
    id: string | null,
    intents: object,
    autoCompile: boolean
  ) {
    const skillResp = await this.getSkillByAppId(id);
    const skill = skillResp.data;
    const intentsUploadResp = await this.$skillHttp.post(
      `/skill/domains/${id}/${skill.appDetailId}/${skill.domainId}/intents.do`,
      intents
    );
    if (autoCompile) {
      await this.compile(skill.domainId);
    }
    return intentsUploadResp;
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
    return response;
  }
  public async testNlp(appId: string | null, sentence: string | null) {
    const response = await this.$skillHttp.get(
      `/skill/integration-test/nlp.do`,
      {
        params: {
          appId,
          sentence
        }
      }
    );
    return response;
  }
  public async getServerInfo(appId: string | null) {
    const response = await this.$skillHttp.get(
      `/skill/apps/${appId}/server.do`
    );
    return response;
  }
  public async getJsGroupId(appId: string | null) {
    await this.execBefore();
    const serverInfo = await this.getServerInfo(appId);
    await this.execAfter();
    return serverInfo.data.jsGroupId; // ******-script-group
  }
  public async getBackService(appId: string | null) {
    const serverInfo = await this.getServerInfo(appId);
    return serverInfo.data.backService; // ******-script same with jsInfoId
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
    return response;
  }
  // @id string|null BackServiceID|jsInfoID
  public async getTestCase(id: string | null) {
    const response = await this.$rfsHttp.get(
      `/skill/test/${id}/getTestCase.do`
    );
    return response;
  }
  public async saveTestCase(data: any) {
    const response = await this.$rfsHttp.post(`/skill/test/save.do`, data);
    return response;
  }
  // local method
  public async setDefaultSkill(skillInfo: any) {
    await this.execBefore();

    const intentsResp = await this.listIntents(skillInfo.appId);
    const intents = intentsResp.data;

    const rfsResp = await this.getJsGroupInfo(skillInfo.appId);
    const rfs = rfsResp.data;

    const testCaseResp = await this.getTestCase(rfs.data.jsInfoVO.jsInfoId);
    const testCase = testCaseResp.data;
    console.log(testCase);

    ConfigStore._config.skill = skillInfo;
    ConfigStore._config.rfs = {
      jsGroupId: rfs.data.jsInfoVO.jsGroupId,
      jsInfoId: rfs.data.jsInfoVO.jsInfoId,
      jsTestCaseId: testCase.data.jsTestCaseId
    };
    ConfigStore._config.intents = intents;

    await this.execAfter();
  }
  // Helpers
  public async execBefore() {
    ConfigStore.reload();
    this.init();
  }
  public async execAfter(response?: AxiosResponse) {
    ConfigStore.procResponse(response);
  }
  private init() {
    const cookies = ConfigStore.getCookies();
    this.$skillHttp = axios.create({
      baseURL: ConfigStore._config.skill_endpoint,
      headers: {
        cookie: cookies
      }
    });
    this.$rfsHttp = axios.create({
      baseURL: ConfigStore._config.rfs_endpoint,
      headers: {
        cookie: cookies
      }
    });
  }
}
