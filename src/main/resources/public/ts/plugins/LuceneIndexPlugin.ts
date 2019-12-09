console.log("FolderTypeHandler.ts");

import * as I from "../Interfaces";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { TypeHandlerIntf } from "../intf/TypeHandlerIntf";
import { Comp } from "../widget/base/Comp";
import { VerticalLayout } from "../widget/VerticalLayout";
import { Button } from "../widget/Button";
import { LuceneIndexPluginIntf } from "../intf/LuceneIndexPluginIntf";
import { Heading } from "../widget/Heading";
import { SearchFileSystemDlg } from "../dlg/SearchFileSystemDlg";
import { ButtonBar } from "../widget/ButtonBar";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class LuceneIndexTypeHandler implements TypeHandlerIntf {
    constructor(private luceneIndexPlugin: LuceneIndexPlugin) {
    }

    render = (node: I.NodeInfo, rowStyling: boolean): Comp => {
        let name = node.content;

        let vertLayout = new VerticalLayout([
            new Heading(3, name, {
                style:
                {
                    marginLeft: "15px",
                    marginTop: "15px"
                }
            }),
            new ButtonBar([
                new Button("Reindex", () => { this.luceneIndexPlugin.reindexNodeButton(node) }, {
                    className: "bash-exec-button"
                }),
                new Button("Search", () => { this.luceneIndexPlugin.search(node) }, {
                    className: "bash-exec-button"
                })])
        ]);
        return vertLayout;
    }

    orderProps(node: I.NodeInfo, _props: I.PropertyInfo[]): I.PropertyInfo[] {
        return _props;
    }

    getIconClass(node: I.NodeInfo): string {
        //https://www.w3schools.com/icons/fontawesome_icons_webapp.asp
        return "fa fa-binoculars fa-lg";
    }

    allowAction(action: string): boolean {
        return true;
    }
}

export class LuceneIndexPlugin implements LuceneIndexPluginIntf {
    luceneIndexTypeHandler: TypeHandlerIntf = new LuceneIndexTypeHandler(this);

    init = () => {
        S.meta64.addTypeHandler("luceneIndex", this.luceneIndexTypeHandler);
    }

    reindexNodeButton = (node: I.NodeInfo): void => {
        let searchDir = S.props.getNodePropertyVal("searchDir", node);
        if (!searchDir) {
            alert("no searchDir property specified.");
            return;
        }

        S.util.ajax<I.LuceneIndexRequest, I.LuceneIndexResponse>("luceneIndex", {
            "nodeId": node.id,
            "path": searchDir
        }, this.executeNodeResponse);
    }

    search = (node: I.NodeInfo): void => {
        new SearchFileSystemDlg().open();
    }

    private executeNodeResponse = (res: I.LuceneIndexResponse): void => {
        console.log("ExecuteNodeResponse running.");

        S.util.checkSuccess("Execute Node", res);
        S.util.showMessage(res.message, true, "modal-lg");

        // S.view.refreshTree(null, false);
        // S.meta64.selectTab("mainTab");
        // S.view.scrollToSelectedNode(null);
    }
}
