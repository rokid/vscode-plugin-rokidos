"use strict";

import { ResponseStore } from "../helper/responseStore";
import * as vscode from "vscode";
import { BaseTextDocumentContentProvider } from "./baseTextDocumentContentProvider";

export class RokidResponseDocumentContentProvider extends BaseTextDocumentContentProvider {
  public constructor() {
    super();
  }
  public provideTextDocumentContent(uri: vscode.Uri): string {
    if (uri) {
      let item = ResponseStore.get(uri.toString());
      if (item) {
        console.log(item);
        let innerHtml: string;
        let code =
          item.data && Object.keys(item.data).length > 0
            ? JSON.stringify(item.data, null, "\t")
            : JSON.stringify(item.resp.data, null, "\t");
        innerHtml = `<pre><code>${code}</code></pre>`;
        return `<head>
        </head>
        <body>
            <div>
                ${innerHtml}
                <a id="scroll-to-top" role="button" aria-label="scroll to top" onclick="scroll(0,0)"><span class="icon"></span></a>
            </div>
        </body>`;
      } else {
        return "";
      }
    } else {
      return "";
    }
  }
}
