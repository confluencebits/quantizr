console.log("ImportDlg.ts");


import { DialogBase } from "../DialogBase";
import * as I from "../Interfaces";
import { MessageDlg } from "./MessageDlg";
import { ButtonBar } from "../widget/ButtonBar";
import { Button } from "../widget/Button";
import { TextField } from "../widget/TextField";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";

let S : Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class ImportDlg extends DialogBase {

  importFromFileNameTextField: TextField;

    constructor() {
        super("Import from XML");
        
        this.setChildren([
            this.importFromFileNameTextField = new TextField({
                "placeholder": "",
                "label": "File Name to Import"
            }),
            new ButtonBar([
                new Button("Import", this.importNodes),
                new Button("Close", () => {
                    this.close();
                })
            ])
        ]);
    }

    importNodes = (): void => {
        var highlightNode = S.meta64.getHighlightedNode();
        var sourceFileName = this.importFromFileNameTextField.getValue();

        if (S.util.emptyString(sourceFileName)) {
            new MessageDlg("Please enter a name for the import file.", "Import").open();
            return;
        }

        if (highlightNode) {
            S.util.ajax<I.ImportRequest, I.ImportResponse>("import", {
                "nodeId": highlightNode.id,
                "sourceFileName": sourceFileName
            }, this.importResponse);
        }
        this.close();
    }

    importResponse = (res: I.ImportResponse): void => {
        if (S.util.checkSuccess("Import", res)) {
            new MessageDlg("Import Successful", "Import").open();

            S.view.refreshTree(null, false);
            S.meta64.selectTab("mainTab");
            S.view.scrollToSelectedNode();
        }
    }
}