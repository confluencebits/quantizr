import { DialogBase } from "../DialogBase";
import * as I from "../Interfaces";
import { ButtonBar } from "../widget/ButtonBar";
import { Button } from "../widget/Button";
import { TextField } from "../widget/TextField";
import { TextContent } from "../widget/TextContent";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { Form } from "../widget/Form";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class SearchFileSystemDlg extends DialogBase {

    static defaultSearchText: string = "";
    searchTextField: TextField;

    constructor() {
        super("Search File System");

        this.setChildren([
            new Form(null, [
                new TextContent("Enter text to find. Only content text will be searched. All sub-nodes under the selected node are included in the search."),
                this.searchTextField = new TextField({
                    placeholder: "",
                    label: "Search",
                    onKeyPress: (e) => {
                        if (e.which == 13) { // 13==enter key code
                            this.searchNodes();
                            return false;
                        }
                    }
                }, SearchFileSystemDlg.defaultSearchText),
                new ButtonBar([
                    new Button("Search", this.searchNodes),
                    new Button("Close", () => {
                        this.close();
                    })
                ])
            ])
        ]);
    }

    searchNodes = (): void => {
        if (!S.util.ajaxReady("searchNodes")) {
            return;
        }

        // until we have better validation
        let node = S.meta64.getHighlightedNode();
        if (!node) {
            S.util.showMessage("No node is selected to search under.");
            return;
        }

        // until better validation, just check for empty
        let searchText = this.searchTextField.getValue();
        if (S.util.emptyString(searchText)) {
            S.util.showMessage("Enter search text.");
            return;
        }

        SearchFileSystemDlg.defaultSearchText = searchText;

        S.util.ajax<I.LuceneSearchRequest, I.LuceneSearchResponse>("luceneSearch", {
            "nodeId": node.id,
            "text": searchText
        }, this.searchNodesResponse);
    }

    searchNodesResponse = (res: I.NodeSearchResponse) => {
        S.util.showMessage(res.message, true, "modal-lg");
        this.close();
    }

    init = (): void => {
        this.searchTextField.focus();
    }
}
